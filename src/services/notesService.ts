import { apiService } from './apiService';
import { databaseService } from './databaseService';
import { syncService } from './syncService';
import type { ApiResponse, Note, CreateNoteRequest } from '../types';

// API response types matching the updated backend spec
interface NoteItem {
    id: string;
    title: string; // Plain text title
    user_id?: string; // Backend uses snake_case
    person_id?: string | null; // Backend uses snake_case
    group_id?: string | null; // Backend uses snake_case
    encrypted_content: string; // Backend uses snake_case
    content_iv: string; // Backend uses snake_case
    created_at: string; // Backend uses snake_case
    updated_at: string; // Backend uses snake_case
    encrypted?: boolean; // Backend field
    device_keys?: Array<{ device_id: string; encrypted_key: string }>; // Backend format (if it exists)
}


interface NoteResponse {
    success: boolean;
    data: NoteItem;
}

class NotesService {
    async getNotes(personId?: string, page = 1, limit = 20, search?: string): Promise<ApiResponse<{ notes: Note[], pagination: { total: number, page: number, limit: number, totalPages: number } }>> {
        try {
            // Try to get from local database first
            let whereConditions: string[] = [];
            let queryParams: any[] = [];

            if (personId) {
                whereConditions.push('person_id = ?');
                queryParams.push(personId);
            }

            if (search && search.trim()) {
                const searchTerm = `%${search.trim()}%`;
                // Search in title, content, and tags (JSON field)
                whereConditions.push('(title LIKE ? OR content LIKE ? OR tags LIKE ?)');
                queryParams.push(searchTerm, searchTerm, searchTerm);
            }

            const whereClause = whereConditions.length > 0 ? whereConditions.join(' AND ') : '';

            const localNotes = await databaseService.findAll<any>('notes', whereClause, queryParams);

            if (localNotes && localNotes.length > 0) {
                // Transform database records to frontend Note type
                const notes: Note[] = localNotes.map(item => {
                    // Parse tags if they're stored as JSON string
                    let tags: string[] = [];
                    if (item.tags) {
                        try {
                            tags = typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags;
                        } catch (e) {
                            tags = [];
                        }
                    }

                    // Parse device keys if they exist
                    let deviceKeys: Array<{ deviceId: string; encryptedKey: string }> = [];
                    if (item.device_keys) {
                        try {
                            const parsed = typeof item.device_keys === 'string' ? JSON.parse(item.device_keys) : item.device_keys;
                            deviceKeys = Array.isArray(parsed) ? parsed : [];
                        } catch (e) {
                            deviceKeys = [];
                        }
                    }

                    return {
                        id: item.id,
                        title: item.title || '',
                        content: item.content || '', // Already decrypted and stored locally
                        type: item.type || 'personal',
                        personId: item.person_id || undefined,
                        groupId: item.group_id || undefined,
                        tags: tags,
                        createdAt: item.created_at,
                        updatedAt: item.updated_at,
                        encrypted: item.encrypted || false,
                        encryptedContent: item.encrypted_content || undefined,
                        contentIV: item.content_iv || undefined,
                        deviceKeys: deviceKeys
                    };
                });

                // Apply pagination
                const offset = (page - 1) * limit;
                const paginatedNotes = notes.slice(offset, offset + limit);
                const total = notes.length;
                const totalPages = Math.ceil(total / limit);

                return {
                    success: true,
                    data: {
                        notes: paginatedNotes,
                        pagination: { total, page, limit, totalPages }
                    }
                };
            }

            // Fallback to API if no local data (trigger sync in background)
            console.log('No local notes found, triggering sync...');
            syncService.manualSync().catch((error: any) => {
                console.warn('Background sync failed:', error);
            });

            return {
                success: true,
                data: {
                    notes: [],
                    pagination: { total: 0, page, limit, totalPages: 0 }
                }
            };
        } catch (error) {
            console.error('Error fetching notes from local database:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to fetch notes from local database',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    async getNoteById(id: string): Promise<ApiResponse<Note>> {
        try {
            // Try to get from local database first
            const localNote = await databaseService.findById<any>('notes', id);

            if (localNote) {
                // Parse tags if they're stored as JSON string
                let tags: string[] = [];
                if (localNote.tags) {
                    try {
                        tags = typeof localNote.tags === 'string' ? JSON.parse(localNote.tags) : localNote.tags;
                    } catch (e) {
                        tags = [];
                    }
                }

                // Parse device keys if they exist
                let deviceKeys: Array<{ deviceId: string; encryptedKey: string }> = [];
                if (localNote.device_keys) {
                    try {
                        const parsed = typeof localNote.device_keys === 'string' ? JSON.parse(localNote.device_keys) : localNote.device_keys;
                        deviceKeys = Array.isArray(parsed) ? parsed : [];
                    } catch (e) {
                        deviceKeys = [];
                    }
                }

                const note: Note = {
                    id: localNote.id,
                    title: localNote.title || '',
                    content: localNote.content || '', // Already decrypted and stored locally
                    type: localNote.type || 'personal',
                    personId: localNote.person_id || undefined,
                    groupId: localNote.group_id || undefined,
                    tags: tags,
                    createdAt: localNote.created_at,
                    updatedAt: localNote.updated_at,
                    encrypted: localNote.encrypted || false,
                    encryptedContent: localNote.encrypted_content || undefined,
                    contentIV: localNote.content_iv || undefined,
                    deviceKeys: deviceKeys
                };

                return {
                    success: true,
                    data: note
                };
            }

            // If not found locally, trigger sync and return error
            console.log(`Note ${id} not found locally, triggering sync...`);
            syncService.manualSync().catch((error: any) => {
                console.warn('Background sync failed:', error);
            });

            return {
                success: false,
                error: { message: 'Note not found', code: 404 }
            };
        } catch (error) {
            console.error('Error fetching note from local database:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to fetch note from local database',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    async createNote(noteData: CreateNoteRequest & {
        title: string;
        encryptedContent: string;
        deviceKeys: Array<{ deviceId: string; encryptedKey: string }>;
        contentIV: string;
        personId?: string | null;
        groupId?: string | null;
    }): Promise<ApiResponse<Note>> {
        try {

            const createRequest = {
                title: noteData.title, // Plain text title
                personId: noteData.personId || null, // Send null instead of empty string
                groupId: noteData.groupId || null, // Send null instead of empty string
                encryptedContent: noteData.encryptedContent,
                deviceKeys: noteData.deviceKeys, // Array format
                contentIV: noteData.contentIV // Use contentIV field name
            };


            const response = await apiService.post<NoteResponse>('/notes', createRequest);

            if (response.success && response.data?.data) {
                const item = response.data.data;

                // Store in local database
                const localNoteData = {
                    id: item.id,
                    user_id: item.user_id,
                    title: noteData.title,
                    content: noteData.content, // Store decrypted content locally
                    type: noteData.type,
                    person_id: item.person_id || null,
                    group_id: item.group_id || null,
                    tags: noteData.tags ? JSON.stringify(noteData.tags) : null,
                    encrypted: true,
                    encrypted_content: item.encrypted_content,
                    content_iv: item.content_iv,
                    device_keys: JSON.stringify(item.device_keys || []),
                    created_at: item.created_at,
                    updated_at: item.updated_at
                };

                try {
                    await databaseService.insert('notes', localNoteData);
                } catch (dbError) {
                    console.warn('Failed to store note locally:', dbError);
                }

                const note: Note = {
                    id: item.id,
                    title: noteData.title,
                    content: noteData.content,
                    type: noteData.type,
                    personId: item.person_id || undefined,
                    groupId: item.group_id || undefined,
                    tags: noteData.tags || [],
                    createdAt: item.created_at,
                    updatedAt: item.updated_at,
                    encrypted: true,
                    encryptedContent: item.encrypted_content,
                    contentIV: item.content_iv,
                    deviceKeys: (item.device_keys || []).map(dk => ({
                        deviceId: dk.device_id,
                        encryptedKey: dk.encrypted_key
                    }))
                };

                return {
                    success: true,
                    data: note
                };
            }

            return {
                success: false,
                error: response.error || { message: 'Failed to create note', code: 500 }
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    message: 'Failed to create note',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    async updateNote(id: string, noteData: Partial<CreateNoteRequest> & {
        title?: string;
        encryptedContent?: string;
        deviceKeys?: Array<{ deviceId: string; encryptedKey: string }>;
        contentIV?: string;
    }): Promise<ApiResponse<Note>> {
        try {
            // Update local database first
            const localUpdateData: any = {
                updated_at: new Date().toISOString()
            };

            if (noteData.title !== undefined) localUpdateData.title = noteData.title;
            if (noteData.content !== undefined) localUpdateData.content = noteData.content;
            if (noteData.type !== undefined) localUpdateData.type = noteData.type;
            if (noteData.tags !== undefined) localUpdateData.tags = JSON.stringify(noteData.tags);
            if (noteData.encryptedContent) localUpdateData.encrypted_content = noteData.encryptedContent;
            if (noteData.contentIV) localUpdateData.content_iv = noteData.contentIV;
            if (noteData.deviceKeys) localUpdateData.device_keys = JSON.stringify(noteData.deviceKeys);

            await databaseService.update('notes', id, localUpdateData);

            // Trigger background sync to upload to server
            if (syncService.isConnected() && !syncService.isSyncing()) {
                syncService.manualSync().catch(console.error);
            }

            // Get the updated note from local database
            const updatedNote = await databaseService.findById<any>('notes', id);

            if (updatedNote) {
                const note: Note = {
                    id: updatedNote.id,
                    title: updatedNote.title || '',
                    content: updatedNote.content || '',
                    type: updatedNote.type || 'personal',
                    personId: updatedNote.person_id || undefined,
                    groupId: updatedNote.group_id || undefined,
                    tags: updatedNote.tags ? JSON.parse(updatedNote.tags) : [],
                    createdAt: updatedNote.created_at,
                    updatedAt: updatedNote.updated_at,
                    encrypted: updatedNote.encrypted || false,
                    encryptedContent: updatedNote.encrypted_content,
                    contentIV: updatedNote.content_iv,
                    deviceKeys: updatedNote.device_keys ? JSON.parse(updatedNote.device_keys) : []
                };

                return {
                    success: true,
                    data: note
                };
            }

            return {
                success: false,
                error: { message: 'Failed to retrieve updated note', code: 500 }
            };
        } catch (error) {
            console.error('Failed to update note in local database:', error);

            // Fallback to API if local database fails
            try {
                return await this.updateNoteViaAPI(id, noteData);
            } catch (apiError) {
                return {
                    success: false,
                    error: {
                        message: 'Failed to update note in both local and remote sources',
                        code: 500,
                        details: error instanceof Error ? error.message : 'Unknown error'
                    }
                };
            }
        }
    }

    /**
     * Fallback method to update note via API
     */
    private async updateNoteViaAPI(id: string, noteData: Partial<CreateNoteRequest> & {
        title?: string;
        encryptedContent?: string;
        deviceKeys?: Array<{ deviceId: string; encryptedKey: string }>;
        contentIV?: string;
    }): Promise<ApiResponse<Note>> {
        const updateRequest: any = {};

        if (noteData.title) updateRequest.title = noteData.title;
        if (noteData.encryptedContent) updateRequest.encryptedContent = noteData.encryptedContent;
        if (noteData.deviceKeys) updateRequest.deviceKeys = noteData.deviceKeys;
        if (noteData.contentIV) updateRequest.contentIV = noteData.contentIV;

        const response = await apiService.put<NoteResponse>(`/notes/${id}`, updateRequest);

        if (response.success && response.data?.data) {
            const item = response.data.data;

            const note: Note = {
                id: item.id,
                title: noteData.title || '',
                content: noteData.content || '',
                type: noteData.type || 'personal',
                personId: item.person_id || undefined,
                groupId: item.group_id || undefined,
                tags: noteData.tags || [],
                createdAt: item.created_at,
                updatedAt: item.updated_at,
                encrypted: true,
                encryptedContent: item.encrypted_content,
                contentIV: item.content_iv,
                deviceKeys: (item.device_keys || []).map(dk => ({
                    deviceId: dk.device_id,
                    encryptedKey: dk.encrypted_key
                }))
            };

            return { success: true, data: note };
        }

        return {
            success: false,
            error: response.error || { message: 'Failed to update note', code: 500 }
        };
    }

    async deleteNote(id: string): Promise<ApiResponse<void>> {
        try {
            // First delete all related action items to avoid foreign key constraint
            const relatedActionItems = await databaseService.findAll<any>('action_items', 'note_id = ?', [id]);

            for (const actionItem of relatedActionItems) {
                await databaseService.delete('action_items', actionItem.id);
            }

            // Now delete the note from local database
            await databaseService.delete('notes', id);

            // Trigger background sync to delete from server
            if (syncService.isConnected() && !syncService.isSyncing()) {
                syncService.manualSync().catch(error => {
                    console.warn('Background sync failed after note deletion:', error);
                });
            }

            return {
                success: true
            };
        } catch (error) {
            console.error('Failed to delete note from local database:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to delete note from local database',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
}

export const notesService = new NotesService();
