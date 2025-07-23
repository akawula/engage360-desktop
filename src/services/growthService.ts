import type {
    GrowthGoal,
    GrowthPlan,
    GrowthAssessment,
    Skill,
    PersonSkill,
    GrowthTemplate,
    CreateGrowthGoalRequest,
    CreateGrowthPlanRequest,
    CreatePersonSkillRequest,
    CreateGrowthAssessmentRequest,
    ApiResponse
} from '../types';

// Mock data for development - in a real app, this would be an API service
export class GrowthService {
    private goals: GrowthGoal[] = [
        {
            id: '1',
            personId: '1',
            title: 'Master React Advanced Patterns',
            description: 'Learn advanced React patterns including hooks, context, and performance optimization',
            category: 'technical',
            priority: 'high',
            status: 'in_progress',
            targetDate: '2025-09-30',
            startDate: '2025-01-15',
            progress: 45,
            skills: ['React', 'JavaScript', 'Performance Optimization'],
            milestones: [
                {
                    id: '1',
                    goalId: '1',
                    title: 'Complete Advanced Hooks Course',
                    description: 'Finish the advanced React hooks course and build a sample project',
                    targetDate: '2025-03-15',
                    completedDate: '2025-03-10',
                    isCompleted: true,
                    order: 1,
                    createdAt: '2025-01-15T10:00:00Z',
                    updatedAt: '2025-03-10T14:30:00Z'
                },
                {
                    id: '2',
                    goalId: '1',
                    title: 'Implement Context API in Production',
                    description: 'Refactor current project to use Context API for state management',
                    targetDate: '2025-05-01',
                    isCompleted: false,
                    order: 2,
                    createdAt: '2025-01-15T10:00:00Z',
                    updatedAt: '2025-01-15T10:00:00Z'
                },
                {
                    id: '3',
                    goalId: '1',
                    title: 'Performance Optimization Workshop',
                    description: 'Complete performance optimization training and apply learnings',
                    targetDate: '2025-07-15',
                    isCompleted: false,
                    order: 3,
                    createdAt: '2025-01-15T10:00:00Z',
                    updatedAt: '2025-01-15T10:00:00Z'
                }
            ],
            notes: 'Making good progress. Need to focus more on performance aspects.',
            createdAt: '2025-01-15T10:00:00Z',
            updatedAt: '2025-07-20T15:20:00Z'
        },
        {
            id: '2',
            personId: '1',
            title: 'Develop Leadership Skills',
            description: 'Enhance leadership capabilities to prepare for team lead role',
            category: 'leadership',
            priority: 'medium',
            status: 'not_started',
            targetDate: '2025-12-31',
            progress: 0,
            skills: ['Leadership', 'Communication', 'Team Management'],
            milestones: [
                {
                    id: '4',
                    goalId: '2',
                    title: 'Complete Leadership Fundamentals Course',
                    targetDate: '2025-09-01',
                    isCompleted: false,
                    order: 1,
                    createdAt: '2025-07-23T10:00:00Z',
                    updatedAt: '2025-07-23T10:00:00Z'
                },
                {
                    id: '5',
                    goalId: '2',
                    title: 'Lead a Cross-Functional Project',
                    description: 'Take ownership of a project involving multiple teams',
                    targetDate: '2025-11-30',
                    isCompleted: false,
                    order: 2,
                    createdAt: '2025-07-23T10:00:00Z',
                    updatedAt: '2025-07-23T10:00:00Z'
                }
            ],
            createdAt: '2025-07-23T10:00:00Z',
            updatedAt: '2025-07-23T10:00:00Z'
        }
    ];

    private skills: Skill[] = [
        {
            id: '1',
            name: 'React',
            category: 'technical',
            description: 'JavaScript library for building user interfaces',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z'
        },
        {
            id: '2',
            name: 'Leadership',
            category: 'leadership',
            description: 'Ability to guide and inspire teams',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z'
        },
        {
            id: '3',
            name: 'Communication',
            category: 'soft',
            description: 'Effective verbal and written communication skills',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z'
        },
        {
            id: '4',
            name: 'TypeScript',
            category: 'technical',
            description: 'Strongly typed programming language that builds on JavaScript',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z'
        },
        {
            id: '5',
            name: 'Team Management',
            category: 'leadership',
            description: 'Skills for managing and developing team members',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z'
        },
        {
            id: '6',
            name: 'Performance Optimization',
            category: 'technical',
            description: 'Techniques for improving application performance',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z'
        }
    ];

    private personSkills: PersonSkill[] = [
        {
            id: '1',
            personId: '1',
            skillId: '1',
            skill: this.skills[0],
            currentLevel: 4,
            targetLevel: 5,
            lastAssessmentDate: '2025-07-01',
            notes: 'Strong React foundation, working toward expert level patterns',
            createdAt: '2025-01-15T10:00:00Z',
            updatedAt: '2025-07-01T10:00:00Z'
        },
        {
            id: '2',
            personId: '1',
            skillId: '2',
            skill: this.skills[1],
            currentLevel: 2,
            targetLevel: 4,
            notes: 'Starting to take on more leadership responsibilities',
            createdAt: '2025-01-15T10:00:00Z',
            updatedAt: '2025-07-01T10:00:00Z'
        },
        {
            id: '3',
            personId: '1',
            skillId: '4',
            skill: this.skills[3],
            currentLevel: 4,
            targetLevel: 5,
            lastAssessmentDate: '2025-06-15',
            notes: 'Strong TypeScript skills, could mentor others',
            createdAt: '2025-01-15T10:00:00Z',
            updatedAt: '2025-06-15T10:00:00Z'
        }
    ];

    private plans: GrowthPlan[] = [
        {
            id: '1',
            personId: '1',
            title: 'Q3-Q4 2025 Development Plan',
            description: 'Focus on technical leadership and advanced React skills',
            startDate: '2025-07-01',
            endDate: '2025-12-31',
            status: 'active',
            goals: this.goals,
            reviewFrequency: 'monthly',
            lastReviewDate: '2025-07-01',
            nextReviewDate: '2025-08-01',
            createdAt: '2025-06-25T10:00:00Z',
            updatedAt: '2025-07-23T10:00:00Z'
        }
    ];

    private assessments: GrowthAssessment[] = [
        {
            id: '1',
            personId: '1',
            planId: '1',
            assessmentDate: '2025-07-01',
            overallProgress: 35,
            strengths: [
                'Strong technical foundation',
                'Good problem-solving skills',
                'Collaborative team player'
            ],
            areasForImprovement: [
                'Leadership communication',
                'Time management',
                'Strategic thinking'
            ],
            achievements: [
                'Completed React hooks training',
                'Successfully delivered Q2 project',
                'Mentored junior developer'
            ],
            challenges: [
                'Balancing technical depth with leadership responsibilities',
                'Managing multiple priorities'
            ],
            feedback: 'Making excellent progress on technical skills. Ready to take on more leadership challenges.',
            assessorType: 'manager',
            createdAt: '2025-07-01T10:00:00Z',
            updatedAt: '2025-07-01T10:00:00Z'
        }
    ];

    private templates: GrowthTemplate[] = [
        {
            id: '1',
            name: 'Frontend Developer Career Path',
            description: 'Comprehensive growth plan for frontend developers',
            category: 'Technical',
            targetRole: 'Senior Frontend Developer',
            goals: [
                {
                    title: 'Master Modern Frontend Frameworks',
                    description: 'Become proficient in React, Vue, or Angular',
                    category: 'technical',
                    priority: 'high',
                    status: 'not_started',
                    progress: 0,
                    milestones: [],
                    skills: ['React', 'Vue', 'Angular']
                },
                {
                    title: 'Learn Build Tools and DevOps',
                    description: 'Understand webpack, CI/CD, and deployment strategies',
                    category: 'technical',
                    priority: 'medium',
                    status: 'not_started',
                    progress: 0,
                    milestones: [],
                    skills: ['Webpack', 'CI/CD', 'DevOps']
                }
            ],
            skills: ['React', 'TypeScript', 'CSS', 'Testing', 'Performance'],
            duration: 12,
            isPublic: true,
            createdBy: 'system',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z'
        }
    ];

    // Goals
    async getGrowthGoals(personId: string): Promise<ApiResponse<GrowthGoal[]>> {
        const personGoals = this.goals.filter(goal => goal.personId === personId);
        return {
            success: true,
            data: personGoals
        };
    }

    async getGrowthGoal(id: string): Promise<ApiResponse<GrowthGoal>> {
        const goal = this.goals.find(g => g.id === id);
        if (goal) {
            return { success: true, data: goal };
        }
        return { success: false, error: { message: 'Goal not found', code: 404 } };
    }

    async createGrowthGoal(goalData: CreateGrowthGoalRequest): Promise<ApiResponse<GrowthGoal>> {
        const newGoal: GrowthGoal = {
            id: (this.goals.length + 1).toString(),
            ...goalData,
            status: 'not_started',
            progress: 0,
            skills: goalData.skills || [],
            milestones: goalData.milestones?.map((m, index) => ({
                ...m,
                id: `${this.goals.length + 1}-${index + 1}`,
                goalId: (this.goals.length + 1).toString(),
                isCompleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })) || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.goals.push(newGoal);
        return { success: true, data: newGoal };
    }

    async updateGrowthGoal(id: string, updates: Partial<GrowthGoal>): Promise<ApiResponse<GrowthGoal>> {
        const index = this.goals.findIndex(g => g.id === id);
        if (index === -1) {
            return { success: false, error: { message: 'Goal not found', code: 404 } };
        }

        this.goals[index] = {
            ...this.goals[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        return { success: true, data: this.goals[index] };
    }

    async deleteGrowthGoal(id: string): Promise<ApiResponse<void>> {
        const index = this.goals.findIndex(g => g.id === id);
        if (index === -1) {
            return { success: false, error: { message: 'Goal not found', code: 404 } };
        }

        this.goals.splice(index, 1);
        return { success: true };
    }

    // Skills
    async getSkills(): Promise<ApiResponse<Skill[]>> {
        return { success: true, data: this.skills };
    }

    async getPersonSkills(personId: string): Promise<ApiResponse<PersonSkill[]>> {
        const personSkills = this.personSkills.filter(ps => ps.personId === personId);
        return { success: true, data: personSkills };
    }

    async createPersonSkill(skillData: CreatePersonSkillRequest): Promise<ApiResponse<PersonSkill>> {
        const skill = this.skills.find(s => s.id === skillData.skillId);
        if (!skill) {
            return { success: false, error: { message: 'Skill not found', code: 404 } };
        }

        const newPersonSkill: PersonSkill = {
            id: (this.personSkills.length + 1).toString(),
            ...skillData,
            skill,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.personSkills.push(newPersonSkill);
        return { success: true, data: newPersonSkill };
    }

    async updatePersonSkill(id: string, updates: Partial<PersonSkill>): Promise<ApiResponse<PersonSkill>> {
        const index = this.personSkills.findIndex(ps => ps.id === id);
        if (index === -1) {
            return { success: false, error: { message: 'Person skill not found', code: 404 } };
        }

        this.personSkills[index] = {
            ...this.personSkills[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        return { success: true, data: this.personSkills[index] };
    }

    // Plans
    async getGrowthPlans(personId: string): Promise<ApiResponse<GrowthPlan[]>> {
        const personPlans = this.plans.filter(plan => plan.personId === personId);
        return { success: true, data: personPlans };
    }

    async getGrowthPlan(id: string): Promise<ApiResponse<GrowthPlan>> {
        const plan = this.plans.find(p => p.id === id);
        if (plan) {
            return { success: true, data: plan };
        }
        return { success: false, error: { message: 'Plan not found', code: 404 } };
    }

    async createGrowthPlan(planData: CreateGrowthPlanRequest): Promise<ApiResponse<GrowthPlan>> {
        const newPlan: GrowthPlan = {
            id: (this.plans.length + 1).toString(),
            ...planData,
            status: 'draft',
            goals: [],
            nextReviewDate: this.calculateNextReview(planData.startDate, planData.reviewFrequency),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.plans.push(newPlan);
        return { success: true, data: newPlan };
    }

    // Assessments
    async getGrowthAssessments(personId: string): Promise<ApiResponse<GrowthAssessment[]>> {
        const personAssessments = this.assessments.filter(a => a.personId === personId);
        return { success: true, data: personAssessments };
    }

    async createGrowthAssessment(assessmentData: CreateGrowthAssessmentRequest): Promise<ApiResponse<GrowthAssessment>> {
        const newAssessment: GrowthAssessment = {
            id: (this.assessments.length + 1).toString(),
            ...assessmentData,
            assessmentDate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.assessments.push(newAssessment);
        return { success: true, data: newAssessment };
    }

    // Templates
    async getGrowthTemplates(): Promise<ApiResponse<GrowthTemplate[]>> {
        return { success: true, data: this.templates };
    }

    // Helper methods
    private calculateNextReview(startDate: string, frequency: GrowthPlan['reviewFrequency']): string {
        const start = new Date(startDate);
        const daysToAdd = {
            weekly: 7,
            biweekly: 14,
            monthly: 30,
            quarterly: 90
        }[frequency];

        start.setDate(start.getDate() + daysToAdd);
        return start.toISOString().split('T')[0];
    }

    // Analytics
    async getGrowthAnalytics(personId: string): Promise<ApiResponse<{
        totalGoals: number;
        completedGoals: number;
        inProgressGoals: number;
        averageProgress: number;
        skillsCount: number;
        recentAssessments: number;
    }>> {
        const goals = this.goals.filter(g => g.personId === personId);
        const skills = this.personSkills.filter(ps => ps.personId === personId);
        const assessments = this.assessments.filter(a => a.personId === personId);

        const completedGoals = goals.filter(g => g.status === 'completed').length;
        const inProgressGoals = goals.filter(g => g.status === 'in_progress').length;
        const averageProgress = goals.length > 0
            ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
            : 0;

        return {
            success: true,
            data: {
                totalGoals: goals.length,
                completedGoals,
                inProgressGoals,
                averageProgress,
                skillsCount: skills.length,
                recentAssessments: assessments.length
            }
        };
    }
}

export const growthService = new GrowthService();
