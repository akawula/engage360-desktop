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
            pageSize: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    };
}

interface NoteResponse {
    success: boolean;
    data: NoteItem;
}

class NotesService {
    async getNotes(personId?: string, page = 1, limit = 20): Promise<ApiResponse<Note[]>> {
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

            console.log('Full API response:', response);
            console.log('Response status:', response.success);
            console.log('Response data exists:', !!response.data);

            if (response.success && response.data?.data) {
                console.log('Response data structure:', response.data);
                console.log('Items array:', response.data.data.items);
                console.log('Items array length:', response.data.data.items?.length);
                console.log('First item (if exists):', response.data.data.items[0]);

                // Check if we have any items
                if (!response.data.data.items || response.data.data.items.length === 0) {
                    console.log('No notes found in response');
                    return {
                        success: true,
                        data: []
                    };
                }

                // Transform API response to frontend Note type
                const notes: Note[] = response.data.data.items.map(item => {
                    console.log('Full item from API:', item);
                    console.log('Item keys:', Object.keys(item));

                    // Decode the encrypted content to extract readable data
                    let decodedContent = '';
                    let noteType = 'personal' as const;
                    let noteTags: string[] = [];

                    // Check if encrypted_content exists and is not undefined
                    if (!item.encrypted_content) {
                        console.warn('encrypted_content is missing or undefined:', item.encrypted_content);
                        console.log('Available fields in item:', Object.keys(item));

                        // Try to find content in other possible field names
                        const possibleContentFields = ['content', 'encrypted_content', 'encryptedData', 'data'];
                        for (const field of possibleContentFields) {
                            if (item[field as keyof typeof item]) {
                                console.log(`Found content in field: ${field}`, item[field as keyof typeof item]);
                                break;
                            }
                        }

                        // For now, set empty content
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
                        console.log('Raw encrypted_content:', item.encrypted_content);
                        console.log('encrypted_content type:', typeof item.encrypted_content);
                        console.log('encrypted_content length:', item.encrypted_content?.length);

                        // For now, we're using base64 encoding (not real encryption)
                        // Use UTF-8 safe base64 decoding
                        const decodedData = JSON.parse(decodeURIComponent(escape(atob(item.encrypted_content))));
                        decodedContent = decodedData.content || '';
                        noteType = decodedData.type || 'personal';
                        noteTags = decodedData.tags || [];

                        console.log('Successfully decoded:', { decodedContent, noteType, noteTags });
                    } catch (error) {
                        console.warn('Failed to decode note content:', error);
                        console.log('Raw content that failed to decode:', item.encrypted_content);

                        // Try to parse as JSON directly (in case it's not base64 encoded)
                        try {
                            const directData = JSON.parse(item.encrypted_content);
                            decodedContent = directData.content || '';
                            noteType = directData.type || 'personal';
                            noteTags = directData.tags || [];
                            console.log('Successfully parsed as direct JSON:', { decodedContent, noteType, noteTags });
                        } catch (directError) {
                            console.log('Direct JSON parse also failed:', directError);
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
                    data: notes
                };
            }

            return {
                success: false,
                error: response.error || { message: 'Failed to fetch notes', code: 500 }
            };
        } catch (error) {
            console.error('Failed to fetch notes:', error);
            console.error('Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
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
                    console.log('Raw encrypted_content (single note):', item.encrypted_content);
                    console.log('encrypted_content type:', typeof item.encrypted_content);
                    console.log('encrypted_content length:', item.encrypted_content?.length);

                    // For now, we're using base64 encoding (not real encryption)
                    // Use UTF-8 safe base64 decoding
                    const decodedData = JSON.parse(decodeURIComponent(escape(atob(item.encrypted_content))));
                    decodedContent = decodedData.content || '';
                    noteType = decodedData.type || 'personal';
                    noteTags = decodedData.tags || [];

                    console.log('Successfully decoded single note:', { decodedContent, noteType, noteTags });
                } catch (error) {
                    console.warn('Failed to decode note content:', error);
                    console.log('Raw content that failed to decode:', item.encrypted_content);

                    // Try to parse as JSON directly (in case it's not base64 encoded)
                    try {
                        const directData = JSON.parse(item.encrypted_content);
                        decodedContent = directData.content || '';
                        noteType = directData.type || 'personal';
                        noteTags = directData.tags || [];
                        console.log('Successfully parsed single note as direct JSON:', { decodedContent, noteType, noteTags });
                    } catch (directError) {
                        console.log('Direct JSON parse also failed:', directError);
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
            console.error('Failed to fetch note:', error);
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
            // Debug the content we're about to send
            console.log('=== CREATE NOTE SERVICE DEBUG ===');
            console.log('noteData.content (original):', noteData.content);
            console.log('noteData.content length:', noteData.content?.length);
            console.log('noteData.encryptedContent:', noteData.encryptedContent);
            console.log('noteData.encryptedContent length:', noteData.encryptedContent?.length);

            // Try to decode what we're sending to verify it's correct
            try {
                const testDecode = JSON.parse(decodeURIComponent(escape(atob(noteData.encryptedContent))));
                console.log('Test decode of encryptedContent before sending:', testDecode.content);
                console.log('Test decode content length:', testDecode.content?.length);
            } catch (e) {
                console.log('Could not test decode encryptedContent:', e);
            }
            console.log('==================================');

            const createRequest = {
                title: noteData.title, // Plain text title
                personId: noteData.personId || null, // Send null instead of empty string
                groupId: noteData.groupId || null, // Send null instead of empty string
                encryptedContent: noteData.encryptedContent,
                deviceKeys: noteData.deviceKeys, // Array format
                contentIV: noteData.contentIV // Use contentIV field name
            };

            // Debug logging
            console.log('Sending note creation request:', createRequest);
            console.log('Request URL will be: /api/notes');

            const response = await apiService.post<NoteResponse>('/notes', createRequest);

            console.log('=== CREATE NOTE RESPONSE DEBUG ===');
            console.log('Note creation response:', response);
            console.log('Response success:', response.success);
            if (response.success && response.data?.data) {
                console.log('Returned encrypted_content:', response.data.data.encrypted_content);
                console.log('Returned encrypted_content length:', response.data.data.encrypted_content?.length);

                // Try to decode what the server sent back
                try {
                    const backendDecode = JSON.parse(decodeURIComponent(escape(atob(response.data.data.encrypted_content))));
                    console.log('Backend returned decoded content:', backendDecode.content);
                    console.log('Backend returned content length:', backendDecode.content?.length);
                } catch (e) {
                    console.log('Could not decode backend response:', e);
                }
            }
            console.log('===================================');

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
            console.error('Failed to create note:', error);
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
            console.error('Failed to update note:', error);
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
            console.error('Failed to delete note:', error);
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
