export interface Person {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    company?: string;
    position?: string;
    tags: string[];
    lastInteraction?: string;
    engagementScore: number;
    notes: Note[];
    createdAt: string;
    updatedAt: string;
}

export interface Group {
    id: string;
    name: string;
    description?: string;
    type: 'team' | 'project' | 'customer' | 'interest';
    members: Person[];
    memberCount: number;
    createdAt: string;
    updatedAt: string;
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
    name: string;
    type: 'desktop' | 'mobile' | 'tablet';
    platform: string;
    version?: string;
    lastSeen: string;
    isActive: boolean;
    registeredAt: string;
}

export interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    company?: string;
    position?: string;
    timezone?: string;
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
    company?: string;
    position?: string;
    tags?: string[];
}

export interface CreateGroupRequest {
    name: string;
    description?: string;
    type: 'team' | 'project' | 'customer' | 'interest';
}

export interface CreateNoteRequest {
    title: string;
    content: string;
    type: 'meeting' | 'call' | 'email' | 'personal' | 'follow_up';
    personId?: string;
    groupId?: string;
    tags?: string[];
}

export interface CreateActionItemRequest {
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assigneeId: string;
    dueDate?: string;
    personId?: string;
    groupId?: string;
    noteId?: string;
}

// Authentication types
export interface AuthUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    isEmailVerified: boolean;
    createdAt: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    deviceName: string;
    deviceType: string;
}

export interface AuthResponse {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
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
