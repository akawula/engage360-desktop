import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesService } from '../services/notesService';

// Query keys
export const notesKeys = {
    all: ['notes'] as const,
    lists: () => [...notesKeys.all, 'list'] as const,
    list: (params?: {
        page?: number;
        limit?: number;
        personId?: string;
        search?: string;
    }) => [...notesKeys.lists(), params] as const,
    details: () => [...notesKeys.all, 'detail'] as const,
    detail: (id: string) => [...notesKeys.details(), id] as const,
};

// Query hooks
export const useNotes = (params?: {
    page?: number;
    limit?: number;
    personId?: string;
    search?: string;
}) => {
    return useQuery({
        queryKey: notesKeys.list(params),
        queryFn: () => notesService.getNotes(params?.personId, params?.page, params?.limit, params?.search),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes cache
        select: (data) => data.success ? data.data : null,
    });
};

export const useNote = (id: string) => {
    return useQuery({
        queryKey: notesKeys.detail(id),
        queryFn: () => notesService.getNoteById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes cache
        select: (data) => data.success ? data.data : null,
    });
};

// Mutation hooks
export const useDeleteNote = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            // Use the notesService for proper local-first handling
            return notesService.deleteNote(id);
        },
        onMutate: async (id: string) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: notesKeys.all });

            // Snapshot the previous value - get ALL note queries
            const previousNotes = queryClient.getQueriesData({ queryKey: notesKeys.all });

            // Optimistically update ALL note queries to remove the note
            queryClient.setQueriesData({ queryKey: notesKeys.all }, (old: any) => {
                if (!old) return old;

                // Handle different query response structures
                if (old.notes && Array.isArray(old.notes)) {
                    // Structure: { notes: [...], pagination: {...} }
                    return {
                        ...old,
                        notes: old.notes.filter((note: any) => note.id !== id),
                        pagination: {
                            ...old.pagination,
                            total: Math.max(0, (old.pagination?.total || 0) - 1)
                        }
                    };
                } else if (Array.isArray(old)) {
                    // Structure: [note, note, ...]
                    return old.filter((note: any) => note.id !== id);
                }

                return old;
            });

            // Local deletion will be handled by the mutationFn via notesService

            // Return a context object with the snapshotted value
            return { previousNotes };
        },
        onSuccess: (response) => {
            if (response.success) {
                // Force immediate cache clear and refetch for certainty
                queryClient.removeQueries({ queryKey: notesKeys.all });
                queryClient.invalidateQueries({ queryKey: notesKeys.all });
            } else {
                console.error('useDeleteNote: Delete request failed:', response.error);
                throw new Error(response.error?.message || 'Delete failed');
            }
        },
        onError: (error, id, context) => {
            console.error('useDeleteNote: Mutation error for ID:', id, error);

            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousNotes) {
                context.previousNotes.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
        },
        onSettled: () => {
            // Just invalidate for speed - let natural refetch happen
            queryClient.invalidateQueries({ queryKey: notesKeys.all });
        }
    });
};
