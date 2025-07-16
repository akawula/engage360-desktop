import { apiService } from './apiService';
import type { ApiResponse, ActionItem, CreateActionItemRequest } from '../types';

// API response types matching the OpenAPI spec
interface ActionItemAPI {
    id: string;
    user_id: string;
    person_id?: string;
    group_id?: string;
    note_id?: string;
    title?: string;
    encrypted_content: string | object; // Can be string or Uint8Array object
    encrypted_keys: Record<string, string>;
    iv: string | object; // Can be string or Uint8Array object
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date?: string;
    completed_at?: string;
    created_at: string;
    updated_at: string;
    person?: {
        id: string;
        first_name: string;
        last_name: string;
    };
    group?: {
        id: string;
        name: string;
        description?: string;
    };
    note?: {
        id: string;
        title?: string;
    };
}

interface ActionResponse {
    success: boolean;
    data: ActionItemAPI;
}

class ActionItemsService {    /**
     * Helper method to decode encrypted content from action items
     */    private decodeActionItemContent(encryptedContent: string | object | null): { title: string; description: string } {
        const defaultContent = { title: '', description: '' };

        if (!encryptedContent) {
            console.log('No encrypted content provided, returning default');
            return defaultContent;
        }

        console.log('Decoding content:', {
            type: typeof encryptedContent,
            value: encryptedContent,
            length: typeof encryptedContent === 'string' ? encryptedContent.length : 'N/A'
        });

        try {
            // The API should return encrypted content as Base64 encoded strings
            if (typeof encryptedContent === 'string') {
                console.log('Processing string content:', encryptedContent);

                try {
                    // Try to decode as Base64 first (our standard format)
                    const decodedBase64 = atob(encryptedContent);
                    console.log('✅ Base64 decode successful:', decodedBase64);

                    const parsed = JSON.parse(decodedBase64);
                    console.log('✅ JSON parse successful:', parsed);

                    const result = {
                        title: parsed.title || '',
                        description: parsed.description || ''
                    };
                    console.log('✅ Returning decoded result:', result);
                    return result;
                } catch (base64Error) {
                    console.log('❌ Base64 decode failed:', base64Error instanceof Error ? base64Error.message : String(base64Error));

                    try {
                        // Fallback: try parsing as direct JSON (for legacy data)
                        const parsed = JSON.parse(encryptedContent);
                        console.log('Successfully parsed as direct JSON:', parsed);
                        return {
                            title: parsed.title || '',
                            description: parsed.description || ''
                        };
                    } catch (directJsonError) {
                        console.warn('❌ Both Base64 and direct JSON parsing failed');
                        console.log('Original encrypted content:', encryptedContent);
                        console.log('Content length:', encryptedContent.length);
                        console.log('First 100 chars:', encryptedContent.substring(0, 100));

                        // Try to parse corrupted concatenated format from legacy data
                        const legacyResult = this.parseLegacyConcatenatedContent(encryptedContent);
                        if (legacyResult.title && legacyResult.title !== 'Unknown') {
                            console.log('✅ Successfully parsed legacy concatenated format:', legacyResult);
                            return legacyResult;
                        }

                        // Last fallback: treat the string as the title with error info
                        const fallbackResult = {
                            title: `Error decoding: ${encryptedContent.substring(0, 50)}...`,
                            description: 'Content decoding failed - check console for details'
                        };
                        console.log('🚫 Returning fallback result:', fallbackResult);
                        return fallbackResult;
                    }
                }
            }
            // Legacy handling for object format (should be phased out)
            else if (typeof encryptedContent === 'object' && encryptedContent !== null) {
                console.warn('Received object format encrypted content (legacy), converting to string');
                const uint8Array = new Uint8Array(Object.values(encryptedContent));
                const decoder = new TextDecoder('utf-8');
                const contentString = decoder.decode(uint8Array);

                try {
                    const parsed = JSON.parse(contentString);
                    return {
                        title: parsed.title || '',
                        description: parsed.description || ''
                    };
                } catch {
                    return {
                        title: contentString,
                        description: ''
                    };
                }
            }

            return defaultContent;
        } catch (error) {
            console.error('Failed to decode action item content:', error);
            return defaultContent;
        }
    }

    /**
     * Helper method to parse corrupted concatenated content from legacy API responses
     * This handles malformed strings like "titleTest1descriptionTest2metadatacreated2025..."
     */
    private parseLegacyConcatenatedContent(corruptedContent: string): { title: string; description: string } {
        try {
            console.log('Attempting to parse legacy concatenated content:', corruptedContent);

            // Look for patterns in the corrupted string
            // Pattern: "title{value}description{value}metadata{...}"

            let title = 'Unknown';
            let description = '';

            // Try to extract title (between "title" and "description")
            const titleMatch = corruptedContent.match(/^title([^]*?)description/);
            if (titleMatch && titleMatch[1]) {
                title = titleMatch[1];
                console.log('Extracted title:', title);
            }

            // Try to extract description (between "description" and "metadata")
            const descriptionMatch = corruptedContent.match(/description([^]*?)metadata/);
            if (descriptionMatch && descriptionMatch[1]) {
                description = descriptionMatch[1];
                console.log('Extracted description:', description);
            }

            // If we didn't find the pattern, try a simpler approach
            if (title === 'Unknown') {
                // Look for "title" followed by some content
                const simpleTitleMatch = corruptedContent.match(/title(.+)/);
                if (simpleTitleMatch) {
                    // Take everything after "title" and before "description" or first 50 chars
                    let extracted = simpleTitleMatch[1];
                    const descIndex = extracted.indexOf('description');
                    if (descIndex > 0) {
                        title = extracted.substring(0, descIndex);
                    } else {
                        title = extracted.substring(0, 50);
                    }
                    console.log('Fallback extracted title:', title);
                }
            }

            return {
                title: title || 'Corrupted Title',
                description: description || 'Content corrupted - please edit to fix'
            };
        } catch (error) {
            console.error('Failed to parse legacy concatenated content:', error);
            return {
                title: 'Corrupted Data',
                description: 'Unable to parse corrupted content'
            };
        }
    }

    async getActionItems(filters?: {
        page?: number;
        limit?: number;
        status?: string;
        priority?: string;
        personId?: string;
        groupId?: string;
        noteId?: string;
        dueDateFrom?: string;
        dueDateTo?: string;
    }): Promise<ApiResponse<ActionItem[]>> {
        try {
            const params = new URLSearchParams();

            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.limit) params.append('limit', filters.limit.toString());
            if (filters?.status) params.append('status', filters.status);
            if (filters?.priority) params.append('priority', filters.priority);
            if (filters?.personId) params.append('person_id', filters.personId);
            if (filters?.groupId) params.append('group_id', filters.groupId);
            if (filters?.noteId) params.append('note_id', filters.noteId);
            if (filters?.dueDateFrom) params.append('due_date_from', filters.dueDateFrom);
            if (filters?.dueDateTo) params.append('due_date_to', filters.dueDateTo);

            const response = await apiService.get<any>(`/actions?${params}`);

            if (response.success) {
                // Debug: Log the response structure to understand what we're getting
                console.log('Action items API response:', response.data);

                // Handle different possible response structures
                let items: ActionItemAPI[] = [];

                if (!response.data) {
                    // Handle null/undefined data - return empty array
                    return {
                        success: true,
                        data: []
                    };
                }

                // Check if the response has the expected nested structure
                if (response.data.data && Array.isArray(response.data.data)) {
                    items = response.data.data; // API returns data.data as array directly
                }
                // Check if the response has items nested under data.data
                else if (response.data.data?.items) {
                    items = response.data.data.items;
                }
                // Check if items are directly in data
                else if (Array.isArray(response.data.items)) {
                    items = response.data.items;
                }
                // Check if the response data itself is an array
                else if (Array.isArray(response.data)) {
                    items = response.data;
                }
                // Handle empty response case
                else {
                    console.log('Unexpected action items response structure, returning empty array:', response.data);
                    // Return empty array instead of error for now to prevent crashes
                    items = [];
                }

                const actionItems: ActionItem[] = items.map(item => {
                    // Decode the encrypted content - this should be our primary source of title/description
                    const decodedContent = this.decodeActionItemContent(item.encrypted_content);

                    return {
                        id: item.id,
                        title: decodedContent.title || item.title || 'Untitled Action', // Prioritize decoded content
                        description: decodedContent.description || '',
                        status: item.status,
                        priority: item.priority,
                        assigneeId: item.user_id,
                        assigneeName: item.person ? `${item.person.first_name} ${item.person.last_name}` : 'Current User',
                        dueDate: item.due_date,
                        personId: item.person_id,
                        groupId: item.group_id,
                        noteId: item.note_id,
                        createdAt: item.created_at,
                        updatedAt: item.updated_at
                    };
                });

                return {
                    success: true,
                    data: actionItems
                };
            }

            return {
                success: false,
                error: response.error || { message: 'Failed to fetch action items', code: 500 }
            };
        } catch (error) {
            console.error('Failed to fetch action items:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to fetch action items',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    async getActionItemById(id: string): Promise<ApiResponse<ActionItem>> {
        try {
            const response = await apiService.get<ActionResponse>(`/actions/${id}`);

            if (response.success && response.data?.data) {
                const item = response.data.data;

                // Decode the encrypted content (currently Base64 encoded JSON)
                const decodedContent = this.decodeActionItemContent(item.encrypted_content);

                const actionItem: ActionItem = {
                    id: item.id,
                    title: decodedContent.title || item.title || 'Untitled Action', // Prioritize decoded content
                    description: decodedContent.description || '',
                    status: item.status,
                    priority: item.priority,
                    assigneeId: item.user_id,
                    assigneeName: item.person ? `${item.person.first_name} ${item.person.last_name}` : 'Current User',
                    dueDate: item.due_date,
                    personId: item.person_id,
                    groupId: item.group_id,
                    noteId: item.note_id,
                    createdAt: item.created_at,
                    updatedAt: item.updated_at
                };

                return {
                    success: true,
                    data: actionItem
                };
            }

            return {
                success: false,
                error: response.error || { message: 'Action item not found', code: 404 }
            };
        } catch (error) {
            console.error('Failed to fetch action item:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to fetch action item',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    async createActionItem(actionData: CreateActionItemRequest & { encryptedContent: string; encryptedKeys: Record<string, string>; iv: string }): Promise<ApiResponse<ActionItem>> {
        try {
            const createRequest = {
                title: actionData.title,
                encryptedContent: actionData.encryptedContent,
                encryptedKeys: actionData.encryptedKeys,
                contentType: 'application/octet-stream',
                iv: actionData.iv,
                dueDate: actionData.dueDate,
                priority: actionData.priority,
                personId: actionData.personId,
                groupId: actionData.groupId,
                noteId: actionData.noteId
                // Note: assigneeId is not part of the API - the action is automatically assigned to the current user
            };

            console.log('Sending create action request:', createRequest);

            const response = await apiService.post<ActionResponse>('/actions', createRequest);

            if (response.success && response.data?.data) {
                const item = response.data.data;
                const actionItem: ActionItem = {
                    id: item.id,
                    title: actionData.title,
                    description: actionData.description || '',
                    status: item.status,
                    priority: item.priority,
                    assigneeId: item.user_id,
                    assigneeName: 'Current User', // Action items are assigned to the current user
                    dueDate: item.due_date,
                    personId: item.person_id,
                    groupId: item.group_id,
                    noteId: item.note_id,
                    createdAt: item.created_at,
                    updatedAt: item.updated_at
                };

                return {
                    success: true,
                    data: actionItem
                };
            }

            return {
                success: false,
                error: response.error || { message: 'Failed to create action item', code: 500 }
            };
        } catch (error) {
            console.error('Failed to create action item:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to create action item',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    async updateActionItem(id: string, actionData: Partial<CreateActionItemRequest> & { encryptedContent?: string; encryptedKeys?: Record<string, string>; iv?: string }): Promise<ApiResponse<ActionItem>> {
        try {
            const updateRequest: any = {};

            if (actionData.title) updateRequest.title = actionData.title;
            if (actionData.encryptedContent) updateRequest.encryptedContent = actionData.encryptedContent;
            if (actionData.encryptedKeys) updateRequest.encryptedKeys = actionData.encryptedKeys;
            if (actionData.iv) updateRequest.iv = actionData.iv;
            if (actionData.dueDate) updateRequest.dueDate = actionData.dueDate;
            if (actionData.priority) updateRequest.priority = actionData.priority;
            if (actionData.personId) updateRequest.personId = actionData.personId;
            if (actionData.groupId) updateRequest.groupId = actionData.groupId;
            if (actionData.noteId) updateRequest.noteId = actionData.noteId;

            const response = await apiService.put<ActionResponse>(`/actions/${id}`, updateRequest);

            if (response.success && response.data?.data) {
                const item = response.data.data;

                // Decode the encrypted content to get the actual title and description
                const decodedContent = this.decodeActionItemContent(item.encrypted_content);

                const actionItem: ActionItem = {
                    id: item.id,
                    title: decodedContent.title || item.title || 'Untitled Action',
                    description: decodedContent.description || '',
                    status: item.status,
                    priority: item.priority,
                    assigneeId: item.user_id,
                    assigneeName: item.person ? `${item.person.first_name} ${item.person.last_name}` : 'Current User',
                    dueDate: item.due_date,
                    personId: item.person_id,
                    groupId: item.group_id,
                    noteId: item.note_id,
                    createdAt: item.created_at,
                    updatedAt: item.updated_at
                };

                return {
                    success: true,
                    data: actionItem
                };
            }

            return {
                success: false,
                error: response.error || { message: 'Failed to update action item', code: 500 }
            };
        } catch (error) {
            console.error('Failed to update action item:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to update action item',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    async updateActionStatus(id: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled'): Promise<ApiResponse<ActionItem>> {
        try {
            const response = await apiService.patch<ActionResponse>(`/actions/${id}/status`, { status });

            if (response.success && response.data?.data) {
                const item = response.data.data;

                // Decode the encrypted content (currently Base64 encoded JSON)
                const decodedContent = this.decodeActionItemContent(item.encrypted_content);

                const actionItem: ActionItem = {
                    id: item.id,
                    title: decodedContent.title || item.title || 'Untitled Action',
                    description: decodedContent.description || '',
                    status: item.status,
                    priority: item.priority,
                    assigneeId: item.user_id,
                    assigneeName: item.person ? `${item.person.first_name} ${item.person.last_name}` : 'Unknown',
                    dueDate: item.due_date,
                    personId: item.person_id,
                    groupId: item.group_id,
                    noteId: item.note_id,
                    createdAt: item.created_at,
                    updatedAt: item.updated_at
                };

                return {
                    success: true,
                    data: actionItem
                };
            }

            return {
                success: false,
                error: response.error || { message: 'Failed to update action status', code: 500 }
            };
        } catch (error) {
            console.error('Failed to update action status:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to update action status',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    async deleteActionItem(id: string): Promise<ApiResponse<void>> {
        try {
            const response = await apiService.delete(`/actions/${id}`);
            return {
                success: response.success,
                error: response.error
            };
        } catch (error) {
            console.error('Failed to delete action item:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to delete action item',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
}

export const actionItemsService = new ActionItemsService();
