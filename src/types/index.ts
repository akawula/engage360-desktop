export interface Person {
    id: string;
    firstName: string;
    lastName: string;
    jobDescription?: string;
    avatarUrl?: string;
    phone?: string;
    email?: string;
    tags: string[];
    group?: PersonGroup;
    counts?: {
        notes: number;
        achievements: number;
        actions: number;
    };
    createdAt: string;
    updatedAt: string;
    // Frontend-only fields for compatibility
    notes?: Note[];
    groups?: PersonGroup[];
    lastInteraction?: string;
    engagementScore?: number;
    // UI compatibility fields
    avatar?: string; // Alias for avatarUrl
    position?: string; // Alias for jobDescription
    githubUsername?: string; // Additional profile field
    // Growth-related fields
    growthPlans?: GrowthPlan[];
    skills?: PersonSkill[];
    currentGrowthGoals?: GrowthGoal[];
    recentAssessments?: GrowthAssessment[];
}

export interface Group {
    id: string;
    name: string;
    description?: string;
    tags: string[];
    color?: string;
    memberCount: number;
    userId: string;
    createdAt: string;
    updatedAt: string;
    // Populated only when needed (e.g., for detailed views)
    members?: Person[];
    // UI compatibility field
    type?: 'team' | 'project' | 'customer' | 'interest';
}

// Simplified group type for groups embedded in person responses
export interface PersonGroup {
    id: string;
    name: string;
    description?: string;
    color?: string;
    tags?: string[];
    memberCount?: number;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    type: 'meeting' | 'call' | 'email' | 'personal' | 'follow_up';
    personId?: string;
    groupId?: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    // Encryption fields (optional for backward compatibility)
    encrypted?: boolean;
    encryptedContent?: string;  // Base64 encoded encrypted content
    contentIV?: string;         // Base64 encoded initialization vector
    deviceKeys?: Array<{        // AES key encrypted for each trusted device
        deviceId: string;
        encryptedKey: string;
    }>;
}

// Extended note type for handling encryption operations
export interface EncryptedNote extends Omit<Note, 'content'> {
    encrypted: true;
    encryptedContent: string;
    contentIV: string;
    deviceKeys: Array<{
        deviceId: string;
        encryptedKey: string;
    }>;
    // Content is only available after decryption
    content?: string;
}

export interface ActionItem {
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assigneeId: string;
    assigneeName: string;
    dueDate?: string;
    personId?: string;
    groupId?: string;
    noteId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Device {
    id: string;
    userId: string;
    deviceName: string;
    deviceType: string; // 'laptop', 'mobile', 'tablet', 'desktop', etc.
    platform?: string; // Operating system or browser info
    version?: string;
    trusted: boolean;
    lastUsed?: string;
    createdAt: string;
    // Computed properties for UI compatibility
    name?: string; // Alias for deviceName
    type?: 'desktop' | 'mobile' | 'tablet' | 'laptop';
    lastSeen?: string; // Alias for lastUsed
    isActive?: boolean; // Computed based on lastUsed
    registeredAt?: string; // Alias for createdAt
}

export interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    preferences: {
        theme: 'light' | 'dark' | 'auto';
        notifications: {
            email: boolean;
            push: boolean;
            actionItems: boolean;
        };
    };
    createdAt: string;
    updatedAt: string;
}

// Form types
export interface CreatePersonRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    position?: string;
    githubUsername?: string;
    tags?: string[];
    avatarUrl?: string;
}

export interface CreateGroupRequest {
    name: string;
    description?: string;
    tags?: string[];
    color?: string;
    type?: 'team' | 'project' | 'customer' | 'interest';
}

export interface CreateNoteRequest {
    title: string;
    content: string;
    type: 'meeting' | 'call' | 'email' | 'personal' | 'follow_up';
    personId?: string | null;
    groupId?: string | null;
    tags?: string[];
}

export interface CreateActionItemRequest {
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: string;
    personId?: string;
    groupId?: string;
    noteId?: string;
    // Note: assigneeId is not part of the API - actions are automatically assigned to the current user
}

// Personal Growth Types
export interface GrowthGoal {
    id: string;
    personId: string;
    title: string;
    description?: string;
    category: 'technical' | 'leadership' | 'communication' | 'business' | 'personal' | 'other';
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
    targetDate?: string;
    startDate?: string;
    completedDate?: string;
    progress: number; // 0-100
    milestones: GrowthMilestone[];
    skills: string[]; // Related skills this goal develops
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface GrowthMilestone {
    id: string;
    goalId: string;
    title: string;
    description?: string;
    targetDate?: string;
    completedDate?: string;
    isCompleted: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface Skill {
    id: string;
    name: string;
    category: 'technical' | 'soft' | 'leadership' | 'domain';
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PersonSkill {
    id: string;
    personId: string;
    skillId: string;
    skill: Skill;
    currentLevel: 1 | 2 | 3 | 4 | 5; // 1: Beginner, 2: Novice, 3: Intermediate, 4: Advanced, 5: Expert
    targetLevel: 1 | 2 | 3 | 4 | 5;
    lastAssessmentDate?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface GrowthPlan {
    id: string;
    personId: string;
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    status: 'draft' | 'active' | 'completed' | 'archived';
    goals: GrowthGoal[];
    reviewFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
    lastReviewDate?: string;
    nextReviewDate?: string;
    createdAt: string;
    updatedAt: string;
}

export interface GrowthAssessment {
    id: string;
    personId: string;
    planId?: string;
    assessmentDate: string;
    overallProgress: number; // 0-100
    strengths: string[];
    areasForImprovement: string[];
    achievements: string[];
    challenges: string[];
    feedback?: string;
    assessorId?: string; // Could be manager, mentor, or self
    assessorType: 'self' | 'manager' | 'peer' | 'mentor' | 'external';
    createdAt: string;
    updatedAt: string;
}

export interface GrowthTemplate {
    id: string;
    name: string;
    description?: string;
    category: string;
    targetRole?: string;
    goals: Omit<GrowthGoal, 'id' | 'personId' | 'createdAt' | 'updatedAt'>[];
    skills: string[];
    duration?: number; // in months
    isPublic: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

// Form types for growth features
export interface CreateGrowthGoalRequest {
    personId: string;
    title: string;
    description?: string;
    category: 'technical' | 'leadership' | 'communication' | 'business' | 'personal' | 'other';
    priority: 'low' | 'medium' | 'high' | 'critical';
    targetDate?: string;
    skills?: string[];
    milestones?: Omit<GrowthMilestone, 'id' | 'goalId' | 'createdAt' | 'updatedAt'>[];
}

export interface CreateGrowthPlanRequest {
    personId: string;
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    reviewFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
    goals?: CreateGrowthGoalRequest[];
}

export interface CreatePersonSkillRequest {
    personId: string;
    skillId: string;
    currentLevel: 1 | 2 | 3 | 4 | 5;
    targetLevel: 1 | 2 | 3 | 4 | 5;
    notes?: string;
}

export interface CreateGrowthAssessmentRequest {
    personId: string;
    planId?: string;
    overallProgress: number;
    strengths: string[];
    areasForImprovement: string[];
    achievements: string[];
    challenges: string[];
    feedback?: string;
    assessorType: 'self' | 'manager' | 'peer' | 'mentor' | 'external';
}

// Authentication types
export interface AuthUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface LoginRequest {
    email: string;
    password: string;
    deviceId: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    deviceName: string;
    deviceType: 'desktop' | 'laptop' | 'mobile' | 'tablet';
    devicePublicKey: string;
    masterPublicKey: string;
}

// Simplified registration request for UI forms (without encryption keys)
export interface RegisterFormRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    deviceName: string;
    deviceType: 'desktop' | 'laptop' | 'mobile' | 'tablet';
}

export interface AuthResponse {
    success: boolean;
    message?: string;
    data?: {
        accessToken: string;
        refreshToken: string;
        user: AuthUser;
        device?: {
            id: string;
            name: string;
            type: 'desktop' | 'laptop' | 'mobile' | 'tablet';
            trusted: boolean;
        };
    };
    // Alternative flat structure (in case backend returns differently)
    accessToken?: string;
    refreshToken?: string;
    user?: AuthUser;
    token?: string; // Some APIs use 'token' instead of 'accessToken'
}

// Error handling types
export interface ApiError {
    message: string;
    code: number;
    details?: string;
}

export interface ApiResponse<T> {
    data?: T;
    error?: ApiError;
    success: boolean;
}
