import { apiService } from './apiService';
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

interface NoteListResponse {
    success: boolean;
    data: {
        items: NoteItem[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };
}

interface NoteResponse {
    success: boolean;
    data: NoteItem;
}

class NotesService {
    async getNotes(personId?: string, page = 1, limit = 20): Promise<ApiResponse<{ notes: Note[], pagination: { total: number, page: number, limit: number, totalPages: number } }>> {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                // Add cache busting parameter to force fresh data
                _t: Date.now().toString()
            });

            if (personId) {
                params.append('personId', personId);
            }

            const response = await apiService.get<NoteListResponse>(`/notes?${params}`);


            if (response.success && response.data?.data) {

                // Check if we have any items
                if (!response.data.data.items || response.data.data.items.length === 0) {
                    return {
                        success: true,
                        data: {
                            notes: [],
                            pagination: response.data.data.pagination || { total: 0, page, limit, totalPages: 0 }
                        }
                    };
                }

                // Transform API response to frontend Note type
                const notes: Note[] = response.data.data.items.map(item => {

                    // Decode the encrypted content to extract readable data
                    let decodedContent = '';
                    let noteType = 'personal' as const;
                    let noteTags: string[] = [];

                    // Check if encrypted_content exists and is not undefined
                    if (!item.encrypted_content) {
                        decodedContent = 'Content not found';
                        return {
                            id: item.id,
                            title: item.title || '',
                            content: decodedContent,
                            type: noteType,
                            personId: item.person_id || undefined,
                            tags: noteTags,
                            createdAt: item.created_at,
                            updatedAt: item.updated_at,
                            encrypted: true,
                            encryptedContent: item.encrypted_content || '',
                            contentIV: item.content_iv || '',
                            deviceKeys: (item.device_keys || []).map(dk => ({
                                deviceId: dk.device_id,
                                encryptedKey: dk.encrypted_key
                            }))
                        };
                    }

                    try {
                        // For now, we're using base64 encoding (not real encryption)
                        // Use UTF-8 safe base64 decoding
                        const decodedData = JSON.parse(decodeURIComponent(escape(atob(item.encrypted_content))));
                        decodedContent = decodedData.content || '';
                        noteType = decodedData.type || 'personal';
                        noteTags = decodedData.tags || [];
                    } catch (error) {
                        // Try to parse as JSON directly (in case it's not base64 encoded)
                        try {
                            const directData = JSON.parse(item.encrypted_content);
                            decodedContent = directData.content || '';
                            noteType = directData.type || 'personal';
                            noteTags = directData.tags || [];
                        } catch (directError) {
                            // Fall back to treating encrypted_content as plain text
                            decodedContent = item.encrypted_content;
                        }
                    }

                    return {
                        id: item.id,
                        title: item.title || '', // Use title from API response
                        content: decodedContent, // Decoded readable content
                        type: noteType,
                        personId: item.person_id || undefined,
                        tags: noteTags,
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
                });

                return {
                    success: true,
                    data: {
                        notes: notes,
                        pagination: response.data.data.pagination || { total: notes.length, page, limit, totalPages: Math.ceil(notes.length / limit) }
                    }
                };
            }

            return {
                success: false,
                error: response.error || { message: 'Failed to fetch notes', code: 500 }
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    message: 'Failed to fetch notes',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    async getNoteById(id: string): Promise<ApiResponse<Note>> {
        try {
            const response = await apiService.get<NoteResponse>(`/notes/${id}`);

            if (response.success && response.data?.data) {
                const item = response.data.data;

                // Decode the encrypted content to extract readable data
                let decodedContent = '';
                let noteType = 'personal' as const;
                let noteTags: string[] = [];

                try {
                    // For now, we're using base64 encoding (not real encryption)
                    // Use UTF-8 safe base64 decoding
                    const decodedData = JSON.parse(decodeURIComponent(escape(atob(item.encrypted_content))));
                    decodedContent = decodedData.content || '';
                    noteType = decodedData.type || 'personal';
                    noteTags = decodedData.tags || [];
                } catch (error) {
                    // Try to parse as JSON directly (in case it's not base64 encoded)
                    try {
                        const directData = JSON.parse(item.encrypted_content);
                        decodedContent = directData.content || '';
                        noteType = directData.type || 'personal';
                        noteTags = directData.tags || [];
                    } catch (directError) {
                        // Fall back to treating encrypted_content as plain text
                        decodedContent = item.encrypted_content;
                    }
                }

                const note: Note = {
                    id: item.id,
                    title: item.title || '', // Use title from API response
                    content: decodedContent, // Decoded readable content
                    type: noteType,
                    personId: item.person_id || undefined,
                    tags: noteTags,
                    createdAt: item.created_at,
                    updatedAt: item.updated_at,
                    encrypted: true,
                    encryptedContent: item.encrypted_content,
                    contentIV: item.content_iv,
                    deviceKeys: (item.device_keys || []).map(dk => ({
                        deviceId: dk.device_id,
                        encryptedKey: dk.encrypted_key
                    }))
                }; return {
                    success: true,
                    data: note
                };
            }

            return {
                success: false,
                error: response.error || { message: 'Note not found', code: 404 }
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    message: 'Failed to fetch note',
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
                const note: Note = {
                    id: item.id,
                    title: noteData.title,
                    content: noteData.content,
                    type: noteData.type,
                    personId: item.person_id || undefined,
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
                error: response.error || { message: 'Failed to update note', code: 500 }
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    message: 'Failed to update note',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    async deleteNote(id: string): Promise<ApiResponse<void>> {
        try {
            const response = await apiService.delete(`/notes/${id}`);
            return {
                success: response.success,
                error: response.error
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    message: 'Failed to delete note',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
}

export const notesService = new NotesService();
