import { create } from 'zustand';
import type { Person, Group, Note, ActionItem, Device, UserProfile } from '../types';
import { mockApi } from '../data/mockData';
// import { apiService } from '../services/apiService'; // Will be used when connecting to real API

interface AppState {
    // Data
    people: Person[];
    groups: Group[];
    notes: Note[];
    actionItems: ActionItem[];
    devices: Device[];
    userProfile: UserProfile | null;

    // Loading states
    loading: {
        people: boolean;
        groups: boolean;
        notes: boolean;
        actionItems: boolean;
        devices: boolean;
        profile: boolean;
    };

    // Error handling
    showError?: (title: string, message?: string) => void;
    setErrorHandler: (handler: (title: string, message?: string) => void) => void;

    // Actions
    fetchPeople: () => Promise<void>;
    fetchGroups: () => Promise<void>;
    fetchNotes: () => Promise<void>;
    fetchActionItems: () => Promise<void>;
    fetchDevices: () => Promise<void>;
    fetchUserProfile: () => Promise<void>;

    // CRUD operations
    addPerson: (person: Person) => void;
    updatePerson: (id: string, updates: Partial<Person>) => void;
    deletePerson: (id: string) => void;

    addGroup: (group: Group) => void;
    updateGroup: (id: string, updates: Partial<Group>) => void;
    deleteGroup: (id: string) => void;

    addNote: (note: Note) => void;
    updateNote: (id: string, updates: Partial<Note>) => void;
    deleteNote: (id: string) => void;

    addActionItem: (actionItem: ActionItem) => void;
    updateActionItem: (id: string, updates: Partial<ActionItem>) => void;
    deleteActionItem: (id: string) => void;

    updateUserProfile: (updates: Partial<UserProfile>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    // Initial state
    people: [],
    groups: [],
    notes: [],
    actionItems: [],
    devices: [],
    userProfile: null,

    loading: {
        people: false,
        groups: false,
        notes: false,
        actionItems: false,
        devices: false,
        profile: false,
    },

    // Error handling
    showError: undefined,
    setErrorHandler: (handler: (title: string, message?: string) => void) => {
        set({ showError: handler });
    },

    // Fetch actions
    fetchPeople: async () => {
        set(state => ({ loading: { ...state.loading, people: true } }));
        try {
            // For now, using mock API, but in production you'd use:
            // const response = await apiService.get<{ people: Person[], total: number }>('/people');
            // if (response.success) {
            //     set({ people: response.data.people });
            // } else {
            //     get().showError?.('Failed to load people', response.error?.message);
            // }
            const response = await mockApi.getPeople();
            set({ people: response.people });
        } catch (error) {
            console.error('Failed to fetch people:', error);
            get().showError?.('Failed to load people', 'Please try again later.');
        } finally {
            set(state => ({ loading: { ...state.loading, people: false } }));
        }
    },

    fetchGroups: async () => {
        set(state => ({ loading: { ...state.loading, groups: true } }));
        try {
            const groups = await mockApi.getGroups();
            set({ groups });
        } catch (error) {
            console.error('Failed to fetch groups:', error);
            get().showError?.('Failed to load groups', 'Please try again later.');
        } finally {
            set(state => ({ loading: { ...state.loading, groups: false } }));
        }
    },

    fetchNotes: async () => {
        set(state => ({ loading: { ...state.loading, notes: true } }));
        try {
            const notes = await mockApi.getNotes();
            set({ notes });
        } catch (error) {
            console.error('Failed to fetch notes:', error);
            get().showError?.('Failed to load notes', 'Please try again later.');
        } finally {
            set(state => ({ loading: { ...state.loading, notes: false } }));
        }
    },

    fetchActionItems: async () => {
        set(state => ({ loading: { ...state.loading, actionItems: true } }));
        try {
            const actionItems = await mockApi.getActionItems();
            set({ actionItems });
        } catch (error) {
            console.error('Failed to fetch action items:', error);
            get().showError?.('Failed to load action items', 'Please try again later.');
        } finally {
            set(state => ({ loading: { ...state.loading, actionItems: false } }));
        }
    },

    fetchDevices: async () => {
        set(state => ({ loading: { ...state.loading, devices: true } }));
        try {
            const devices = await mockApi.getDevices();
            set({ devices });
        } catch (error) {
            console.error('Failed to fetch devices:', error);
            get().showError?.('Failed to load devices', 'Please try again later.');
        } finally {
            set(state => ({ loading: { ...state.loading, devices: false } }));
        }
    },

    fetchUserProfile: async () => {
        set(state => ({ loading: { ...state.loading, profile: true } }));
        try {
            const userProfile = await mockApi.getUserProfile();
            set({ userProfile });
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            get().showError?.('Failed to load profile', 'Please try again later.');
        } finally {
            set(state => ({ loading: { ...state.loading, profile: false } }));
        }
    },

    // CRUD operations
    addPerson: (person) => {
        set(state => ({ people: [...state.people, person] }));
    },

    updatePerson: (id, updates) => {
        set(state => ({
            people: state.people.map(person =>
                person.id === id ? { ...person, ...updates } : person
            )
        }));
    },

    deletePerson: (id) => {
        set(state => ({
            people: state.people.filter(person => person.id !== id)
        }));
    },

    addGroup: (group) => {
        set(state => ({ groups: [...state.groups, group] }));
    },

    updateGroup: (id, updates) => {
        set(state => ({
            groups: state.groups.map(group =>
                group.id === id ? { ...group, ...updates } : group
            )
        }));
    },

    deleteGroup: (id) => {
        set(state => ({
            groups: state.groups.filter(group => group.id !== id)
        }));
    },

    addNote: (note) => {
        set(state => ({ notes: [...state.notes, note] }));
    },

    updateNote: (id, updates) => {
        set(state => ({
            notes: state.notes.map(note =>
                note.id === id ? { ...note, ...updates } : note
            )
        }));
    },

    deleteNote: (id) => {
        set(state => ({
            notes: state.notes.filter(note => note.id !== id)
        }));
    },

    addActionItem: (actionItem) => {
        set(state => ({ actionItems: [...state.actionItems, actionItem] }));
    },

    updateActionItem: (id, updates) => {
        set(state => ({
            actionItems: state.actionItems.map(item =>
                item.id === id ? { ...item, ...updates } : item
            )
        }));
    },

    deleteActionItem: (id) => {
        set(state => ({
            actionItems: state.actionItems.filter(item => item.id !== id)
        }));
    },

    updateUserProfile: (updates) => {
        set(state => ({
            userProfile: state.userProfile ? { ...state.userProfile, ...updates } : null
        }));
    },
}));
