import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { growthService } from '../services/growthService';
import type {
    CreateGrowthGoalRequest,
    CreateGrowthPlanRequest,
    CreatePersonSkillRequest,
    CreateGrowthAssessmentRequest,
    GrowthGoal
} from '../types';

// Query keys
export const growthKeys = {
    all: ['growth'] as const,
    goals: () => [...growthKeys.all, 'goals'] as const,
    goal: (id: string) => [...growthKeys.goals(), id] as const,
    goalsByPerson: (personId: string) => [...growthKeys.goals(), 'person', personId] as const,
    plans: () => [...growthKeys.all, 'plans'] as const,
    plan: (id: string) => [...growthKeys.plans(), id] as const,
    plansByPerson: (personId: string) => [...growthKeys.plans(), 'person', personId] as const,
    skills: () => [...growthKeys.all, 'skills'] as const,
    personSkills: (personId: string) => [...growthKeys.skills(), 'person', personId] as const,
    assessments: () => [...growthKeys.all, 'assessments'] as const,
    assessmentsByPerson: (personId: string) => [...growthKeys.assessments(), 'person', personId] as const,
    analytics: (personId: string) => [...growthKeys.all, 'analytics', personId] as const,
    templates: () => [...growthKeys.all, 'templates'] as const,
};

// Growth Goals Hooks
export const useGrowthGoals = (personId: string) => {
    return useQuery({
        queryKey: growthKeys.goalsByPerson(personId),
        queryFn: () => growthService.getGrowthGoals(personId),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes cache
        select: (data) => data.success ? data.data : [],
    });
};

export const useGrowthGoal = (id: string) => {
    return useQuery({
        queryKey: growthKeys.goal(id),
        queryFn: () => growthService.getGrowthGoal(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        select: (data) => data.success ? data.data : null,
    });
};

export const useCreateGrowthGoal = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (goalData: CreateGrowthGoalRequest) =>
            growthService.createGrowthGoal(goalData),
        onSuccess: (response, variables) => {
            if (response.success) {
                queryClient.invalidateQueries({
                    queryKey: growthKeys.goalsByPerson(variables.personId)
                });
                queryClient.invalidateQueries({
                    queryKey: growthKeys.analytics(variables.personId)
                });
            }
        },
    });
};

export const useUpdateGrowthGoal = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<GrowthGoal> }) =>
            growthService.updateGrowthGoal(id, updates),
        onSuccess: (response, variables) => {
            if (response.success && response.data) {
                const goal = response.data;

                // Update individual goal cache
                queryClient.setQueryData(
                    growthKeys.goal(variables.id),
                    response
                );

                // Update goals list cache
                queryClient.setQueriesData(
                    { queryKey: growthKeys.goalsByPerson(goal.personId) },
                    (oldData: any) => {
                        if (oldData?.success && oldData?.data) {
                            return {
                                ...oldData,
                                data: oldData.data.map((g: GrowthGoal) =>
                                    g.id === variables.id ? goal : g
                                )
                            };
                        }
                        return oldData;
                    }
                );

                // Invalidate analytics
                queryClient.invalidateQueries({
                    queryKey: growthKeys.analytics(goal.personId)
                });
            }
        },
    });
};

export const useDeleteGrowthGoal = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => growthService.deleteGrowthGoal(id),
        onSuccess: (response, goalId) => {
            if (response.success) {
                // Remove from all related caches
                queryClient.invalidateQueries({ queryKey: growthKeys.goals() });
                queryClient.removeQueries({ queryKey: growthKeys.goal(goalId) });
            }
        },
    });
};

// Growth Plans Hooks
export const useGrowthPlans = (personId: string) => {
    return useQuery({
        queryKey: growthKeys.plansByPerson(personId),
        queryFn: () => growthService.getGrowthPlans(personId),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        select: (data) => data.success ? data.data : [],
    });
};

export const useGrowthPlan = (id: string) => {
    return useQuery({
        queryKey: growthKeys.plan(id),
        queryFn: () => growthService.getGrowthPlan(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        select: (data) => data.success ? data.data : null,
    });
};

export const useCreateGrowthPlan = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (planData: CreateGrowthPlanRequest) =>
            growthService.createGrowthPlan(planData),
        onSuccess: (response, variables) => {
            if (response.success) {
                queryClient.invalidateQueries({
                    queryKey: growthKeys.plansByPerson(variables.personId)
                });
            }
        },
    });
};

// Skills Hooks
export const useSkills = () => {
    return useQuery({
        queryKey: growthKeys.skills(),
        queryFn: () => growthService.getSkills(),
        staleTime: 30 * 60 * 1000, // 30 minutes - skills change infrequently
        gcTime: 60 * 60 * 1000, // 1 hour cache
        select: (data) => data.success ? data.data : [],
    });
};

export const usePersonSkills = (personId: string) => {
    return useQuery({
        queryKey: growthKeys.personSkills(personId),
        queryFn: () => growthService.getPersonSkills(personId),
        enabled: !!personId,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        select: (data) => data.success ? data.data : [],
    });
};

export const useCreatePersonSkill = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (skillData: CreatePersonSkillRequest) =>
            growthService.createPersonSkill(skillData),
        onSuccess: (response, variables) => {
            if (response.success) {
                queryClient.invalidateQueries({
                    queryKey: growthKeys.personSkills(variables.personId)
                });
            }
        },
    });
};

export const useUpdatePersonSkill = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<any> }) =>
            growthService.updatePersonSkill(id, updates),
        onSuccess: (response) => {
            if (response.success && response.data) {
                const skill = response.data;
                queryClient.invalidateQueries({
                    queryKey: growthKeys.personSkills(skill.personId)
                });
            }
        },
    });
};

// Assessments Hooks
export const useGrowthAssessments = (personId: string) => {
    return useQuery({
        queryKey: growthKeys.assessmentsByPerson(personId),
        queryFn: () => growthService.getGrowthAssessments(personId),
        enabled: !!personId,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        select: (data) => data.success ? data.data : [],
    });
};

export const useCreateGrowthAssessment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (assessmentData: CreateGrowthAssessmentRequest) =>
            growthService.createGrowthAssessment(assessmentData),
        onSuccess: (response, variables) => {
            if (response.success) {
                queryClient.invalidateQueries({
                    queryKey: growthKeys.assessmentsByPerson(variables.personId)
                });
                queryClient.invalidateQueries({
                    queryKey: growthKeys.analytics(variables.personId)
                });
            }
        },
    });
};

// Analytics Hook
export const useGrowthAnalytics = (personId: string) => {
    return useQuery({
        queryKey: growthKeys.analytics(personId),
        queryFn: () => growthService.getGrowthAnalytics(personId),
        enabled: !!personId,
        staleTime: 2 * 60 * 1000, // 2 minutes - analytics should be relatively fresh
        gcTime: 5 * 60 * 1000, // 5 minutes cache
        select: (data) => data.success ? data.data : null,
    });
};

// Templates Hook
export const useGrowthTemplates = () => {
    return useQuery({
        queryKey: growthKeys.templates(),
        queryFn: () => growthService.getGrowthTemplates(),
        staleTime: 30 * 60 * 1000, // 30 minutes - templates change infrequently
        gcTime: 60 * 60 * 1000, // 1 hour cache
        select: (data) => data.success ? data.data : [],
    });
};
