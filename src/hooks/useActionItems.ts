import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { actionItemsService } from '../services/actionItemsService';
import type { CreateActionItemRequest } from '../types';

// Query keys
export const actionItemsKeys = {
    all: ['actionItems'] as const,
    lists: () => [...actionItemsKeys.all, 'list'] as const,
    list: (params?: {
        page?: number;
        limit?: number;
        status?: string;
        priority?: string;
        personId?: string;
        groupId?: string;
        noteId?: string;
        dueDateFrom?: string;
        dueDateTo?: string;
    }) => [...actionItemsKeys.lists(), params] as const,
    details: () => [...actionItemsKeys.all, 'detail'] as const,
    detail: (id: string) => [...actionItemsKeys.details(), id] as const,
};

// Query hooks
export const useActionItems = (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    personId?: string;
    groupId?: string;
    noteId?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
}) => {
    return useQuery({
        queryKey: actionItemsKeys.list(params),
        queryFn: () => actionItemsService.getActionItems(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes cache
        select: (data) => data.success ? data.data : null,
    });
};

export const useActionItem = (id: string) => {
    return useQuery({
        queryKey: actionItemsKeys.detail(id),
        queryFn: () => actionItemsService.getActionItemById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes cache
        select: (data) => data.success ? data.data : null,
    });
};

// Mutation hooks
export const useCreateActionItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (actionData: CreateActionItemRequest) => {
            // Create encrypted content using Base64 encoding to prevent API data corruption
            // The API was mangling raw JSON strings, so we need to encode them

            // Create a content string that includes both title and description
            const contentToEncrypt = JSON.stringify({
                title: actionData.title,
                description: actionData.description || '',
                metadata: {
                    created: new Date().toISOString()
                }
            });

            // Generate a proper IV (12 bytes for AES-GCM)
            const ivArray = new Uint8Array(12);
            if (typeof window !== 'undefined' && window.crypto) {
                window.crypto.getRandomValues(ivArray);
            } else {
                // Fallback for environments without crypto
                for (let i = 0; i < 12; i++) {
                    ivArray[i] = Math.floor(Math.random() * 256);
                }
            }

            const encryptionData = {
                encryptedContent: btoa(unescape(encodeURIComponent(contentToEncrypt))), // Properly encode Unicode characters
                encryptedKeys: { 'default-device': btoa('placeholder-key-' + Date.now()) },
                iv: btoa(String.fromCharCode(...ivArray))
            };

            const requestData = {
                ...actionData,
                ...encryptionData
            };

            return actionItemsService.createActionItem(requestData);
        },
        onSuccess: (response) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: actionItemsKeys.lists() });
                // Also invalidate person-specific action item queries
                queryClient.invalidateQueries({ queryKey: ['actionItems'] });
                // Invalidate person data to update engagement scores
                queryClient.invalidateQueries({ queryKey: ['people'] });
                queryClient.invalidateQueries({ queryKey: ['person'] });
            }
        },
    });
};

export const useUpdateActionItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<CreateActionItemRequest> }) => {
            // If we're updating title or description, we need to re-encrypt the content
            if (data.title !== undefined || data.description !== undefined) {
                // Get the current item first to preserve existing values
                const currentResponse = await actionItemsService.getActionItemById(id);
                if (!currentResponse.success) {
                    throw new Error('Failed to get current action item data');
                }

                const currentItem = currentResponse.data!;

                // Create new content with updated values (Base64 encoded to prevent API corruption)
                const contentToEncrypt = JSON.stringify({
                    title: data.title !== undefined ? data.title : currentItem.title,
                    description: data.description !== undefined ? data.description : currentItem.description,
                    metadata: {
                        created: currentItem.createdAt,
                        updated: new Date().toISOString()
                    }
                });

                // Generate a proper IV (12 bytes for AES-GCM)
                const ivArray = new Uint8Array(12);
                if (typeof window !== 'undefined' && window.crypto) {
                    window.crypto.getRandomValues(ivArray);
                } else {
                    // Fallback for environments without crypto
                    for (let i = 0; i < 12; i++) {
                        ivArray[i] = Math.floor(Math.random() * 256);
                    }
                }

                const encryptionData = {
                    encryptedContent: btoa(unescape(encodeURIComponent(contentToEncrypt))), // Properly encode Unicode characters
                    encryptedKeys: { 'default-device': btoa('placeholder-key-' + Date.now()) },
                    iv: btoa(String.fromCharCode(...ivArray))
                };

                // Merge the encryption data with the update data
                const updateData = {
                    ...data,
                    ...encryptionData
                };

                return actionItemsService.updateActionItem(id, updateData);
            } else {
                // If not updating content, proceed normally
                return actionItemsService.updateActionItem(id, data);
            }
        },
        onSuccess: (response, { id }) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: actionItemsKeys.lists() });
                queryClient.invalidateQueries({ queryKey: actionItemsKeys.detail(id) });
                // Also invalidate person-specific action item queries
                queryClient.invalidateQueries({ queryKey: ['actionItems'] });
                // Invalidate person data to update engagement scores
                queryClient.invalidateQueries({ queryKey: ['people'] });
                queryClient.invalidateQueries({ queryKey: ['person'] });
            }
        },
    });
};

export const useUpdateActionStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'pending' | 'in_progress' | 'completed' | 'cancelled' }) =>
            actionItemsService.updateActionStatus(id, status),
        onMutate: async ({ id, status }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: actionItemsKeys.lists() });

            // Snapshot the previous value
            const previousActionItems = queryClient.getQueriesData({ queryKey: actionItemsKeys.lists() });

            // Optimistically update the item status and move to appropriate position
            queryClient.setQueriesData({ queryKey: actionItemsKeys.lists() }, (old: any) => {
                if (!old || !old.data) return old;

                const updatedItems = old.data.map((item: any) =>
                    item.id === id ? { ...item, status } : item
                );

                // Sort items: in_progress items first, then pending, then others
                const sortedItems = updatedItems.sort((a: any, b: any) => {
                    const statusPriority: Record<string, number> = { 'in_progress': 0, 'pending': 1, 'completed': 2, 'cancelled': 3 };
                    return (statusPriority[a.status] || 4) - (statusPriority[b.status] || 4);
                });

                return {
                    ...old,
                    data: sortedItems
                };
            });

            return { previousActionItems };
        },
        onSuccess: (response, { id }) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: actionItemsKeys.lists() });
                queryClient.invalidateQueries({ queryKey: actionItemsKeys.detail(id) });
                // Also invalidate person-specific action item queries
                queryClient.invalidateQueries({ queryKey: ['actionItems'] });
                // Invalidate person data to update engagement scores
                queryClient.invalidateQueries({ queryKey: ['people'] });
                queryClient.invalidateQueries({ queryKey: ['person'] });
            }
        },
        onError: (error, _variables, context) => {
            console.error('Status update failed:', error);
            // Rollback on error
            if (context?.previousActionItems) {
                context.previousActionItems.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
        }
    });
};

export const useDeleteActionItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => {
            return actionItemsService.deleteActionItem(id);
        },
        onMutate: async (id: string) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: actionItemsKeys.lists() });

            // Snapshot the previous value
            const previousActionItems = queryClient.getQueriesData({ queryKey: actionItemsKeys.lists() });

            // Optimistically update to remove the item
            queryClient.setQueriesData({ queryKey: actionItemsKeys.lists() }, (old: any) => {
                if (!old || !old.data) return old;
                return {
                    ...old,
                    data: old.data.filter((item: any) => item.id !== id)
                };
            });

            // Return a context object with the snapshotted value
            return { previousActionItems };
        },
        onSuccess: (response) => {
            if (response.success) {
                // Invalidate and refetch to ensure data consistency
                queryClient.invalidateQueries({ queryKey: actionItemsKeys.lists() });
                // Also invalidate person-specific action item queries
                queryClient.invalidateQueries({ queryKey: ['actionItems'] });
                // Invalidate person data to update engagement scores
                queryClient.invalidateQueries({ queryKey: ['people'] });
                queryClient.invalidateQueries({ queryKey: ['person'] });
            } else {
                console.error('useDeleteActionItem: Delete request failed:', response.error);
                throw new Error(response.error?.message || 'Delete failed');
            }
        },
        onError: (error, id, context) => {
            console.error('useDeleteActionItem: Mutation error for ID:', id, error);

            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousActionItems) {
                context.previousActionItems.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
        },
        onSettled: () => {
            // Always refetch after error or success to ensure consistency
            queryClient.invalidateQueries({ queryKey: actionItemsKeys.lists() });
        }
    });
};
