import { apiService } from './apiService';
import type { ApiResponse, Note, CreateNoteRequest } from '../types';

// API response types matching the OpenAPI spec
interface NoteItem {
    id: string;
    personId?: string;
    encryptedContent: string;
    encryptedKeys: Record<string, string>;
    iv: string;
    createdAt: string;
    updatedAt: string;
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
            });

            if (personId) {
                params.append('personId', personId);
            }

            const response = await apiService.get<NoteListResponse>(`/notes?${params}`);

            if (response.success && response.data?.data) {
                // Transform API response to frontend Note type
                const notes: Note[] = response.data.data.items.map(item => ({
                    id: item.id,
                    title: '', // Will be decrypted from content
                    content: item.encryptedContent, // Encrypted content
                    type: 'personal' as const, // Default type
                    personId: item.personId,
                    tags: [],
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                    encrypted: true,
                    encryptedContent: item.encryptedContent,
                    contentIV: item.iv,
                    deviceKeys: Object.entries(item.encryptedKeys).map(([deviceId, encryptedKey]) => ({
                        deviceId,
                        encryptedKey
                    }))
                }));

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
                const note: Note = {
                    id: item.id,
                    title: '', // Will be decrypted from content
                    content: item.encryptedContent, // Encrypted content
                    type: 'personal' as const,
                    personId: item.personId,
                    tags: [],
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                    encrypted: true,
                    encryptedContent: item.encryptedContent,
                    contentIV: item.iv,
                    deviceKeys: Object.entries(item.encryptedKeys).map(([deviceId, encryptedKey]) => ({
                        deviceId,
                        encryptedKey
                    }))
                };

                return {
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

    async createNote(noteData: CreateNoteRequest & { encryptedContent: string; encryptedKeys: Record<string, string>; iv: string }): Promise<ApiResponse<Note>> {
        try {
            const createRequest = {
                personId: noteData.personId,
                encryptedContent: noteData.encryptedContent,
                encryptedKeys: noteData.encryptedKeys,
                iv: noteData.iv
            };

            const response = await apiService.post<NoteResponse>('/notes', createRequest);

            if (response.success && response.data?.data) {
                const item = response.data.data;
                const note: Note = {
                    id: item.id,
                    title: noteData.title,
                    content: noteData.content,
                    type: noteData.type,
                    personId: item.personId,
                    tags: noteData.tags || [],
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                    encrypted: true,
                    encryptedContent: item.encryptedContent,
                    contentIV: item.iv,
                    deviceKeys: Object.entries(item.encryptedKeys).map(([deviceId, encryptedKey]) => ({
                        deviceId,
                        encryptedKey
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

    async updateNote(id: string, noteData: Partial<CreateNoteRequest> & { encryptedContent?: string; encryptedKeys?: Record<string, string>; iv?: string }): Promise<ApiResponse<Note>> {
        try {
            const updateRequest: any = {};

            if (noteData.encryptedContent) updateRequest.encryptedContent = noteData.encryptedContent;
            if (noteData.encryptedKeys) updateRequest.encryptedKeys = noteData.encryptedKeys;
            if (noteData.iv) updateRequest.iv = noteData.iv;

            const response = await apiService.put<NoteResponse>(`/notes/${id}`, updateRequest);

            if (response.success && response.data?.data) {
                const item = response.data.data;
                const note: Note = {
                    id: item.id,
                    title: noteData.title || '',
                    content: noteData.content || '',
                    type: noteData.type || 'personal',
                    personId: item.personId,
                    tags: noteData.tags || [],
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                    encrypted: true,
                    encryptedContent: item.encryptedContent,
                    contentIV: item.iv,
                    deviceKeys: Object.entries(item.encryptedKeys).map(([deviceId, encryptedKey]) => ({
                        deviceId,
                        encryptedKey
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
