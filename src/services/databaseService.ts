import Database from '@tauri-apps/plugin-sql';
import { appDataDir } from '@tauri-apps/api/path';
import { 
  Person, Group, Note, ActionItem, Device, UserProfile,
  GrowthGoal, GrowthMilestone, PersonSkill, GrowthPlan, GrowthAssessment
} from '../types';

export interface SyncStatus {
  id: string;
  table_name: string;
  record_id: string;
  last_synced: string;
  local_updated: string;
  sync_status: 'pending' | 'synced' | 'conflict';
  hash: string;
}

class DatabaseService {
  private db: Database | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Get the app data directory path for reference
      const dataDir = await appDataDir();
      console.log('App data directory:', dataDir);
      console.log('SQLite database will be stored at:', `${dataDir}engage360.db`);
      
      this.db = await Database.load('sqlite:engage360.db');
      console.log('SQLite database loaded successfully');
      await this.createTables();
      await this.runMigrations();
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    console.log('Creating database tables...');

    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        avatar TEXT,
        preferences TEXT, -- JSON string
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,

      // People table
      `CREATE TABLE IF NOT EXISTS people (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        job_description TEXT,
        avatar_url TEXT,
        phone TEXT,
        email TEXT,
        github_username TEXT,
        tags TEXT, -- JSON array
        group_id TEXT,
        deleted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (group_id) REFERENCES groups(id)
      )`,

      // Groups table
      `CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        tags TEXT, -- JSON array
        color TEXT,
        member_count INTEGER DEFAULT 0,
        deleted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,

      // Notes table
      `CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        type TEXT CHECK (type IN ('meeting', 'call', 'email', 'personal', 'follow_up')),
        person_id TEXT,
        group_id TEXT,
        tags TEXT, -- JSON array
        encrypted BOOLEAN DEFAULT FALSE,
        encrypted_content TEXT,
        content_iv TEXT,
        device_keys TEXT, -- JSON array
        deleted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (person_id) REFERENCES people(id),
        FOREIGN KEY (group_id) REFERENCES groups(id)
      )`,

      // Action items table
      `CREATE TABLE IF NOT EXISTS action_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT,
        description TEXT,
        status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        assignee_id TEXT,
        assignee_name TEXT,
        due_date TEXT,
        person_id TEXT,
        group_id TEXT,
        note_id TEXT,
        encrypted_content TEXT,
        encrypted_keys TEXT, -- JSON string
        iv TEXT,
        completed_at TEXT,
        deleted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (person_id) REFERENCES people(id),
        FOREIGN KEY (group_id) REFERENCES groups(id),
        FOREIGN KEY (note_id) REFERENCES notes(id)
      )`,

      // Devices table
      `CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        device_name TEXT NOT NULL,
        device_type TEXT NOT NULL,
        platform TEXT,
        version TEXT,
        trusted BOOLEAN DEFAULT FALSE,
        last_used TEXT,
        created_at TEXT NOT NULL
      )`,

      // Growth goals table
      `CREATE TABLE IF NOT EXISTS growth_goals (
        id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL CHECK (category IN ('technical', 'leadership', 'communication', 'business', 'personal', 'other')),
        priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'on_hold', 'completed', 'cancelled')),
        target_date TEXT,
        start_date TEXT,
        completed_date TEXT,
        progress INTEGER DEFAULT 0,
        skills TEXT, -- JSON array
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (person_id) REFERENCES people(id)
      )`,

      // Growth milestones table
      `CREATE TABLE IF NOT EXISTS growth_milestones (
        id TEXT PRIMARY KEY,
        goal_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        target_date TEXT,
        completed_date TEXT,
        is_completed BOOLEAN DEFAULT FALSE,
        order_index INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (goal_id) REFERENCES growth_goals(id)
      )`,

      // Person skills table
      `CREATE TABLE IF NOT EXISTS person_skills (
        id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        skill_id TEXT NOT NULL,
        skill_name TEXT NOT NULL,
        skill_category TEXT NOT NULL,
        current_level INTEGER CHECK (current_level BETWEEN 1 AND 5),
        target_level INTEGER CHECK (target_level BETWEEN 1 AND 5),
        last_assessment_date TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (person_id) REFERENCES people(id)
      )`,

      // Growth plans table
      `CREATE TABLE IF NOT EXISTS growth_plans (
        id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT,
        status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'completed', 'archived')),
        review_frequency TEXT NOT NULL CHECK (review_frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly')),
        last_review_date TEXT,
        next_review_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (person_id) REFERENCES people(id)
      )`,

      // Growth assessments table
      `CREATE TABLE IF NOT EXISTS growth_assessments (
        id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        plan_id TEXT,
        assessment_date TEXT NOT NULL,
        overall_progress INTEGER DEFAULT 0,
        strengths TEXT, -- JSON array
        areas_for_improvement TEXT, -- JSON array
        achievements TEXT, -- JSON array
        challenges TEXT, -- JSON array
        feedback TEXT,
        assessor_id TEXT,
        assessor_type TEXT NOT NULL CHECK (assessor_type IN ('self', 'manager', 'peer', 'mentor', 'external')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (person_id) REFERENCES people(id),
        FOREIGN KEY (plan_id) REFERENCES growth_plans(id)
      )`,

      // Sync status table for tracking synchronization
      `CREATE TABLE IF NOT EXISTS sync_status (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        last_synced TEXT,
        local_updated TEXT NOT NULL,
        sync_status TEXT NOT NULL CHECK (sync_status IN ('pending', 'synced', 'conflict')),
        hash TEXT NOT NULL,
        UNIQUE(table_name, record_id)
      )`
    ];

    for (let i = 0; i < tables.length; i++) {
      try {
        console.log(`Creating table ${i + 1}/${tables.length}...`);
        await this.db.execute(tables[i]);
        console.log(`Table ${i + 1} created successfully`);
      } catch (error) {
        console.error(`Failed to create table ${i + 1}:`, error);
        console.error('SQL:', tables[i]);
        throw error;
      }
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_people_group_id ON people(group_id)',
      'CREATE INDEX IF NOT EXISTS idx_notes_person_id ON notes(person_id)',
      'CREATE INDEX IF NOT EXISTS idx_notes_group_id ON notes(group_id)',
      'CREATE INDEX IF NOT EXISTS idx_action_items_person_id ON action_items(person_id)',
      'CREATE INDEX IF NOT EXISTS idx_action_items_assignee_id ON action_items(assignee_id)',
      'CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON action_items(due_date)',
      'CREATE INDEX IF NOT EXISTS idx_growth_goals_person_id ON growth_goals(person_id)',
      'CREATE INDEX IF NOT EXISTS idx_growth_milestones_goal_id ON growth_milestones(goal_id)',
      'CREATE INDEX IF NOT EXISTS idx_person_skills_person_id ON person_skills(person_id)',
      'CREATE INDEX IF NOT EXISTS idx_sync_status_table_record ON sync_status(table_name, record_id)',
      'CREATE INDEX IF NOT EXISTS idx_sync_status_status ON sync_status(sync_status)'
    ];

    console.log('Creating indexes...');
    for (let i = 0; i < indexes.length; i++) {
      try {
        await this.db.execute(indexes[i]);
      } catch (error) {
        console.error(`Failed to create index ${i + 1}:`, error);
        // Don't throw for indexes - they're not critical
      }
    }

    console.log('All tables and indexes created successfully');
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    console.log('Running database migrations...');

    try {
      // Migration 1: Add github_username column to people table
      await this.db.execute('ALTER TABLE people ADD COLUMN github_username TEXT');
      console.log('Migration: Added github_username column to people table');
    } catch (error) {
      // Column might already exist, check the error
      if (error.toString().includes('duplicate column name')) {
        console.log('Migration: github_username column already exists');
      } else {
        console.log('Migration: github_username column might already exist or other issue:', error);
      }
    }

    try {
      // Migration 2: Add user_id column to notes table
      await this.db.execute('ALTER TABLE notes ADD COLUMN user_id TEXT');
      console.log('Migration: Added user_id column to notes table');
    } catch (error) {
      if (error.toString().includes('duplicate column name')) {
        console.log('Migration: user_id column already exists in notes table');
      } else {
        console.log('Migration: user_id column in notes table might already exist or other issue:', error);
      }
    }

    try {
      // Migration 3: Add user_id column to action_items table
      await this.db.execute('ALTER TABLE action_items ADD COLUMN user_id TEXT');
      console.log('Migration: Added user_id column to action_items table');
    } catch (error) {
      if (error.toString().includes('duplicate column name')) {
        console.log('Migration: user_id column already exists in action_items table');
      } else {
        console.log('Migration: user_id column in action_items table might already exist or other issue:', error);
      }
    }

    try {
      // Migration 4: Add user_id column to people table
      await this.db.execute('ALTER TABLE people ADD COLUMN user_id TEXT');
      console.log('Migration: Added user_id column to people table');
    } catch (error) {
      if (error.toString().includes('duplicate column name')) {
        console.log('Migration: user_id column already exists in people table');
      } else {
        console.log('Migration: user_id column in people table might already exist or other issue:', error);
      }
    }

    try {
      // Migration 5: Add deleted_at column to people table
      await this.db.execute('ALTER TABLE people ADD COLUMN deleted_at TEXT');
      console.log('Migration: Added deleted_at column to people table');
    } catch (error) {
      if (error.toString().includes('duplicate column name')) {
        console.log('Migration: deleted_at column already exists in people table');
      } else {
        console.log('Migration: deleted_at column in people table might already exist or other issue:', error);
      }
    }

    try {
      // Migration 6: Add deleted_at column to groups table
      await this.db.execute('ALTER TABLE groups ADD COLUMN deleted_at TEXT');
      console.log('Migration: Added deleted_at column to groups table');
    } catch (error) {
      if (error.toString().includes('duplicate column name')) {
        console.log('Migration: deleted_at column already exists in groups table');
      } else {
        console.log('Migration: deleted_at column in groups table might already exist or other issue:', error);
      }
    }

    try {
      // Migration 7: Add deleted_at column to notes table
      await this.db.execute('ALTER TABLE notes ADD COLUMN deleted_at TEXT');
      console.log('Migration: Added deleted_at column to notes table');
    } catch (error) {
      if (error.toString().includes('duplicate column name')) {
        console.log('Migration: deleted_at column already exists in notes table');
      } else {
        console.log('Migration: deleted_at column in notes table might already exist or other issue:', error);
      }
    }

    try {
      // Migration 8: Add deleted_at column to action_items table
      await this.db.execute('ALTER TABLE action_items ADD COLUMN deleted_at TEXT');
      console.log('Migration: Added deleted_at column to action_items table');
    } catch (error) {
      if (error.toString().includes('duplicate column name')) {
        console.log('Migration: deleted_at column already exists in action_items table');
      } else {
        console.log('Migration: deleted_at column in action_items table might already exist or other issue:', error);
      }
    }

    try {
      // Migration 9: Add encrypted_content column to action_items table
      await this.db.execute('ALTER TABLE action_items ADD COLUMN encrypted_content TEXT');
      console.log('Migration: Added encrypted_content column to action_items table');
    } catch (error) {
      if (error.toString().includes('duplicate column name')) {
        console.log('Migration: encrypted_content column already exists in action_items table');
      } else {
        console.log('Migration: encrypted_content column in action_items table might already exist or other issue:', error);
      }
    }

    try {
      // Migration 10: Add encrypted_keys column to action_items table
      await this.db.execute('ALTER TABLE action_items ADD COLUMN encrypted_keys TEXT');
      console.log('Migration: Added encrypted_keys column to action_items table');
    } catch (error) {
      if (error.toString().includes('duplicate column name')) {
        console.log('Migration: encrypted_keys column already exists in action_items table');
      } else {
        console.log('Migration: encrypted_keys column in action_items table might already exist or other issue:', error);
      }
    }

    try {
      // Migration 11: Add iv column to action_items table
      await this.db.execute('ALTER TABLE action_items ADD COLUMN iv TEXT');
      console.log('Migration: Added iv column to action_items table');
    } catch (error) {
      if (error.toString().includes('duplicate column name')) {
        console.log('Migration: iv column already exists in action_items table');
      } else {
        console.log('Migration: iv column in action_items table might already exist or other issue:', error);
      }
    }

    try {
      // Migration 12: Add completed_at column to action_items table
      await this.db.execute('ALTER TABLE action_items ADD COLUMN completed_at TEXT');
      console.log('Migration: Added completed_at column to action_items table');
    } catch (error) {
      if (error.toString().includes('duplicate column name')) {
        console.log('Migration: completed_at column already exists in action_items table');
      } else {
        console.log('Migration: completed_at column in action_items table might already exist or other issue:', error);
      }
    }

    // Since SQLite doesn't support ALTER COLUMN to modify constraints,
    // we need to handle encrypted records by providing default values
    try {
      // Migration 13: Update notes with missing type for encrypted records
      await this.db.execute(`
        UPDATE notes 
        SET type = 'personal' 
        WHERE type IS NULL AND encrypted = true AND encrypted_content IS NOT NULL
      `);
      console.log('Migration: Set default type for encrypted notes');
    } catch (error) {
      console.log('Migration: Could not update encrypted notes type:', error);
    }

    try {
      // Migration 14: Update action_items with missing title for encrypted records
      await this.db.execute(`
        UPDATE action_items 
        SET title = 'Encrypted Action Item', assignee_id = user_id, assignee_name = 'Unknown'
        WHERE title IS NULL AND encrypted_content IS NOT NULL
      `);
      console.log('Migration: Set default title for encrypted action items');
    } catch (error) {
      console.log('Migration: Could not update encrypted action items title:', error);
    }

    try {
      // Migration 15: Decrypt and populate content for existing encrypted notes
      const encryptedNotes = await this.db.select<any[]>(`
        SELECT id, encrypted_content 
        FROM notes 
        WHERE encrypted_content IS NOT NULL 
        AND (content IS NULL OR content = '')
      `);
      
      for (const note of encryptedNotes) {
        try {
          // Decrypt the content using the same method as sync service
          const decodedContent = atob(note.encrypted_content);
          const decryptedData = JSON.parse(decodedContent);
          
          const updateData: any = {};
          if (decryptedData.content !== undefined) updateData.content = decryptedData.content;
          if (decryptedData.type) updateData.type = decryptedData.type;
          if (decryptedData.tags && Array.isArray(decryptedData.tags)) {
            updateData.tags = JSON.stringify(decryptedData.tags);
          }
          
          if (Object.keys(updateData).length > 0) {
            const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updateData);
            await this.db.execute(
              `UPDATE notes SET ${setClause} WHERE id = ?`,
              [...values, note.id]
            );
          }
        } catch (decryptError) {
          console.warn(`Failed to decrypt note ${note.id}:`, decryptError);
        }
      }
      console.log(`Migration: Decrypted content for ${encryptedNotes.length} existing notes`);
    } catch (error) {
      console.log('Migration: Could not decrypt existing notes:', error);
    }

    console.log('Database migrations completed');
  }

  // Generic CRUD operations
  async insert<T>(table: string, data: Partial<T>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map(() => '?').join(', ');

      const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
      console.log('Executing INSERT:', sql, values);
      await this.db.execute(sql, values);

      // Update sync status
      if (data && typeof data === 'object' && 'id' in data) {
        await this.updateSyncStatus(table, data.id as string, 'pending');
      }
    } catch (error) {
      console.error(`Failed to insert into ${table}:`, error);
      console.error('Data:', data);
      throw error;
    }
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');

    const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
    await this.db.execute(sql, [...values, id]);

    // Update sync status
    await this.updateSyncStatus(table, id, 'pending');
  }

  async delete(table: string, id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `DELETE FROM ${table} WHERE id = ?`;
    await this.db.execute(sql, [id]);

    // Mark as deleted in sync status (soft delete for sync purposes)
    await this.updateSyncStatus(table, id, 'pending');
  }

  async findById<T>(table: string, id: string): Promise<T | null> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `SELECT * FROM ${table} WHERE id = ?`;
    const result = await this.db.select<T[]>(sql, [id]);
    return result.length > 0 ? result[0] : null;
  }

  async findAll<T>(table: string, where?: string, params?: any[]): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');

    let sql = `SELECT * FROM ${table}`;
    if (where) {
      sql += ` WHERE ${where}`;
    }

    return await this.db.select<T[]>(sql, params || []);
  }

  // Sync-specific methods
  async updateSyncStatus(table: string, recordId: string, status: 'pending' | 'synced' | 'conflict'): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const hash = await this.generateRecordHash(table, recordId);

    const sql = `
      INSERT OR REPLACE INTO sync_status 
      (id, table_name, record_id, local_updated, sync_status, hash, last_synced)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const syncId = `${table}_${recordId}`;
    const lastSynced = status === 'synced' ? now : null;

    await this.db.execute(sql, [syncId, table, recordId, now, status, hash, lastSynced]);
  }

  async getPendingSyncRecords(): Promise<SyncStatus[]> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `SELECT * FROM sync_status WHERE sync_status = 'pending'`;
    return await this.db.select<SyncStatus[]>(sql);
  }

  async markSynced(table: string, recordId: string): Promise<void> {
    await this.updateSyncStatus(table, recordId, 'synced');
  }

  private async generateRecordHash(table: string, recordId: string): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const record = await this.findById(table, recordId);
    if (!record) return '';

    // Simple hash generation (in production, use a proper hash function)
    const recordString = JSON.stringify(record);
    let hash = 0;
    for (let i = 0; i < recordString.length; i++) {
      const char = recordString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Batch operations for sync
  async batchInsert<T>(table: string, records: T[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    if (records.length === 0) return;

    const firstRecord = records[0];
    const keys = Object.keys(firstRecord as any);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;

    for (const record of records) {
      const values = keys.map(key => (record as any)[key]);
      await this.db.execute(sql, values);
    }
  }

  async clearTable(table: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.execute(`DELETE FROM ${table}`);
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  async getDatabasePath(): Promise<string> {
    const dataDir = await appDataDir();
    return `${dataDir}engage360.db`;
  }
}

export const databaseService = new DatabaseService();