import { apiService } from './apiService';
import { databaseService } from './databaseService';
import { syncService } from './syncService';
import { authService } from './authService';
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
            return defaultContent;
        }

        try {
            // The API should return encrypted content as Base64 encoded strings
            if (typeof encryptedContent === 'string') {
                try {
                    // Try to decode as Base64 first (our standard format)
                    // Handle Unicode characters properly
                    const decodedBase64 = decodeURIComponent(escape(atob(encryptedContent)));
                    const parsed = JSON.parse(decodedBase64);

                    return {
                        title: parsed.title || '',
                        description: parsed.description || ''
                    };
                } catch (base64Error) {
                    try {
                        // Fallback: try parsing as direct JSON (for legacy data)
                        const parsed = JSON.parse(encryptedContent);
                        return {
                            title: parsed.title || '',
                            description: parsed.description || ''
                        };
                    } catch (directJsonError) {
                        // Try to parse corrupted concatenated format from legacy data
                        const legacyResult = this.parseLegacyConcatenatedContent(encryptedContent);
                        if (legacyResult.title && legacyResult.title !== 'Unknown') {
                            return legacyResult;
                        }

                        // Last fallback: treat the string as the title with error info
                        return {
                            title: `Error decoding: ${encryptedContent.substring(0, 50)}...`,
                            description: 'Content decoding failed'
                        };
                    }
                }
            }
            // Legacy handling for object format (should be phased out)
            else if (typeof encryptedContent === 'object' && encryptedContent !== null) {
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
            return defaultContent;
        }
    }

    /**
     * Helper method to parse corrupted concatenated content from legacy API responses
     * This handles malformed strings like "titleTest1descriptionTest2metadatacreated2025..."
     */
    private parseLegacyConcatenatedContent(corruptedContent: string): { title: string; description: string } {
        try {
            let title = 'Unknown';
            let description = '';

            // Try to extract title (between "title" and "description")
            const titleMatch = corruptedContent.match(/^title([^]*?)description/);
            if (titleMatch && titleMatch[1]) {
                title = titleMatch[1];
            }

            // Try to extract description (between "description" and "metadata")
            const descriptionMatch = corruptedContent.match(/description([^]*?)metadata/);
            if (descriptionMatch && descriptionMatch[1]) {
                description = descriptionMatch[1];
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
                }
            }

            return {
                title: title || 'Corrupted Title',
                description: description || 'Content corrupted - please edit to fix'
            };
        } catch (error) {
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
            // Build SQL query with filters
            const whereConditions: string[] = ['deleted_at IS NULL'];
            const queryParams: any[] = [];

            if (filters?.status) {
                whereConditions.push('status = ?');
                queryParams.push(filters.status);
            }

            if (filters?.priority) {
                whereConditions.push('priority = ?');
                queryParams.push(filters.priority);
            }

            if (filters?.personId) {
                whereConditions.push('person_id = ?');
                queryParams.push(filters.personId);
            }

            if (filters?.groupId) {
                whereConditions.push('group_id = ?');
                queryParams.push(filters.groupId);
            }

            if (filters?.noteId) {
                whereConditions.push('note_id = ?');
                queryParams.push(filters.noteId);
            }

            if (filters?.dueDateFrom) {
                whereConditions.push('due_date >= ?');
                queryParams.push(filters.dueDateFrom);
            }

            if (filters?.dueDateTo) {
                whereConditions.push('due_date <= ?');
                queryParams.push(filters.dueDateTo);
            }

            // Get all items with WHERE conditions first
            let items = await databaseService.findAll<any>('action_items', whereConditions.join(' AND '), queryParams);

            // Sort by created_at descending
            items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            // Apply pagination manually
            if (filters?.limit) {
                const startIndex = filters.page && filters.page > 1 ? (filters.page - 1) * filters.limit : 0;
                const endIndex = startIndex + filters.limit;
                items = items.slice(startIndex, endIndex);
            }

            const actionItems: ActionItem[] = items.map(item => {
                // Use local decrypted content if available, otherwise try to decode encrypted content
                let title = item.title || 'Untitled Action';
                let description = item.description || '';

                // If we have encrypted content and no local content, try to decode
                if ((!item.title || !item.description) && item.encrypted_content) {
                    const decodedContent = this.decodeActionItemContent(item.encrypted_content);
                    title = decodedContent.title || title;
                    description = decodedContent.description || description;
                }

                return {
                    id: item.id,
                    title,
                    description,
                    status: item.status,
                    priority: item.priority,
                    assigneeId: item.assignee_id || item.user_id,
                    assigneeName: item.assignee_name || 'Current User',
                    dueDate: item.due_date,
                    personId: item.person_id,
                    groupId: item.group_id,
                    noteId: item.note_id,
                    createdAt: item.created_at,
                    updatedAt: item.updated_at
                };
            });

            // Trigger background sync if online
            if (syncService.isConnected() && !syncService.isSyncing()) {
                syncService.manualSync().catch(console.error);
            }

            return {
                success: true,
                data: actionItems
            };
        } catch (error) {
            console.error('Failed to fetch action items from local database:', error);

            // Fallback to API if local database fails
            try {
                return await this.getActionItemsFromAPI(filters);
            } catch (apiError) {
                return {
                    success: false,
                    error: {
                        message: 'Failed to fetch action items from both local and remote sources',
                        code: 500,
                        details: error instanceof Error ? error.message : 'Unknown error'
                    }
                };
            }
        }
    }

    /**
     * Fallback method to get action items from API
     */
    private async getActionItemsFromAPI(filters?: {
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
            let items: ActionItemAPI[] = [];

            if (!response.data) {
                return { success: true, data: [] };
            }

            if (response.data.data && Array.isArray(response.data.data)) {
                items = response.data.data;
            } else if (response.data.data?.items) {
                items = response.data.data.items;
            } else if (Array.isArray(response.data.items)) {
                items = response.data.items;
            } else if (Array.isArray(response.data)) {
                items = response.data;
            } else {
                items = [];
            }

            const actionItems: ActionItem[] = items.map(item => {
                const decodedContent = this.decodeActionItemContent(item.encrypted_content);

                return {
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
            });

            return { success: true, data: actionItems };
        }

        return {
            success: false,
            error: response.error || { message: 'Failed to fetch action items', code: 500 }
        };
    }

    async getActionItemById(id: string): Promise<ApiResponse<ActionItem>> {
        try {
            // Try to get from local database first
            const item = await databaseService.findById<any>('action_items', id);

            if (item && !item.deleted_at) {
                // Use local decrypted content if available, otherwise try to decode encrypted content
                let title = item.title || 'Untitled Action';
                let description = item.description || '';

                // If we have encrypted content and no local content, try to decode
                if ((!item.title || !item.description) && item.encrypted_content) {
                    const decodedContent = this.decodeActionItemContent(item.encrypted_content);
                    title = decodedContent.title || title;
                    description = decodedContent.description || description;
                }

                const actionItem: ActionItem = {
                    id: item.id,
                    title,
                    description,
                    status: item.status,
                    priority: item.priority,
                    assigneeId: item.assignee_id || item.user_id,
                    assigneeName: item.assignee_name || 'Current User',
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

            // Fallback to API if not found locally
            return await this.getActionItemByIdFromAPI(id);
        } catch (error) {
            console.error('Failed to fetch action item from local database:', error);

            // Fallback to API if local database fails
            try {
                return await this.getActionItemByIdFromAPI(id);
            } catch (apiError) {
                return {
                    success: false,
                    error: {
                        message: 'Failed to fetch action item from both local and remote sources',
                        code: 500,
                        details: error instanceof Error ? error.message : 'Unknown error'
                    }
                };
            }
        }
    }

    /**
     * Fallback method to get action item by ID from API
     */
    private async getActionItemByIdFromAPI(id: string): Promise<ApiResponse<ActionItem>> {
        const response = await apiService.get<ActionResponse>(`/actions/${id}`);

        if (response.success && response.data?.data) {
            const item = response.data.data;
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

            return { success: true, data: actionItem };
        }

        return {
            success: false,
            error: response.error || { message: 'Action item not found', code: 404 }
        };
    }

    async createActionItem(actionData: CreateActionItemRequest & { encryptedContent: string; encryptedKeys: Record<string, string>; iv: string }): Promise<ApiResponse<ActionItem>> {
        try {
            const now = new Date().toISOString();
            const id = crypto.randomUUID();
            const userProfile = await authService.getUserProfile();
            const userId = userProfile.success ? userProfile.data?.id : null;

            if (!userId) {
                return {
                    success: false,
                    error: { message: 'User not authenticated', code: 401 }
                };
            }

            // Create action item in local database first
            const localActionItem = {
                id,
                user_id: userId,
                title: actionData.title,
                description: actionData.description || '',
                status: 'pending' as const,
                priority: actionData.priority,
                assignee_id: userId,
                assignee_name: 'Current User',
                due_date: actionData.dueDate,
                person_id: actionData.personId,
                group_id: actionData.groupId,
                note_id: actionData.noteId,
                encrypted_content: actionData.encryptedContent,
                encrypted_keys: JSON.stringify(actionData.encryptedKeys),
                iv: actionData.iv,
                created_at: now,
                updated_at: now
            };

            await databaseService.insert('action_items', localActionItem);

            // Trigger background sync to upload to server
            if (syncService.isConnected() && !syncService.isSyncing()) {
                syncService.manualSync().catch(console.error);
            }

            const actionItem: ActionItem = {
                id,
                title: actionData.title,
                description: actionData.description || '',
                status: 'pending',
                priority: actionData.priority,
                assigneeId: userId,
                assigneeName: 'Current User',
                dueDate: actionData.dueDate,
                personId: actionData.personId,
                groupId: actionData.groupId,
                noteId: actionData.noteId,
                createdAt: now,
                updatedAt: now
            };

            return {
                success: true,
                data: actionItem
            };
        } catch (error) {
            console.error('Failed to create action item in local database:', error);

            // Fallback to API if local database fails
            try {
                return await this.createActionItemViaAPI(actionData);
            } catch (apiError) {
                return {
                    success: false,
                    error: {
                        message: 'Failed to create action item in both local and remote sources',
                        code: 500,
                        details: error instanceof Error ? error.message : 'Unknown error'
                    }
                };
            }
        }
    }

    /**
     * Fallback method to create action item via API
     */
    private async createActionItemViaAPI(actionData: CreateActionItemRequest & { encryptedContent: string; encryptedKeys: Record<string, string>; iv: string }): Promise<ApiResponse<ActionItem>> {
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
        };

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
                assigneeName: 'Current User',
                dueDate: item.due_date,
                personId: item.person_id,
                groupId: item.group_id,
                noteId: item.note_id,
                createdAt: item.created_at,
                updatedAt: item.updated_at
            };

            return { success: true, data: actionItem };
        }

        return {
            success: false,
            error: response.error || { message: 'Failed to create action item', code: 500 }
        };
    }

    async updateActionItem(id: string, actionData: Partial<CreateActionItemRequest> & { encryptedContent?: string; encryptedKeys?: Record<string, string>; iv?: string }): Promise<ApiResponse<ActionItem>> {
        try {
            const updateData: any = {
                updated_at: new Date().toISOString()
            };

            if (actionData.title !== undefined) updateData.title = actionData.title;
            if (actionData.description !== undefined) updateData.description = actionData.description;
            if (actionData.encryptedContent) updateData.encrypted_content = actionData.encryptedContent;
            if (actionData.encryptedKeys) updateData.encrypted_keys = JSON.stringify(actionData.encryptedKeys);
            if (actionData.iv) updateData.iv = actionData.iv;
            if (actionData.dueDate !== undefined) updateData.due_date = actionData.dueDate;
            if (actionData.priority) updateData.priority = actionData.priority;
            if (actionData.personId !== undefined) updateData.person_id = actionData.personId;
            if (actionData.groupId !== undefined) updateData.group_id = actionData.groupId;
            if (actionData.noteId !== undefined) updateData.note_id = actionData.noteId;

            // Update in local database first
            await databaseService.update('action_items', id, updateData);

            // Trigger background sync
            if (syncService.isConnected() && !syncService.isSyncing()) {
                syncService.manualSync().catch(console.error);
            }

            // Get the updated item from local database
            const updatedItem = await databaseService.findById<any>('action_items', id);

            if (updatedItem) {
                let title = updatedItem.title || 'Untitled Action';
                let description = updatedItem.description || '';

                // If we have encrypted content and no local content, try to decode
                if ((!updatedItem.title || !updatedItem.description) && updatedItem.encrypted_content) {
                    const decodedContent = this.decodeActionItemContent(updatedItem.encrypted_content);
                    title = decodedContent.title || title;
                    description = decodedContent.description || description;
                }

                const actionItem: ActionItem = {
                    id: updatedItem.id,
                    title,
                    description,
                    status: updatedItem.status,
                    priority: updatedItem.priority,
                    assigneeId: updatedItem.assignee_id || updatedItem.user_id,
                    assigneeName: updatedItem.assignee_name || 'Current User',
                    dueDate: updatedItem.due_date,
                    personId: updatedItem.person_id,
                    groupId: updatedItem.group_id,
                    noteId: updatedItem.note_id,
                    createdAt: updatedItem.created_at,
                    updatedAt: updatedItem.updated_at
                };

                return {
                    success: true,
                    data: actionItem
                };
            }

            return {
                success: false,
                error: { message: 'Failed to retrieve updated action item', code: 500 }
            };
        } catch (error) {
            console.error('Failed to update action item in local database:', error);

            // Fallback to API if local database fails
            try {
                return await this.updateActionItemViaAPI(id, actionData);
            } catch (apiError) {
                return {
                    success: false,
                    error: {
                        message: 'Failed to update action item in both local and remote sources',
                        code: 500,
                        details: error instanceof Error ? error.message : 'Unknown error'
                    }
                };
            }
        }
    }

    /**
     * Fallback method to update action item via API
     */
    private async updateActionItemViaAPI(id: string, actionData: Partial<CreateActionItemRequest> & { encryptedContent?: string; encryptedKeys?: Record<string, string>; iv?: string }): Promise<ApiResponse<ActionItem>> {
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

            return { success: true, data: actionItem };
        }

        return {
            success: false,
            error: response.error || { message: 'Failed to update action item', code: 500 }
        };
    }

    async updateActionStatus(id: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled'): Promise<ApiResponse<ActionItem>> {
        try {
            const updateData: any = {
                status,
                updated_at: new Date().toISOString()
            };

            // Set completed_at if marking as completed
            if (status === 'completed') {
                updateData.completed_at = new Date().toISOString();
            } else {
                updateData.completed_at = null;
            }

            // Update in local database first
            await databaseService.update('action_items', id, updateData);

            // Trigger background sync
            if (syncService.isConnected() && !syncService.isSyncing()) {
                syncService.manualSync().catch(console.error);
            }

            // Get the updated item from local database
            const updatedItem = await databaseService.findById<any>('action_items', id);

            if (updatedItem) {
                let title = updatedItem.title || 'Untitled Action';
                let description = updatedItem.description || '';

                // If we have encrypted content and no local content, try to decode
                if ((!updatedItem.title || !updatedItem.description) && updatedItem.encrypted_content) {
                    const decodedContent = this.decodeActionItemContent(updatedItem.encrypted_content);
                    title = decodedContent.title || title;
                    description = decodedContent.description || description;
                }

                const actionItem: ActionItem = {
                    id: updatedItem.id,
                    title,
                    description,
                    status: updatedItem.status,
                    priority: updatedItem.priority,
                    assigneeId: updatedItem.assignee_id || updatedItem.user_id,
                    assigneeName: updatedItem.assignee_name || 'Current User',
                    dueDate: updatedItem.due_date,
                    personId: updatedItem.person_id,
                    groupId: updatedItem.group_id,
                    noteId: updatedItem.note_id,
                    createdAt: updatedItem.created_at,
                    updatedAt: updatedItem.updated_at
                };

                return {
                    success: true,
                    data: actionItem
                };
            }

            return {
                success: false,
                error: { message: 'Failed to retrieve updated action item', code: 500 }
            };
        } catch (error) {
            console.error('Failed to update action status in local database:', error);

            // Fallback to API if local database fails
            try {
                return await this.updateActionStatusViaAPI(id, status);
            } catch (apiError) {
                return {
                    success: false,
                    error: {
                        message: 'Failed to update action status in both local and remote sources',
                        code: 500,
                        details: error instanceof Error ? error.message : 'Unknown error'
                    }
                };
            }
        }
    }

    /**
     * Fallback method to update action status via API
     */
    private async updateActionStatusViaAPI(id: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled'): Promise<ApiResponse<ActionItem>> {
        const response = await apiService.put<ActionResponse>(`/actions/${id}`, { status });

        if (response.success && response.data?.data) {
            const item = response.data.data;
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

            return { success: true, data: actionItem };
        }

        return {
            success: false,
            error: response.error || { message: 'Failed to update action status', code: 500 }
        };
    }

    async deleteActionItem(id: string): Promise<ApiResponse<void>> {
        try {
            // Soft delete in local database first (mark as deleted)
            const updateData = {
                deleted_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            await databaseService.update('action_items', id, updateData);

            // Trigger background sync to propagate deletion to server
            if (syncService.isConnected() && !syncService.isSyncing()) {
                syncService.manualSync().catch(console.error);
            }

            return {
                success: true
            };
        } catch (error) {
            console.error('Failed to delete action item in local database:', error);

            // Fallback to API if local database fails
            try {
                return await this.deleteActionItemViaAPI(id);
            } catch (apiError) {
                return {
                    success: false,
                    error: {
                        message: 'Failed to delete action item in both local and remote sources',
                        code: 500,
                        details: error instanceof Error ? error.message : 'Unknown error'
                    }
                };
            }
        }
    }

    /**
     * Fallback method to delete action item via API
     */
    private async deleteActionItemViaAPI(id: string): Promise<ApiResponse<void>> {
        const response = await apiService.delete(`/actions/${id}`);
        return {
            success: response.success,
            error: response.error
        };
    }
}

export const actionItemsService = new ActionItemsService();
