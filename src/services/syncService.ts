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
    // Auto-sync every 1 minute when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncWithServer().catch(console.error);
      }
    }, 60000);
    console.log('Auto-sync enabled - syncing every 1 minute when online');
  }

  async syncWithServer(resolveConflicts?: ConflictResolution[]): Promise<SyncResult> {
    if (!this.isOnline || this.syncInProgress) {
      return { success: false, synchronized: 0, conflicts: 0, errors: ['Offline or sync in progress'] };
    }

    this.syncInProgress = true;
    const result: SyncResult = { success: true, synchronized: 0, conflicts: 0, errors: [] };

    console.log('🔄 Starting sync with server...');

    try {
      // Step 1: Pull remote changes from server first
      console.log('⬇️ Pulling changes from server...');
      await this.pullRemoteChanges(result, resolveConflicts);

      // Step 2: Push local changes to server
      console.log('⬆️ Pushing local changes to server...');
      await this.pushLocalChanges(result);

      this.lastSyncTime = new Date();
      console.log(`✅ Sync completed successfully - ${result.synchronized} records synchronized`);
    } catch (error) {
      console.error('❌ Sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  private async pushLocalChanges(result: SyncResult): Promise<void> {
    const pendingRecords = await databaseService.getPendingSyncRecords();
    
    if (pendingRecords.length === 0) {
      console.log('📤 No local changes to push');
      return;
    }

    console.log(`📤 Pushing ${pendingRecords.length} local changes...`);

    // Group records by table for batch operations
    const recordsByTable = new Map<string, any[]>();

    for (const syncRecord of pendingRecords) {
      try {
        const localData = await databaseService.findById(syncRecord.table_name, syncRecord.record_id);
        
        if (!recordsByTable.has(syncRecord.table_name)) {
          recordsByTable.set(syncRecord.table_name, []);
        }

        const tableRecords = recordsByTable.get(syncRecord.table_name)!;
        
        if (!localData) {
          // Record was deleted locally
          tableRecords.push({
            id: syncRecord.record_id,
            operation: 'delete',
            client_updated_at: syncRecord.local_updated
          });
        } else {
          // Transform data for API format
          const transformedData = this.transformRecordForAPI(syncRecord.table_name, localData);
          
          // Determine if it's create or update based on whether it exists on server
          const operation = 'create'; // Backend will handle create vs update logic
          tableRecords.push({
            id: syncRecord.record_id,
            operation,
            data: transformedData,
            client_updated_at: syncRecord.local_updated
          });
        }
      } catch (error) {
        console.error(`Failed to prepare sync for ${syncRecord.table_name}:${syncRecord.record_id}:`, error);
        result.errors.push(`Failed to prepare sync for ${syncRecord.table_name}:${syncRecord.record_id}`);
      }
    }

    // Push records table by table using batch sync
    for (const [tableName, records] of recordsByTable) {
      try {
        await this.batchSyncTable(tableName, records, result);
      } catch (error) {
        console.error(`Failed to batch sync ${tableName}:`, error);
        result.errors.push(`Failed to batch sync ${tableName}`);
      }
    }
  }

  private async pullRemoteChanges(result: SyncResult, resolveConflicts?: ConflictResolution[]): Promise<void> {
    const lastSync = this.lastSyncTime?.toISOString() || '1970-01-01T00:00:00.000Z';
    console.log(`📥 Pulling changes since: ${lastSync}`);

    try {
      // Pull only active data types from server (growth features disabled)
      const tables = [
        'people', 'groups', 'people_groups', 'notes', 'action_items', 'devices'
      ];

      for (const table of tables) {
        console.log(`📥 Pulling ${table}...`);
        try {
          await this.pullTableData(table, lastSync, result, resolveConflicts);
        } catch (error) {
          console.error(`📥 Failed to pull ${table}:`, error);
          result.errors.push(`Failed to pull ${table}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Failed to pull remote changes:', error);
      result.errors.push('Failed to pull remote changes');
    }
  }

  private async batchSyncTable(tableName: string, records: any[], result: SyncResult): Promise<void> {
    if (records.length === 0) return;

    const endpoint = this.getApiEndpoint(tableName);
    console.log(`📤 Batch syncing ${records.length} records to ${endpoint}`);

    try {
      // Use POST method to the sync endpoint directly (not /batch-sync)
      const response = await apiService.post(endpoint, { records });
      
      if (response.success && response.data?.results) {
        // Process sync results according to OpenAPI spec
        for (const syncResult of response.data.results) {
          if (syncResult.status === 'created' || syncResult.status === 'updated' || syncResult.status === 'deleted') {
            await databaseService.markSynced(tableName, syncResult.id);
            result.synchronized++;
            console.log(`📤 Synced ${tableName}:${syncResult.id} - ${syncResult.status}`);
          } else if (syncResult.status === 'conflict') {
            result.conflicts++;
            await databaseService.updateSyncStatus(tableName, syncResult.id, 'conflict');
            console.warn(`⚠️ Conflict detected for ${tableName}:${syncResult.id}`);
          } else if (syncResult.status === 'not_found') {
            console.warn(`⚠️ Record not found for ${tableName}:${syncResult.id}`);
            result.errors.push(`Record not found: ${tableName}:${syncResult.id}`);
          }
        }
      }
    } catch (error) {
      console.error(`Batch sync failed for ${tableName}:`, error);
      throw error;
    }
  }

  private async pullTableData(
    table: string, 
    lastSync: string, 
    result: SyncResult, 
    resolveConflicts?: ConflictResolution[]
  ): Promise<void> {
    try {
      const endpoint = this.getApiEndpoint(table);
      const response = await apiService.get(`${endpoint}?since=${encodeURIComponent(lastSync)}&limit=100`);
      
      if (!response.success || !response.data) {
        console.log(`📥 No data returned for ${table}`);
        return;
      }

      // According to OpenAPI spec, the response format is { data: [], last_sync: "", has_more: boolean }
      const remoteRecords = response.data.data || [];
      console.log(`📥 Received ${remoteRecords.length} records for ${table}`);

      for (const remoteRecord of remoteRecords) {
        try {
          // Handle soft deletes
          if (remoteRecord.deleted_at) {
            await databaseService.delete(table, remoteRecord.id);
            await databaseService.markSynced(table, remoteRecord.id);
            result.synchronized++;
            continue;
          }

          const localRecord = await databaseService.findById(table, remoteRecord.id);
          
          if (!localRecord) {
            // New record from server
            const transformedRecord = this.transformRecordForDB(table, remoteRecord);
            await databaseService.insert(table, transformedRecord);
            await databaseService.markSynced(table, remoteRecord.id);
            result.synchronized++;
            console.log(`📥 Added new ${table}: ${remoteRecord.id}`);
          } else {
            // Check for conflicts
            const localUpdated = new Date(localRecord.updated_at || localRecord.updatedAt);
            const remoteUpdated = new Date(remoteRecord.updated_at || remoteRecord.updatedAt);

            if (localUpdated > remoteUpdated) {
              // Local is newer, no action needed
              continue;
            } else if (remoteUpdated > localUpdated) {
              // Remote is newer, update local
              const transformedRecord = this.transformRecordForDB(table, remoteRecord);
              await databaseService.update(table, remoteRecord.id, transformedRecord);
              await databaseService.markSynced(table, remoteRecord.id);
              result.synchronized++;
              console.log(`📥 Updated ${table}: ${remoteRecord.id}`);
            } else {
              // Same timestamp but different content - potential conflict
              const conflict = resolveConflicts?.find(
                c => c.table === table && c.recordId === remoteRecord.id
              );

              if (conflict) {
                await this.resolveConflict(table, remoteRecord.id, localRecord, remoteRecord, conflict);
                result.synchronized++;
              } else {
                result.conflicts++;
                await databaseService.updateSyncStatus(table, remoteRecord.id, 'conflict');
                console.warn(`⚠️ Conflict detected for ${table}: ${remoteRecord.id}`);
              }
            }
          }
        } catch (error) {
          console.error(`Failed to process ${table} record ${remoteRecord.id}:`, error);
          result.errors.push(`Failed to process ${table} record ${remoteRecord.id}`);
        }
      }
    } catch (error) {
      console.error(`Failed to pull ${table} data:`, error);
      result.errors.push(`Failed to pull ${table} data`);
    }
  }

  private transformRecordForDB(table: string, record: any): any {
    // Transform API record format to database format
    const transformed = { ...record };
    
    // Handle common field transformations
    if (record.first_name) transformed.first_name = record.first_name;
    if (record.last_name) transformed.last_name = record.last_name;
    if (record.created_at) transformed.created_at = record.created_at;
    if (record.updated_at) transformed.updated_at = record.updated_at;
    
    // Handle arrays that need to be JSON strings
    if (record.tags && Array.isArray(record.tags)) {
      transformed.tags = JSON.stringify(record.tags);
    }
    
    // Handle encrypted records - decrypt and store for faster local access
    if (table === 'notes' && record.encrypted && record.encrypted_content) {
      try {
        // Decrypt the content for local storage
        const decryptedData = this.decryptContent(record.encrypted_content);
        
        if (decryptedData) {
          // Store decrypted data in the local fields for faster access
          if (decryptedData.content !== undefined) {
            transformed.content = decryptedData.content;
          }
          if (decryptedData.type) {
            transformed.type = decryptedData.type;
          }
          if (decryptedData.tags && Array.isArray(decryptedData.tags)) {
            transformed.tags = JSON.stringify(decryptedData.tags);
          }
        }
      } catch (error) {
        console.warn('Failed to decrypt note content, using defaults:', error);
        // Fallback to default values
        if (!transformed.type) {
          transformed.type = 'personal';
        }
        if (!transformed.content) {
          transformed.content = '';
        }
      }
    }
    
    if (table === 'action_items' && record.encrypted_content) {
      try {
        // Decrypt the content for local storage
        const decryptedData = this.decryptContent(record.encrypted_content);
        
        if (decryptedData) {
          // Store decrypted data in the local fields for faster access
          if (decryptedData.title) {
            transformed.title = decryptedData.title;
          }
          if (decryptedData.description !== undefined) {
            transformed.description = decryptedData.description;
          }
        }
        
        // Ensure required fields have values
        if (!transformed.title) {
          transformed.title = 'Encrypted Action Item';
        }
        if (!transformed.assignee_id) {
          transformed.assignee_id = transformed.user_id;
        }
        if (!transformed.assignee_name) {
          transformed.assignee_name = 'Unknown';
        }
      } catch (error) {
        console.warn('Failed to decrypt action item content, using defaults:', error);
        // Fallback to default values
        if (!transformed.title) {
          transformed.title = 'Encrypted Action Item';
        }
        if (!transformed.assignee_id) {
          transformed.assignee_id = transformed.user_id;
        }
        if (!transformed.assignee_name) {
          transformed.assignee_name = 'Unknown';
        }
      }
    }
    
    return transformed;
  }

  private decryptContent(encryptedContent: string): any {
    try {
      // Handle different possible formats of encrypted content
      
      // First, try to parse as direct JSON (unencrypted)
      try {
        return JSON.parse(encryptedContent);
      } catch (jsonError) {
        // Not direct JSON, continue with base64 decoding
      }
      
      // Clean the base64 string of any whitespace or invalid characters
      const cleanedContent = encryptedContent.replace(/[^A-Za-z0-9+/=]/g, '');
      
      // Validate base64 format
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanedContent)) {
        console.warn('Invalid base64 format in encrypted content');
        return null;
      }
      
      // Try base64 decoding
      const decodedContent = atob(cleanedContent);
      return JSON.parse(decodedContent);
      
    } catch (error) {
      console.error('Failed to decrypt content:', error);
      console.error('Encrypted content:', encryptedContent?.substring(0, 100) + '...');
      return null;
    }
  }

  private transformRecordForAPI(table: string, record: any): any {
    // Transform database record format to API format
    const transformed = { ...record };
    
    // Handle JSON string fields that need to become arrays
    if (record.tags && typeof record.tags === 'string') {
      try {
        transformed.tags = JSON.parse(record.tags);
      } catch (e) {
        transformed.tags = [];
      }
    }
    
    // Handle database field name to API field name mappings
    if (table === 'people') {
      // Map database fields to API fields for people
      if (record.first_name) transformed.firstName = record.first_name;
      if (record.last_name) transformed.lastName = record.last_name;
      if (record.job_description) transformed.jobDescription = record.job_description;
      if (record.avatar_url) transformed.avatarUrl = record.avatar_url;
      if (record.github_username) transformed.githubUsername = record.github_username;
      if (record.group_id) transformed.groupId = record.group_id;
      if (record.created_at) transformed.createdAt = record.created_at;
      if (record.updated_at) transformed.updatedAt = record.updated_at;
    }
    
    return transformed;
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
      'people': '/sync/people',
      'groups': '/sync/groups',
      'people_groups': '/sync/people-groups',
      'notes': '/sync/notes',
      'action_items': '/sync/actions',
      'devices': '/devices'
    };

    return endpointMap[table] || `/sync/${table}`;
  }

  async getConflicts(): Promise<SyncStatus[]> {
    return await databaseService.findAll<SyncStatus>('sync_status', 'sync_status = ?', ['conflict']);
  }

  async forcePull(): Promise<SyncResult> {
    // Clear local data and pull everything from server
    const result: SyncResult = { success: true, synchronized: 0, conflicts: 0, errors: [] };

    try {
      const tables = [
        'people', 'groups', 'people_groups', 'notes', 'action_items', 'devices'
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
        'people', 'groups', 'people_groups', 'notes', 'action_items', 'devices'
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

  async manualSync(): Promise<SyncResult> {
    console.log('🔄 Manual sync triggered');
    return await this.syncWithServer();
  }

  getSyncStatus(): { 
    isOnline: boolean; 
    isSync: boolean; 
    lastSync: Date | null; 
    pendingChanges: number;
  } {
    return {
      isOnline: this.isOnline,
      isSync: this.syncInProgress,
      lastSync: this.lastSyncTime,
      pendingChanges: 0 // TODO: Get actual count from database
    };
  }
}

export const syncService = new SyncService();