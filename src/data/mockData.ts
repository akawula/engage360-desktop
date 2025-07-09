import type { Person, Group, Note, ActionItem, Device, UserProfile } from '../types';

// Mock People Data
export const mockPeople: Person[] = [
    {
        id: 'person-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        phone: '+1-555-123-4567',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        company: 'Tech Solutions Inc.',
        position: 'Senior Developer',
        tags: ['developer', 'javascript', 'react'],
        lastInteraction: '2024-01-15T10:30:00Z',
        engagementScore: 85,
        notes: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
    },
    {
        id: 'person-2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@designco.com',
        phone: '+1-555-987-6543',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b788?w=100&h=100&fit=crop&crop=face',
        company: 'Design Co.',
        position: 'UX Designer',
        tags: ['designer', 'ui', 'ux'],
        lastInteraction: '2024-01-14T14:20:00Z',
        engagementScore: 92,
        notes: [],
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-14T14:20:00Z',
    },
    {
        id: 'person-3',
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@sales.com',
        phone: '+1-555-456-7890',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        company: 'Sales Corp',
        position: 'Sales Manager',
        tags: ['sales', 'b2b', 'enterprise'],
        lastInteraction: '2024-01-13T09:15:00Z',
        engagementScore: 78,
        notes: [],
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-13T09:15:00Z',
    },
    {
        id: 'person-4',
        firstName: 'Sarah',
        lastName: 'Wilson',
        email: 'sarah.wilson@marketing.com',
        phone: '+1-555-321-0987',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
        company: 'Marketing Plus',
        position: 'Marketing Director',
        tags: ['marketing', 'digital', 'strategy'],
        lastInteraction: '2024-01-12T16:45:00Z',
        engagementScore: 88,
        notes: [],
        createdAt: '2024-01-04T00:00:00Z',
        updatedAt: '2024-01-12T16:45:00Z',
    },
    {
        id: 'person-5',
        firstName: 'David',
        lastName: 'Brown',
        email: 'david.brown@consulting.com',
        phone: '+1-555-654-3210',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
        company: 'Consulting Group',
        position: 'Senior Consultant',
        tags: ['consulting', 'strategy', 'business'],
        lastInteraction: '2024-01-11T11:20:00Z',
        engagementScore: 75,
        notes: [],
        createdAt: '2024-01-05T00:00:00Z',
        updatedAt: '2024-01-11T11:20:00Z',
    },
];

// Mock Groups Data
export const mockGroups: Group[] = [
    {
        id: 'group-1',
        name: 'Development Team',
        description: 'Core development team for the main product',
        type: 'team',
        members: [mockPeople[0], mockPeople[1]],
        memberCount: 2,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
    },
    {
        id: 'group-2',
        name: 'Q1 2024 Project',
        description: 'Project team for Q1 deliverables',
        type: 'project',
        members: [mockPeople[0], mockPeople[2], mockPeople[3]],
        memberCount: 3,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-14T14:20:00Z',
    },
    {
        id: 'group-3',
        name: 'Enterprise Customers',
        description: 'Key enterprise customer contacts',
        type: 'customer',
        members: [mockPeople[2], mockPeople[4]],
        memberCount: 2,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-13T09:15:00Z',
    },
    {
        id: 'group-4',
        name: 'JavaScript Enthusiasts',
        description: 'Group for people interested in JavaScript development',
        type: 'interest',
        members: [mockPeople[0], mockPeople[1]],
        memberCount: 2,
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-12T16:45:00Z',
    },
];

// Mock Notes Data
export const mockNotes: Note[] = [
    {
        id: 'note-1',
        title: 'Weekly Team Meeting',
        content: 'Discussed project progress and upcoming milestones. Team is on track for Q1 deliverables.',
        type: 'meeting',
        personId: 'person-1',
        groupId: 'group-1',
        tags: ['meeting', 'weekly', 'progress'],
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
    },
    {
        id: 'note-2',
        title: 'Client Call - Design Review',
        content: 'Reviewed the new design mockups with Jane. Client loved the new UI direction. Need to implement feedback by Friday.',
        type: 'call',
        personId: 'person-2',
        tags: ['design', 'client', 'feedback'],
        createdAt: '2024-01-14T14:20:00Z',
        updatedAt: '2024-01-14T14:20:00Z',
    },
    {
        id: 'note-3',
        title: 'Sales Pipeline Update',
        content: 'Mike provided an update on the enterprise sales pipeline. 3 new prospects in the final stage.',
        type: 'meeting',
        personId: 'person-3',
        groupId: 'group-3',
        tags: ['sales', 'pipeline', 'enterprise'],
        createdAt: '2024-01-13T09:15:00Z',
        updatedAt: '2024-01-13T09:15:00Z',
    },
    {
        id: 'note-4',
        title: 'Marketing Campaign Discussion',
        content: 'Brainstormed ideas for the Q2 marketing campaign. Focus on digital channels and content marketing.',
        type: 'meeting',
        personId: 'person-4',
        tags: ['marketing', 'campaign', 'strategy'],
        createdAt: '2024-01-12T16:45:00Z',
        updatedAt: '2024-01-12T16:45:00Z',
    },
    {
        id: 'note-5',
        title: 'Follow-up on Consulting Proposal',
        content: 'Need to follow up with David on the consulting proposal. He mentioned interest in expanding the scope.',
        type: 'follow_up',
        personId: 'person-5',
        tags: ['consulting', 'proposal', 'follow-up'],
        createdAt: '2024-01-11T11:20:00Z',
        updatedAt: '2024-01-11T11:20:00Z',
    },
];

// Mock Action Items Data
export const mockActionItems: ActionItem[] = [
    {
        id: 'action-1',
        title: 'Complete API documentation',
        description: 'Write comprehensive API documentation for the new endpoints',
        status: 'in_progress',
        priority: 'high',
        assigneeId: 'person-1',
        assigneeName: 'John Doe',
        dueDate: '2024-01-20',
        personId: 'person-1',
        groupId: 'group-1',
        noteId: 'note-1',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T12:00:00Z',
    },
    {
        id: 'action-2',
        title: 'Implement design feedback',
        description: 'Apply the feedback from the client design review',
        status: 'pending',
        priority: 'medium',
        assigneeId: 'person-2',
        assigneeName: 'Jane Smith',
        dueDate: '2024-01-19',
        personId: 'person-2',
        noteId: 'note-2',
        createdAt: '2024-01-14T14:20:00Z',
        updatedAt: '2024-01-14T14:20:00Z',
    },
    {
        id: 'action-3',
        title: 'Prepare sales presentation',
        description: 'Create presentation for enterprise prospects',
        status: 'pending',
        priority: 'urgent',
        assigneeId: 'person-3',
        assigneeName: 'Mike Johnson',
        dueDate: '2024-01-18',
        personId: 'person-3',
        groupId: 'group-3',
        noteId: 'note-3',
        createdAt: '2024-01-13T09:15:00Z',
        updatedAt: '2024-01-13T09:15:00Z',
    },
    {
        id: 'action-4',
        title: 'Launch Q2 marketing campaign',
        description: 'Execute the Q2 marketing campaign across digital channels',
        status: 'pending',
        priority: 'medium',
        assigneeId: 'person-4',
        assigneeName: 'Sarah Wilson',
        dueDate: '2024-04-01',
        personId: 'person-4',
        noteId: 'note-4',
        createdAt: '2024-01-12T16:45:00Z',
        updatedAt: '2024-01-12T16:45:00Z',
    },
    {
        id: 'action-5',
        title: 'Follow up on proposal',
        description: 'Contact David about expanding the consulting proposal scope',
        status: 'completed',
        priority: 'low',
        assigneeId: 'person-5',
        assigneeName: 'David Brown',
        dueDate: '2024-01-15',
        personId: 'person-5',
        noteId: 'note-5',
        createdAt: '2024-01-11T11:20:00Z',
        updatedAt: '2024-01-15T09:00:00Z',
    },
];

// Mock Devices Data
export const mockDevices: Device[] = [
    {
        id: 'device-1',
        name: 'MacBook Pro',
        type: 'desktop',
        platform: 'macOS',
        version: '14.2',
        lastSeen: '2024-01-15T10:30:00Z',
        isActive: true,
        registeredAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 'device-2',
        name: 'iPhone 15',
        type: 'mobile',
        platform: 'iOS',
        version: '17.2',
        lastSeen: '2024-01-15T09:45:00Z',
        isActive: true,
        registeredAt: '2024-01-02T00:00:00Z',
    },
    {
        id: 'device-3',
        name: 'iPad Air',
        type: 'tablet',
        platform: 'iPadOS',
        version: '17.2',
        lastSeen: '2024-01-14T18:20:00Z',
        isActive: false,
        registeredAt: '2024-01-03T00:00:00Z',
    },
    {
        id: 'device-4',
        name: 'Windows Laptop',
        type: 'desktop',
        platform: 'Windows',
        version: '11',
        lastSeen: '2024-01-13T16:15:00Z',
        isActive: false,
        registeredAt: '2024-01-04T00:00:00Z',
    },
];

// Mock User Profile Data
export const mockUserProfile: UserProfile = {
    id: 'user-1',
    firstName: 'Alex',
    lastName: 'Johnson',
    email: 'alex.johnson@engage360.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
    company: 'Engage360',
    position: 'Product Manager',
    timezone: 'America/New_York',
    preferences: {
        theme: 'light',
        notifications: {
            email: true,
            push: true,
            actionItems: true,
        },
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
};

// Update mock people with notes
mockPeople.forEach(person => {
    person.notes = mockNotes.filter(note => note.personId === person.id);
});

// Mock API functions
export const mockApi = {
    // People
    getPeople: async () => ({ people: mockPeople, total: mockPeople.length }),
    getPersonById: async (id: string) => mockPeople.find(p => p.id === id),
    createPerson: async (data: any) => ({
        id: `person-${Date.now()}`,
        ...data,
        tags: data.tags || [],
        engagementScore: 0,
        notes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }),
    updatePerson: async (id: string, data: any) => {
        const person = mockPeople.find(p => p.id === id);
        if (!person) throw new Error('Person not found');
        return {
            ...person,
            ...data,
            updatedAt: new Date().toISOString(),
        };
    },
    deletePerson: async (id: string) => {
        const index = mockPeople.findIndex(p => p.id === id);
        if (index === -1) throw new Error('Person not found');
        mockPeople.splice(index, 1);
    },

    // Groups
    getGroups: async () => mockGroups,
    getGroupById: async (id: string) => mockGroups.find(g => g.id === id),
    getGroupMembers: async (groupId: string) => {
        const group = mockGroups.find(g => g.id === groupId);
        return group?.members || [];
    },
    createGroup: async (data: any) => ({
        id: `group-${Date.now()}`,
        ...data,
        members: [],
        memberCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }),
    updateGroup: async (id: string, data: any) => {
        const group = mockGroups.find(g => g.id === id);
        if (!group) throw new Error('Group not found');
        return {
            ...group,
            ...data,
            updatedAt: new Date().toISOString(),
        };
    },

    // Notes
    getNotes: async () => mockNotes,
    getNoteById: async (id: string) => mockNotes.find(n => n.id === id),
    createNote: async (data: any) => ({
        id: `note-${Date.now()}`,
        ...data,
        tags: data.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }),
    updateNote: async (id: string, data: any) => {
        const note = mockNotes.find(n => n.id === id);
        if (!note) throw new Error('Note not found');
        return {
            ...note,
            ...data,
            updatedAt: new Date().toISOString(),
        };
    },

    // Action Items
    getActionItems: async () => mockActionItems,
    getActionItemById: async (id: string) => mockActionItems.find(a => a.id === id),
    createActionItem: async (data: any) => ({
        id: `action-${Date.now()}`,
        ...data,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }),
    updateActionItem: async (id: string, data: any) => {
        const item = mockActionItems.find(a => a.id === id);
        if (!item) throw new Error('Action item not found');
        return {
            ...item,
            ...data,
            updatedAt: new Date().toISOString(),
        };
    },

    // Devices
    getDevices: async () => mockDevices,
    registerDevice: async (data: any) => ({
        id: `device-${Date.now()}`,
        ...data,
        isActive: true,
        lastSeen: new Date().toISOString(),
        registeredAt: new Date().toISOString(),
    }),

    // Profile
    getUserProfile: async () => mockUserProfile,
    updateUserProfile: async (data: any) => ({
        ...mockUserProfile,
        ...data,
        updatedAt: new Date().toISOString(),
    }),
};
