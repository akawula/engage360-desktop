import { create } from 'zustand';
import type { Person, Group, Note, ActionItem, Device, UserProfile, CreatePersonRequest } from '../types';
import { peopleService } from '../services/peopleService';
import { groupsService } from '../services/groupsService';
import { notesService } from '../services/notesService';
import { actionItemsService } from '../services/actionItemsService';
import { devicesService } from '../services/devicesService';
import { userProfileService } from '../services/userProfileService';

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
    getPersonById: (id: string) => Promise<Person | null>;
    fetchGroups: () => Promise<void>;
    fetchNotes: () => Promise<void>;
    fetchActionItems: () => Promise<void>;
    fetchDevices: () => Promise<void>;
    fetchUserProfile: () => Promise<void>;

    // CRUD operations
    addPerson: (personData: CreatePersonRequest) => Promise<Person | null>;
    updatePerson: (id: string, updates: Partial<CreatePersonRequest>) => Promise<Person | null>;
    deletePerson: (id: string) => Promise<boolean>;

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
            const response = await peopleService.getPeople();
            if (response.success && response.data) {
                set({ people: response.data.people });
            } else {
                get().showError?.('Failed to load people', response.error?.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Failed to fetch people:', error);
            get().showError?.('Failed to load people', 'Please try again later.');
        } finally {
            set(state => ({ loading: { ...state.loading, people: false } }));
        }
    },

    getPersonById: async (id: string) => {
        try {
            const response = await peopleService.getPersonById(id);
            if (response.success && response.data) {
                return response.data;
            } else {
                get().showError?.('Failed to load person', response.error?.message || 'Unknown error');
                return null;
            }
        } catch (error) {
            console.error('Failed to fetch person:', error);
            get().showError?.('Failed to load person', 'Please try again later.');
            return null;
        }
    },

    fetchGroups: async () => {
        set(state => ({ loading: { ...state.loading, groups: true } }));
        try {
            const response = await groupsService.getGroups();
            if (response.success && response.data) {
                set({ groups: response.data });
            } else {
                get().showError?.('Failed to load groups', response.error?.message || 'Please try again later.');
            }
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
            const response = await notesService.getNotes();
            if (response.success && response.data) {
                set({ notes: response.data });
            } else {
                get().showError?.('Failed to load notes', response.error?.message || 'Please try again later.');
            }
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
            const response = await actionItemsService.getActionItems();
            if (response.success && response.data) {
                set({ actionItems: response.data });
            } else {
                get().showError?.('Failed to load action items', response.error?.message || 'Please try again later.');
            }
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
            const response = await devicesService.getDevices();
            if (response.success && response.data) {
                set({ devices: response.data });
            } else {
                get().showError?.('Failed to load devices', response.error?.message || 'Please try again later.');
            }
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
            const response = await userProfileService.getUserProfile();
            if (response.success && response.data) {
                set({ userProfile: response.data });
            } else {
                get().showError?.('Failed to load profile', response.error?.message || 'Please try again later.');
            }
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            get().showError?.('Failed to load profile', 'Please try again later.');
        } finally {
            set(state => ({ loading: { ...state.loading, profile: false } }));
        }
    },

    // CRUD operations
    addPerson: async (personData: CreatePersonRequest) => {
        try {
            const response = await peopleService.createPerson(personData);
            if (response.success && response.data) {
                set(state => ({ people: [...state.people, response.data!] }));
                return response.data;
            } else {
                get().showError?.('Failed to create person', response.error?.message || 'Unknown error');
                return null;
            }
        } catch (error) {
            console.error('Failed to create person:', error);
            get().showError?.('Failed to create person', 'Please try again later.');
            return null;
        }
    },

    updatePerson: async (id: string, updates: Partial<CreatePersonRequest>) => {
        try {
            const response = await peopleService.updatePerson(id, updates);
            if (response.success && response.data) {
                set(state => ({
                    people: state.people.map(person =>
                        person.id === id ? response.data! : person
                    )
                }));
                return response.data;
            } else {
                get().showError?.('Failed to update person', response.error?.message || 'Unknown error');
                return null;
            }
        } catch (error) {
            console.error('Failed to update person:', error);
            get().showError?.('Failed to update person', 'Please try again later.');
            return null;
        }
    },

    deletePerson: async (id: string) => {
        try {
            const response = await peopleService.deletePerson(id);
            if (response.success) {
                set(state => ({
                    people: state.people.filter(person => person.id !== id)
                }));
                return true;
            } else {
                get().showError?.('Failed to delete person', response.error?.message || 'Unknown error');
                return false;
            }
        } catch (error) {
            console.error('Failed to delete person:', error);
            get().showError?.('Failed to delete person', 'Please try again later.');
            return false;
        }
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
