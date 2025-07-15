import { apiService } from './apiService';
import type { ApiResponse, ActionItem, CreateActionItemRequest } from '../types';

// API response types matching the OpenAPI spec
interface ActionItemAPI {
    id: string;
    userId: string;
    personId?: string;
    groupId?: string;
    noteId?: string;
    title?: string;
    encryptedContent: string;
    encryptedKeys: Record<string, string>;
    iv: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
    person?: {
        id: string;
        firstName: string;
        lastName: string;
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

interface ActionListResponse {
    success: boolean;
    data: {
        items: ActionItemAPI[];
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

interface ActionResponse {
    success: boolean;
    data: ActionItemAPI;
}

class ActionItemsService {
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

            const response = await apiService.get<ActionListResponse>(`/actions?${params}`);

            if (response.success && response.data?.data) {
                const actionItems: ActionItem[] = response.data.data.items.map(item => ({
                    id: item.id,
                    title: item.title || 'Untitled Action',
                    description: item.encryptedContent, // Will need to be decrypted
                    status: item.status,
                    priority: item.priority,
                    assigneeId: item.userId,
                    assigneeName: item.person ? `${item.person.firstName} ${item.person.lastName}` : 'Unknown',
                    dueDate: item.dueDate,
                    personId: item.personId,
                    groupId: item.groupId,
                    noteId: item.noteId,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt
                }));

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
                const actionItem: ActionItem = {
                    id: item.id,
                    title: item.title || 'Untitled Action',
                    description: item.encryptedContent, // Will need to be decrypted
                    status: item.status,
                    priority: item.priority,
                    assigneeId: item.userId,
                    assigneeName: item.person ? `${item.person.firstName} ${item.person.lastName}` : 'Unknown',
                    dueDate: item.dueDate,
                    personId: item.personId,
                    groupId: item.groupId,
                    noteId: item.noteId,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt
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
                    assigneeId: item.userId,
                    assigneeName: actionData.assigneeId, // This should be resolved from user data
                    dueDate: item.dueDate,
                    personId: item.personId,
                    groupId: item.groupId,
                    noteId: item.noteId,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt
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
                const actionItem: ActionItem = {
                    id: item.id,
                    title: item.title || 'Untitled Action',
                    description: actionData.description || '',
                    status: item.status,
                    priority: item.priority,
                    assigneeId: item.userId,
                    assigneeName: item.person ? `${item.person.firstName} ${item.person.lastName}` : 'Unknown',
                    dueDate: item.dueDate,
                    personId: item.personId,
                    groupId: item.groupId,
                    noteId: item.noteId,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt
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
                const actionItem: ActionItem = {
                    id: item.id,
                    title: item.title || 'Untitled Action',
                    description: item.encryptedContent,
                    status: item.status,
                    priority: item.priority,
                    assigneeId: item.userId,
                    assigneeName: item.person ? `${item.person.firstName} ${item.person.lastName}` : 'Unknown',
                    dueDate: item.dueDate,
                    personId: item.personId,
                    groupId: item.groupId,
                    noteId: item.noteId,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt
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
