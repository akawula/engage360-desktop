import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { peopleService } from '../services/peopleService';
import type { Person, CreatePersonRequest } from '../types';

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
        staleTime: 5 * 60 * 1000, // 5 minutes
        select: (data) => data.success ? data.data : null,
    });
};

export const usePerson = (id: string) => {
    return useQuery({
        queryKey: peopleKeys.detail(id),
        queryFn: () => peopleService.getPersonById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
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
        mutationFn: ({ id, updates }: { id: string; updates: Partial<CreatePersonRequest> }) =>
            peopleService.updatePerson(id, updates),
        onSuccess: (response, variables) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: peopleKeys.lists() });
                queryClient.invalidateQueries({ queryKey: peopleKeys.detail(variables.id) });
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
