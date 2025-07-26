import { databaseService, SyncStatus } from './databaseService';
import { apiService } from './apiService';
import { 
  Person, Group, Note, ActionItem, Device, UserProfile,
  GrowthGoal, GrowthMilestone, PersonSkill, GrowthPlan, GrowthAssessment
} from '../types';

export interface SyncResult {
  success: boolean;
  synchronized: number;
  conflicts: number;
  errors: string[];
}

export interface ConflictResolution {
  table: string;
  recordId: string;
  resolution: 'local' | 'remote' | 'merge';
  mergedData?: any;
}

class SyncService {
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private lastSyncTime: Date | null = null;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.startAutoSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async initialize(): Promise<void> {
    await databaseService.initialize();
    
    if (this.isOnline) {
      this.startAutoSync();
    }
  }

  private startAutoSync(): void {
    // Auto-sync every 30 seconds when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncWithServer().catch(console.error);
      }
    }, 30000);
  }

  async syncWithServer(resolveConflicts?: ConflictResolution[]): Promise<SyncResult> {
    if (!this.isOnline || this.syncInProgress) {
      return { success: false, synchronized: 0, conflicts: 0, errors: ['Offline or sync in progress'] };
    }

    this.syncInProgress = true;
    const result: SyncResult = { success: true, synchronized: 0, conflicts: 0, errors: [] };

    try {
      // Step 1: Push local changes to server
      await this.pushLocalChanges(result);

      // Step 2: Pull remote changes from server
      await this.pullRemoteChanges(result, resolveConflicts);

      this.lastSyncTime = new Date();
    } catch (error) {
      console.error('Sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  private async pushLocalChanges(result: SyncResult): Promise<void> {
    const pendingRecords = await databaseService.getPendingSyncRecords();

    for (const syncRecord of pendingRecords) {
      try {
        const localData = await databaseService.findById(syncRecord.table_name, syncRecord.record_id);
        
        if (!localData) {
          // Record was deleted locally
          await this.deleteRemoteRecord(syncRecord.table_name, syncRecord.record_id);
        } else {
          // Record was created or updated locally
          await this.upsertRemoteRecord(syncRecord.table_name, localData);
        }

        await databaseService.markSynced(syncRecord.table_name, syncRecord.record_id);
        result.synchronized++;
      } catch (error) {
        console.error(`Failed to sync ${syncRecord.table_name}:${syncRecord.record_id}:`, error);
        result.errors.push(`Failed to sync ${syncRecord.table_name}:${syncRecord.record_id}`);
      }
    }
  }

  private async pullRemoteChanges(result: SyncResult, resolveConflicts?: ConflictResolution[]): Promise<void> {
    const lastSync = this.lastSyncTime?.toISOString() || '1970-01-01T00:00:00.000Z';

    try {
      // Pull all data types from server
      const tables = [
        'people', 'groups', 'notes', 'action_items', 'devices',
        'growth_goals', 'growth_milestones', 'person_skills', 
        'growth_plans', 'growth_assessments'
      ];

      for (const table of tables) {
        await this.pullTableData(table, lastSync, result, resolveConflicts);
      }
    } catch (error) {
      console.error('Failed to pull remote changes:', error);
      result.errors.push('Failed to pull remote changes');
    }
  }

  private async pullTableData(
    table: string, 
    lastSync: string, 
    result: SyncResult, 
    resolveConflicts?: ConflictResolution[]
  ): Promise<void> {
    try {
      const response = await apiService.get(`/${table}/sync?since=${lastSync}`);
      const remoteRecords = response.data || [];

      for (const remoteRecord of remoteRecords) {
        const localRecord = await databaseService.findById(table, remoteRecord.id);
        
        if (!localRecord) {
          // New record from server
          await databaseService.insert(table, remoteRecord);
          await databaseService.markSynced(table, remoteRecord.id);
          result.synchronized++;
        } else {
          // Check for conflicts
          const localUpdated = new Date(localRecord.updatedAt);
          const remoteUpdated = new Date(remoteRecord.updatedAt);

          if (localUpdated > remoteUpdated) {
            // Local is newer, no action needed
            continue;
          } else if (remoteUpdated > localUpdated) {
            // Remote is newer, update local
            await databaseService.update(table, remoteRecord.id, remoteRecord);
            await databaseService.markSynced(table, remoteRecord.id);
            result.synchronized++;
          } else {
            // Same timestamp but different content - conflict
            const conflict = resolveConflicts?.find(
              c => c.table === table && c.recordId === remoteRecord.id
            );

            if (conflict) {
              await this.resolveConflict(table, remoteRecord.id, localRecord, remoteRecord, conflict);
              result.synchronized++;
            } else {
              result.conflicts++;
              await databaseService.updateSyncStatus(table, remoteRecord.id, 'conflict');
            }
          }
        }
      }
    } catch (error) {
      console.error(`Failed to pull ${table} data:`, error);
      result.errors.push(`Failed to pull ${table} data`);
    }
  }

  private async resolveConflict(
    table: string,
    recordId: string,
    localRecord: any,
    remoteRecord: any,
    resolution: ConflictResolution
  ): Promise<void> {
    let finalRecord: any;

    switch (resolution.resolution) {
      case 'local':
        finalRecord = localRecord;
        break;
      case 'remote':
        finalRecord = remoteRecord;
        break;
      case 'merge':
        finalRecord = resolution.mergedData || this.mergeRecords(localRecord, remoteRecord);
        break;
    }

    await databaseService.update(table, recordId, finalRecord);
    await databaseService.markSynced(table, recordId);

    // Push the resolved version to server if we chose local or merge
    if (resolution.resolution !== 'remote') {
      await this.upsertRemoteRecord(table, finalRecord);
    }
  }

  private mergeRecords(local: any, remote: any): any {
    // Simple merge strategy - prefer non-empty values
    const merged = { ...remote };

    for (const key in local) {
      if (local[key] && (!remote[key] || local[key].length > remote[key].length)) {
        merged[key] = local[key];
      }
    }

    // Always use the later updatedAt timestamp
    merged.updatedAt = new Date().toISOString();

    return merged;
  }

  private async upsertRemoteRecord(table: string, data: any): Promise<void> {
    try {
      // Try to determine if this is a create or update operation
      const endpoint = this.getApiEndpoint(table);
      
      // First try to update
      try {
        await apiService.put(`${endpoint}/${data.id}`, data);
      } catch (error) {
        // If update fails, try to create
        await apiService.post(endpoint, data);
      }
    } catch (error) {
      console.error(`Failed to upsert ${table} record:`, error);
      throw error;
    }
  }

  private async deleteRemoteRecord(table: string, recordId: string): Promise<void> {
    try {
      const endpoint = this.getApiEndpoint(table);
      await apiService.delete(`${endpoint}/${recordId}`);
    } catch (error) {
      console.error(`Failed to delete ${table} record:`, error);
      // Don't throw - deletion might have already happened
    }
  }

  private getApiEndpoint(table: string): string {
    const endpointMap: Record<string, string> = {
      'people': '/people',
      'groups': '/groups',
      'notes': '/notes',
      'action_items': '/action-items',
      'devices': '/devices',
      'growth_goals': '/growth/goals',
      'growth_milestones': '/growth/milestones',
      'person_skills': '/growth/skills',
      'growth_plans': '/growth/plans',
      'growth_assessments': '/growth/assessments'
    };

    return endpointMap[table] || `/${table}`;
  }

  async getConflicts(): Promise<SyncStatus[]> {
    return await databaseService.findAll<SyncStatus>('sync_status', 'sync_status = ?', ['conflict']);
  }

  async forcePull(): Promise<SyncResult> {
    // Clear local data and pull everything from server
    const result: SyncResult = { success: true, synchronized: 0, conflicts: 0, errors: [] };

    try {
      const tables = [
        'people', 'groups', 'notes', 'action_items', 'devices',
        'growth_goals', 'growth_milestones', 'person_skills', 
        'growth_plans', 'growth_assessments'
      ];

      for (const table of tables) {
        await databaseService.clearTable(table);
        await this.pullTableData(table, '1970-01-01T00:00:00.000Z', result);
      }

      this.lastSyncTime = new Date();
    } catch (error) {
      console.error('Force pull failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  async forcePush(): Promise<SyncResult> {
    // Push all local data to server, overwriting remote
    const result: SyncResult = { success: true, synchronized: 0, conflicts: 0, errors: [] };

    try {
      const tables = [
        'people', 'groups', 'notes', 'action_items', 'devices',
        'growth_goals', 'growth_milestones', 'person_skills', 
        'growth_plans', 'growth_assessments'
      ];

      for (const table of tables) {
        const records = await databaseService.findAll(table);
        for (const record of records) {
          await this.upsertRemoteRecord(table, record);
          await databaseService.markSynced(table, (record as any).id);
          result.synchronized++;
        }
      }

      this.lastSyncTime = new Date();
    } catch (error) {
      console.error('Force push failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  isConnected(): boolean {
    return this.isOnline;
  }

  isSyncing(): boolean {
    return this.syncInProgress;
  }

  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }
}

export const syncService = new SyncService();