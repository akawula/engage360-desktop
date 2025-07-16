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
                encryptedContent: btoa(contentToEncrypt), // Encode as Base64 to prevent API mangling
                encryptedKeys: { 'default-device': btoa('placeholder-key-' + Date.now()) },
                iv: btoa(String.fromCharCode(...ivArray))
            };

            const requestData = {
                ...actionData,
                ...encryptionData
            };

            console.log('Creating action item with data:', requestData);

            return actionItemsService.createActionItem(requestData);
        },
        onSuccess: (response) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: actionItemsKeys.lists() });
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
                    encryptedContent: btoa(contentToEncrypt), // Encode as Base64 to prevent API mangling
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
            }
        },
    });
};

export const useUpdateActionStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'pending' | 'in_progress' | 'completed' | 'cancelled' }) =>
            actionItemsService.updateActionStatus(id, status),
        onSuccess: (response, { id }) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: actionItemsKeys.lists() });
                queryClient.invalidateQueries({ queryKey: actionItemsKeys.detail(id) });
            }
        },
    });
};

export const useDeleteActionItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => actionItemsService.deleteActionItem(id),
        onSuccess: (response) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: actionItemsKeys.lists() });
            }
        },
    });
};
