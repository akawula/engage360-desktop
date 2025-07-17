import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, X, Search, Users } from 'lucide-react';
import { notesService } from '../services/notesService';
import { peopleService } from '../services/peopleService';
import { groupsService } from '../services/groupsService';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { formatAvatarSrc } from '../lib/utils';
import RichTextEditor, { type RichTextEditorRef } from '../components/RichTextEditor';
import type { CreateNoteRequest } from '../types';

export default function CreateNote() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    // Fetch people and groups for association dropdowns
    const { data: peopleResponse } = useQuery({
        queryKey: ['people'],
        queryFn: () => peopleService.getPeople(),
        staleTime: 10 * 60 * 1000, // 10 minutes
    });

    const { data: groupsResponse } = useQuery({
        queryKey: ['groups'],
        queryFn: () => groupsService.getGroups(),
        staleTime: 10 * 60 * 1000, // 10 minutes
    });

    const people = peopleResponse?.success ? peopleResponse.data?.people || [] : [];
    const groups = groupsResponse?.success ? groupsResponse.data || [] : [];

    // Get personId or groupId from URL params if provided
    const personId = searchParams.get('personId') || undefined;
    const groupId = searchParams.get('groupId') || undefined;

    // Form state
    const [formData, setFormData] = useState<{
        title: string;
        content: string;
        type: 'meeting' | 'call' | 'email' | 'personal' | 'follow_up';
        tags: string;
        personId: string | null;
        groupId: string | null;
        noteAssociation: 'person' | 'group' | 'standalone';
    }>({
        title: '',
        content: '',
        type: 'personal',
        tags: '',
        personId: personId || null,
        groupId: groupId || null,
        noteAssociation: personId ? 'person' : groupId ? 'group' : 'standalone',
    });

    // Track if there are unsaved changes
    const [hasChanges, setHasChanges] = useState(false);

    // Search states for people and groups
    const [personSearch, setPersonSearch] = useState('');
    const [groupSearch, setGroupSearch] = useState('');

    // Ref to get content directly from the rich text editor
    const editorRef = useRef<RichTextEditorRef>(null);

    // Don't render until we have user data (if no personId is provided in URL)
    if (!personId && !user) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading user information...</div>
            </div>
        );
    }

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            // Validate required fields
            if (!data.title.trim()) {
                throw new Error('Title is required');
            }

            // Validate association-specific requirements
            if (data.noteAssociation === 'person' && !data.personId) {
                throw new Error('Please select a person for this note');
            }

            if (data.noteAssociation === 'group' && !data.groupId) {
                throw new Error('Please select a group for this note');
            }

            // New flexible note association system:
            // - Person-Associated Notes: { personId: "uuid", groupId: null }
            // - Group-Associated Notes: { personId: null, groupId: "uuid" }
            // - Standalone Notes: { personId: null, groupId: null }

            // Validate UUIDs if provided
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

            if (data.personId && !uuidRegex.test(data.personId)) {
                throw new Error('PersonId must be a valid UUID format');
            }

            if (data.groupId && !uuidRegex.test(data.groupId)) {
                throw new Error('GroupId must be a valid UUID format');
            }

            // Prepare the content for encryption (only the content, not the title)
            const contentToEncrypt = JSON.stringify({
                content: data.content,
                type: data.type,
                tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
            });

            // Generate proper IV
            const ivArray = crypto.getRandomValues(new Uint8Array(12));
            const iv = btoa(Array.from(ivArray).map(b => String.fromCharCode(b)).join(''));

            // Get the current device ID from authentication service
            const currentDeviceId = authService.getDeviceId();
            if (!currentDeviceId) {
                throw new Error('No device ID found. Please log in again.');
            }

            // Create device key array with the actual current device ID
            // In a real implementation, this would encrypt the content key with each device's public key
            const deviceKeys = [
                {
                    deviceId: currentDeviceId, // Use actual current device ID
                    encryptedKey: btoa('mock-encrypted-key') // TODO: Implement proper key encryption
                }
            ];

            const noteData: CreateNoteRequest & {
                title: string;
                encryptedContent: string;
                deviceKeys: Array<{ deviceId: string; encryptedKey: string }>;
                contentIV: string;
                personId?: string | null;
                groupId?: string | null;
            } = {
                title: data.title, // Plain text title
                content: data.content,
                type: data.type,
                personId: data.personId || null, // Send null instead of empty string
                groupId: data.groupId || null, // Send null instead of empty string
                tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
                // Encrypted fields
                encryptedContent: btoa(unescape(encodeURIComponent(contentToEncrypt))), // Use UTF-8 safe base64 encoding
                deviceKeys: deviceKeys, // Array format as expected by API
                contentIV: iv, // Use contentIV as expected by API
            };

            const response = await notesService.createNote(noteData);

            if (!response.success) {
                // Check for 400 validation errors
                if (response.error?.code === 400) {
                    throw new Error(`Validation error: ${response.error.details || response.error.message}`);
                }

                const errorMessage = response.error?.message || 'Failed to create note';
                const errorDetails = response.error?.details || '';
                throw new Error(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
            }

            return response.data;
        },
        onSuccess: (note) => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            // Navigate to the created note
            if (note) {
                navigate(`/notes/${note.id}`);
            }
        },
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'noteAssociation') {
            // Update association and clear existing associations
            const association = value as 'person' | 'group' | 'standalone';
            setFormData(prev => ({
                ...prev,
                noteAssociation: association,
                personId: association === 'person' ? prev.personId : null,
                groupId: association === 'group' ? prev.groupId : null,
            }));
        } else if (name === 'personId') {
            // When selecting a person, clear group and ensure association is set to person
            setFormData(prev => ({
                ...prev,
                personId: value || null,
                groupId: null,
                noteAssociation: 'person',
            }));
        } else if (name === 'groupId') {
            // When selecting a group, clear person and ensure association is set to group
            setFormData(prev => ({
                ...prev,
                groupId: value || null,
                personId: null,
                noteAssociation: 'group',
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
        }
        setHasChanges(true);
    };

    const handleAssociationChange = (association: 'person' | 'group' | 'standalone') => {
        setFormData(prev => ({
            ...prev,
            noteAssociation: association,
            personId: association === 'person' ? prev.personId : null,
            groupId: association === 'group' ? prev.groupId : null,
        }));
        setHasChanges(true);
    };

    const handleContentChange = (content: string) => {
        setFormData(prev => ({
            ...prev,
            content,
        }));
        setHasChanges(true);
    };

    const handleSave = useCallback(async () => {
        if (!formData.title.trim()) {
            alert('Please enter a title for the note');
            return;
        }

        // Get the current content directly from the editor
        const currentContent = editorRef.current?.getContent() || '';

        // Validate association-specific requirements
        if (formData.noteAssociation === 'person' && !formData.personId) {
            alert('Please select a person for this note');
            return;
        }

        if (formData.noteAssociation === 'group' && !formData.groupId) {
            alert('Please select a group for this note');
            return;
        }

        // Create the form data with content from editor
        const noteDataWithEditorContent = {
            ...formData,
            content: currentContent // Use content directly from editor
        };

        createMutation.mutate(noteDataWithEditorContent);
    }, [formData, editorRef, createMutation]);

    const handleCancel = () => {
        if (hasChanges) {
            if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
                navigate('/notes');
            }
        } else {
            navigate('/notes');
        }
    };

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                if (formData.title.trim()) {
                    handleSave();
                }
            }
            if (e.key === 'Escape') {
                handleCancel();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [hasChanges, formData.title, handleSave]);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'meeting': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'call': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'email': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            case 'personal': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            case 'follow_up': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Notes
                    </button>

                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Create New Note
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    {hasChanges && (
                        <span className="text-sm text-amber-600 mr-2">Unsaved changes</span>
                    )}
                    <button
                        onClick={handleCancel}
                        className="px-3 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                    >
                        <X className="h-4 w-4" />
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!formData.title.trim() || createMutation.isPending}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Save className="h-4 w-4" />
                        {createMutation.isPending ? 'Creating...' : 'Create Note'}
                    </button>
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Note metadata */}
                <div className="p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-colors">
                    {/* Title Section */}
                    <div className="mb-6">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                            placeholder="Enter note title..."
                            required
                        />
                    </div>

                    {/* Association Section */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Association
                        </label>

                        {/* Association Type Selector */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <button
                                type="button"
                                onClick={() => handleAssociationChange('standalone')}
                                className={`p-4 rounded-lg border-2 transition-all ${formData.noteAssociation === 'standalone'
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div className="text-2xl">📝</div>
                                    <div className="text-sm font-medium">Standalone</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                        Independent note
                                    </div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleAssociationChange('person')}
                                className={`p-4 rounded-lg border-2 transition-all ${formData.noteAssociation === 'person'
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div className="text-2xl">👤</div>
                                    <div className="text-sm font-medium">Person</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                        Linked to a person
                                    </div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleAssociationChange('group')}
                                className={`p-4 rounded-lg border-2 transition-all ${formData.noteAssociation === 'group'
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div className="text-2xl">👥</div>
                                    <div className="text-sm font-medium">Group</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                        Linked to a group
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* Person Selector */}
                        {formData.noteAssociation === 'person' && (
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Select Person *
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search people..."
                                            value={personSearch}
                                            onChange={(e) => setPersonSearch(e.target.value)}
                                            className="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-60 overflow-y-auto">
                                    {people
                                        .filter(person =>
                                            personSearch === '' ||
                                            `${person.firstName} ${person.lastName}`.toLowerCase().includes(personSearch.toLowerCase()) ||
                                            person.email?.toLowerCase().includes(personSearch.toLowerCase()) ||
                                            person.position?.toLowerCase().includes(personSearch.toLowerCase())
                                        )
                                        .map((person) => (
                                            <button
                                                key={person.id}
                                                type="button"
                                                onClick={() => handleChange({ target: { name: 'personId', value: person.id } } as any)}
                                                className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${formData.personId === person.id
                                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                                                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                                                    }`}
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    {formatAvatarSrc(person.avatarUrl || person.avatar) ? (
                                                        <img
                                                            src={formatAvatarSrc(person.avatarUrl || person.avatar)!}
                                                            alt={`${person.firstName} ${person.lastName}`}
                                                            className="w-12 h-12 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                                            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                                                                {person.firstName[0]}{person.lastName[0]}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="text-center">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {person.firstName} {person.lastName}
                                                        </div>
                                                        {person.position && (
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                {person.position}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                </div>

                                {people.filter(person =>
                                    personSearch === '' ||
                                    `${person.firstName} ${person.lastName}`.toLowerCase().includes(personSearch.toLowerCase()) ||
                                    person.email?.toLowerCase().includes(personSearch.toLowerCase()) ||
                                    person.position?.toLowerCase().includes(personSearch.toLowerCase())
                                ).length === 0 && (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            {personSearch ? 'No people found matching your search' : 'No people available'}
                                        </div>
                                    )}
                            </div>
                        )}

                        {/* Group Selector */}
                        {formData.noteAssociation === 'group' && (
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Select Group *
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search groups..."
                                            value={groupSearch}
                                            onChange={(e) => setGroupSearch(e.target.value)}
                                            className="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                                    {groups
                                        .filter(group =>
                                            groupSearch === '' ||
                                            group.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
                                            group.description?.toLowerCase().includes(groupSearch.toLowerCase()) ||
                                            group.tags?.some(tag => tag.toLowerCase().includes(groupSearch.toLowerCase()))
                                        )
                                        .map((group) => (
                                            <button
                                                key={group.id}
                                                type="button"
                                                onClick={() => handleChange({ target: { name: 'groupId', value: group.id } } as any)}
                                                className={`p-4 rounded-lg border-2 transition-all hover:shadow-md text-left ${formData.groupId === group.id
                                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                                                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                                                        <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-gray-900 dark:text-white">
                                                            {group.name}
                                                        </div>
                                                        {group.description && (
                                                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                                                {group.description}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {group.memberCount || 0} members
                                                            </div>
                                                            {group.type && (
                                                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                                                    {group.type}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                </div>

                                {groups.filter(group =>
                                    groupSearch === '' ||
                                    group.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
                                    group.description?.toLowerCase().includes(groupSearch.toLowerCase()) ||
                                    group.tags?.some(tag => tag.toLowerCase().includes(groupSearch.toLowerCase()))
                                ).length === 0 && (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            {groupSearch ? 'No groups found matching your search' : 'No groups available'}
                                        </div>
                                    )}

                                {formData.groupId && (
                                    <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                                        <div className="flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300">
                                            <span>✓</span>
                                            <span>Selected: {groups.find(g => g.id === formData.groupId)?.name}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Standalone Note Info */}
                        {formData.noteAssociation === 'standalone' && (
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="text-lg">📝</div>
                                    <div>This note will be standalone and not associated with any person or group</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Additional Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Type
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {[
                                    { value: 'personal', emoji: '📝', label: 'Personal' },
                                    { value: 'meeting', emoji: '🤝', label: 'Meeting' },
                                    { value: 'call', emoji: '📞', label: 'Call' },
                                    { value: 'email', emoji: '✉️', label: 'Email' },
                                    { value: 'follow_up', emoji: '🔄', label: 'Follow Up' }
                                ].map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => handleChange({ target: { name: 'type', value: type.value } } as any)}
                                        className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${formData.type === type.value
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                                                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                                            }`}
                                        title={type.label}
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-xl">{type.emoji}</span>
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                {type.label}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tags
                            </label>
                            <input
                                type="text"
                                id="tags"
                                name="tags"
                                value={formData.tags}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="tag1, tag2, tag3..."
                            />
                        </div>
                    </div>
                </div>

                {/* Content Editor */}
                <div className="flex-1 p-4">
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Content
                    </label>
                    <RichTextEditor
                        ref={editorRef}
                        content={formData.content}
                        onChange={handleContentChange}
                        placeholder="Start writing your note here..."
                        className="h-full min-h-[400px]"
                    />
                </div>
            </div>

            {/* Keyboard shortcuts info */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 transition-colors">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-6">
                        <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Cmd/Ctrl + S</kbd> to save</span>
                        <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> to cancel</span>
                        <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Cmd/Ctrl + B</kbd> bold</span>
                        <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Cmd/Ctrl + I</kbd> italic</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(formData.type)}`}>
                            {formData.type.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {formData.noteAssociation === 'person' ? '👤 Person' :
                                formData.noteAssociation === 'group' ? '👥 Group' : '📝 Standalone'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
