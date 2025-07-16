import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { peopleService } from '../services/peopleService';
import type { CreatePersonRequest } from '../types';

// Query keys
export const peopleKeys = {
    all: ['people'] as const,
    lists: () => [...peopleKeys.all, 'list'] as const,
    list: (params?: { limit?: number; offset?: number; search?: string }) =>
        [...peopleKeys.lists(), params] as const,
    details: () => [...peopleKeys.all, 'detail'] as const,
    detail: (id: string) => [...peopleKeys.details(), id] as const,
};

// Query hooks
export const usePeople = (params?: { limit?: number; offset?: number; search?: string }) => {
    return useQuery({
        queryKey: peopleKeys.list(params),
        queryFn: () => peopleService.getPeople(params),
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 15 * 60 * 1000, // 15 minutes cache
        select: (data) => data.success ? data.data : null,
    });
};

export const usePerson = (id: string) => {
    return useQuery({
        queryKey: peopleKeys.detail(id),
        queryFn: () => peopleService.getPersonById(id),
        enabled: !!id,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 15 * 60 * 1000, // 15 minutes cache
        select: (data) => data.success ? data.data : null,
    });
};

// Mutation hooks
export const useCreatePerson = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (personData: CreatePersonRequest) =>
            peopleService.createPerson(personData),
        onSuccess: (response) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: peopleKeys.lists() });
            }
        },
    });
};

export const useUpdatePerson = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<CreatePersonRequest & { avatarUrl?: string }> }) =>
            peopleService.updatePerson(id, updates),
        onSuccess: (response, variables) => {
            if (response.success) {
                const updatedPerson = response.data;

                // Update the cached person detail data directly
                queryClient.setQueryData(
                    peopleKeys.detail(variables.id),
                    (oldData: any) => {
                        if (oldData?.success) {
                            return {
                                ...oldData,
                                data: updatedPerson
                            };
                        }
                        return oldData;
                    }
                );

                // Update the person in all cached people lists immediately
                queryClient.setQueriesData(
                    { queryKey: peopleKeys.lists() },
                    (oldData: any) => {
                        if (oldData?.success && oldData?.data?.people && Array.isArray(oldData.data.people)) {
                            return {
                                ...oldData,
                                data: {
                                    ...oldData.data,
                                    people: oldData.data.people.map((person: any) =>
                                        person.id === variables.id ? updatedPerson : person
                                    )
                                }
                            };
                        }
                        return oldData;
                    }
                );

                // Only invalidate as a fallback if cache updates fail
                setTimeout(() => {
                    queryClient.invalidateQueries({ queryKey: peopleKeys.lists() });
                }, 100);
            }
        },
    });
};

export const useDeletePerson = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => peopleService.deletePerson(id),
        onSuccess: (response) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: peopleKeys.lists() });
            }
        },
    });
};
