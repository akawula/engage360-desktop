import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, X, Search, Users, Tag, Sparkles, Plus } from 'lucide-react';
import { notesService } from '../services/notesService';
import { peopleService } from '../services/peopleService';
import { groupsService } from '../services/groupsService';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { formatAvatarSrc } from '../lib/utils';
import RichTextEditor, { type RichTextEditorRef } from '../components/RichTextEditor';
import AddActionItemModal from '../components/AddActionItemModal';
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
        tags: string[];
        personId: string | null;
        groupId: string | null;
        noteAssociation: 'person' | 'group' | 'standalone';
    }>({
        title: '',
        content: '',
        type: 'personal',
        tags: [],
        personId: personId || null,
        groupId: groupId || null,
        noteAssociation: personId ? 'person' : groupId ? 'group' : 'standalone',
    });

    // Track if there are unsaved changes
    const [hasChanges, setHasChanges] = useState(false);

    // Search states for people and groups
    const [personSearch, setPersonSearch] = useState('');
    const [groupSearch, setGroupSearch] = useState('');

    // Tag input state
    const [tagInput, setTagInput] = useState('');

    // Action item modal state
    const [showActionItemModal, setShowActionItemModal] = useState(false);
    const [actionItemTitle, setActionItemTitle] = useState('');

    // Ref to get content directly from the rich text editor
    const editorRef = useRef<RichTextEditorRef>(null);

    // Don't render until we have user data (if no personId is provided in URL)
    if (!personId && !user) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-dark-600 dark:text-dark-500">Loading user information...</div>
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
                tags: data.tags || []
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
                tags: data.tags && data.tags.length > 0 ? data.tags : undefined,
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

    // Tag handling functions
    const addTag = (tag: string) => {
        const trimmedTag = tag.trim();
        if (trimmedTag && !formData.tags.includes(trimmedTag)) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, trimmedTag]
            }));
            setHasChanges(true);
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
        setHasChanges(true);
    };

    const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTagInput(e.target.value);
    };

    const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag(tagInput);
            setTagInput('');
        } else if (e.key === ',') {
            e.preventDefault();
            addTag(tagInput);
            setTagInput('');
        }
    };

    const handleTagBlur = () => {
        if (tagInput.trim()) {
            addTag(tagInput);
            setTagInput('');
        }
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

    const handleCreateActionItem = (selectedText: string) => {
        // Open the modal with the selected text
        setActionItemTitle(selectedText);
        setShowActionItemModal(true);
    };

    const handleCancel = useCallback(() => {
        const confirmLeave = () => {
            navigate('/notes');
        };

        if (hasChanges) {
            const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
            if (confirmed) {
                confirmLeave();
            }
        } else {
            confirmLeave();
        }
    }, [hasChanges, navigate]);

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
                e.preventDefault();
                handleCancel();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleSave, handleCancel]);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'meeting': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border border-blue-200 dark:border-blue-700';
            case 'call': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border border-green-200 dark:border-green-700';
            case 'email': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 border border-purple-200 dark:border-purple-700';
            case 'personal': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200 border border-orange-200 dark:border-orange-700';
            case 'follow_up': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border border-red-200 dark:border-red-700';
            default: return 'bg-dark-200 text-dark-900 dark:bg-dark-950/30 dark:text-dark-300 border border-dark-300 dark:border-dark-800';
        }
    };

    return (
        <div className="h-full flex flex-col bg-dark-100 dark:bg-dark-950">
            {/* Enhanced Header */}
            <div className="bg-white dark:bg-dark-900 border-b border-dark-300 dark:border-dark-800 shadow-sm">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleCancel();
                                }}
                                className="group flex items-center gap-2 text-dark-700 dark:text-dark-400 hover:text-dark-950 dark:hover:text-white transition-all duration-200 px-3 py-2 rounded-lg hover:bg-dark-200 dark:hover:bg-dark-800"
                            >
                                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                                <span className="font-medium">Notes</span>
                            </button>

                            <div className="h-6 w-px bg-dark-400 dark:bg-dark-700"></div>

                            <div className="flex items-center gap-2">
                                <Plus className="h-5 w-5 text-primary-500" />
                                <h1 className="text-lg font-semibold text-dark-950 dark:text-white">
                                    Create New Note
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {hasChanges && (
                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium">Unsaved changes</span>
                                </div>
                            )}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleCancel();
                                }}
                                className="px-4 py-2 text-dark-800 dark:text-dark-400 border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-all duration-200 hover:shadow-md flex items-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                <span>Cancel</span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleSave();
                                }}
                                disabled={!formData.title.trim() || createMutation.isPending}
                                className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg disabled:shadow-none"
                            >
                                <Save className="h-4 w-4" />
                                <span className="font-medium">
                                    {createMutation.isPending ? 'Creating...' : 'Create Note'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Title and Metadata Section */}
                <div className="bg-white dark:bg-dark-900 border-b border-dark-300 dark:border-dark-800">
                    <div className="px-6 py-6">
                        {/* Title Input */}
                        <div className="mb-6">
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                    }
                                }}
                                className="w-full px-0 py-2 border-0 bg-transparent text-dark-950 dark:text-white text-2xl font-semibold placeholder-dark-500 dark:placeholder-dark-600 focus:ring-0 focus:outline-none resize-none"
                                placeholder="Untitled note..."
                                style={{ lineHeight: '1.2' }}
                            />
                            <div className="h-0.5 bg-gradient-to-r from-primary-500 via-primary-400 to-transparent mt-2"></div>
                        </div>

                        {/* Note Type Selection */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="h-4 w-4 text-primary-500" />
                                <span className="text-sm font-medium text-dark-800 dark:text-dark-400">Note Type</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
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
                                        className={`group px-4 py-2 rounded-full border-2 transition-all duration-200 hover:shadow-md ${formData.type === type.value
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md ring-2 ring-primary-500/20'
                                            : 'border-dark-300 dark:border-dark-700 bg-white dark:bg-dark-800 hover:border-dark-400 dark:hover:border-dark-600'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg group-hover:scale-110 transition-transform">{type.emoji}</span>
                                            <span className="text-sm font-medium text-dark-800 dark:text-dark-400">
                                                {type.label}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tags Section */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Tag className="h-4 w-4 text-primary-500" />
                                <span className="text-sm font-medium text-dark-800 dark:text-dark-400">Tags</span>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                                {formData.tags && formData.tags.length > 0 && (
                                    formData.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="group inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200 border border-primary-200 dark:border-primary-700 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-all duration-200"
                                        >
                                            <span className="mr-1">#</span>
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Remove tag"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))
                                )}

                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={handleTagInputChange}
                                    onKeyPress={handleTagKeyPress}
                                    onBlur={handleTagBlur}
                                    placeholder="Add tags..."
                                    className="px-3 py-1 border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-950 dark:text-white rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm min-w-32"
                                />
                            </div>
                        </div>

                        {/* Association Section */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Users className="h-4 w-4 text-primary-500" />
                                <span className="text-sm font-medium text-dark-800 dark:text-dark-400">Association</span>
                            </div>

                            {/* Association Type Selector */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <button
                                    type="button"
                                    onClick={() => handleAssociationChange('standalone')}
                                    className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${formData.noteAssociation === 'standalone'
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-md'
                                        : 'border-dark-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-800 dark:text-dark-400 hover:border-dark-400 dark:hover:border-dark-600'
                                        }`}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="text-2xl">📝</div>
                                        <div className="text-sm font-medium">Standalone</div>
                                        <div className="text-xs text-dark-600 dark:text-dark-500 text-center">
                                            Independent note
                                        </div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleAssociationChange('person')}
                                    className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${formData.noteAssociation === 'person'
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-md'
                                        : 'border-dark-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-800 dark:text-dark-400 hover:border-dark-400 dark:hover:border-dark-600'
                                        }`}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="text-2xl">👤</div>
                                        <div className="text-sm font-medium">Person</div>
                                        <div className="text-xs text-dark-600 dark:text-dark-500 text-center">
                                            Linked to a person
                                        </div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleAssociationChange('group')}
                                    className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${formData.noteAssociation === 'group'
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-md'
                                        : 'border-dark-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-800 dark:text-dark-400 hover:border-dark-400 dark:hover:border-dark-600'
                                        }`}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="text-2xl">👥</div>
                                        <div className="text-sm font-medium">Group</div>
                                        <div className="text-xs text-dark-600 dark:text-dark-500 text-center">
                                            Linked to a group
                                        </div>
                                    </div>
                                </button>
                            </div>

                            {/* Person Selector */}
                            {formData.noteAssociation === 'person' && (
                                <div className="bg-white dark:bg-dark-900 border border-dark-300 dark:border-dark-700 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="block text-sm font-medium text-dark-800 dark:text-dark-400">
                                            Select Person *
                                        </label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-500" />
                                            <input
                                                type="text"
                                                placeholder="Search people..."
                                                value={personSearch}
                                                onChange={(e) => setPersonSearch(e.target.value)}
                                                className="pl-10 pr-4 py-2 w-64 border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
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
                                                    className={`group p-3 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${formData.personId === person.id
                                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                                                        : 'border-dark-300 dark:border-dark-700 bg-white dark:bg-dark-800 hover:border-dark-400 dark:hover:border-dark-600'
                                                        }`}
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        {formatAvatarSrc(person.avatarUrl || person.avatar) ? (
                                                            <img
                                                                src={formatAvatarSrc(person.avatarUrl || person.avatar)!}
                                                                alt={`${person.firstName} ${person.lastName}`}
                                                                className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-100 dark:ring-primary-900"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center">
                                                                <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                                                                    {person.firstName[0]}{person.lastName[0]}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="text-center">
                                                            <div className="text-sm font-medium text-dark-950 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                                {person.firstName} {person.lastName}
                                                            </div>
                                                            {person.position && (
                                                                <div className="text-xs text-dark-600 dark:text-dark-500 truncate">
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
                                            <div className="text-center py-8 text-dark-600 dark:text-dark-500">
                                                {personSearch ? 'No people found matching your search' : 'No people available'}
                                            </div>
                                        )}
                                </div>
                            )}

                            {/* Group Selector */}
                            {formData.noteAssociation === 'group' && (
                                <div className="bg-white dark:bg-dark-900 border border-dark-300 dark:border-dark-700 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="block text-sm font-medium text-dark-800 dark:text-dark-400">
                                            Select Group *
                                        </label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-500" />
                                            <input
                                                type="text"
                                                placeholder="Search groups..."
                                                value={groupSearch}
                                                onChange={(e) => setGroupSearch(e.target.value)}
                                                className="pl-10 pr-4 py-2 w-64 border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
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
                                                    className={`group p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md text-left ${formData.groupId === group.id
                                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                                                        : 'border-dark-300 dark:border-dark-700 bg-white dark:bg-dark-800 hover:border-dark-400 dark:hover:border-dark-600'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center flex-shrink-0">
                                                            <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-dark-950 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                                {group.name}
                                                            </div>
                                                            {group.description && (
                                                                <div className="text-sm text-dark-600 dark:text-dark-500 mt-1 line-clamp-2">
                                                                    {group.description}
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <div className="text-xs text-dark-600 dark:text-dark-500">
                                                                    {group.memberCount || 0} members
                                                                </div>
                                                                {group.type && (
                                                                    <span className="text-xs px-2 py-1 rounded-full bg-dark-200 dark:bg-dark-900 text-dark-700 dark:text-dark-400">
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
                                            <div className="text-center py-8 text-dark-600 dark:text-dark-500">
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
                                <div className="bg-white dark:bg-dark-900 border border-dark-300 dark:border-dark-700 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-sm text-dark-700 dark:text-dark-500">
                                        <div className="text-lg">📝</div>
                                        <div>This note will be standalone and not associated with any person or group</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Editor */}
                <div className="flex-1 bg-white dark:bg-dark-900 p-6">
                    <div className="h-full">
                        <RichTextEditor
                            ref={editorRef}
                            content={formData.content}
                            onChange={handleContentChange}
                            placeholder="Start writing your note here..."
                            className="h-full min-h-[400px] prose prose-lg max-w-none dark:prose-invert prose-primary"
                            onCreateActionItem={handleCreateActionItem}
                        />
                    </div>
                </div>

                {/* Enhanced Footer */}
                <div className="bg-white dark:bg-dark-900 border-t border-dark-300 dark:border-dark-800 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 text-xs text-dark-600 dark:text-dark-500">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-dark-200 dark:bg-dark-800 rounded text-xs font-mono">⌘S</kbd>
                                    Save
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-dark-200 dark:bg-dark-800 rounded text-xs font-mono">Esc</kbd>
                                    Cancel
                                </span>
                            </div>
                            <div className="h-4 w-px bg-dark-400 dark:bg-dark-700"></div>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-dark-200 dark:bg-dark-800 rounded text-xs font-mono">⌘B</kbd>
                                    Bold
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-dark-200 dark:bg-dark-800 rounded text-xs font-mono">⌘I</kbd>
                                    Italic
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-dark-200 dark:bg-dark-800 rounded text-xs font-mono">⌘⇧A</kbd>
                                    Action Item
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(formData.type)}`}>
                                {formData.type.replace('_', ' ')}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                                {formData.noteAssociation === 'person' ? '👤 Person' :
                                    formData.noteAssociation === 'group' ? '👥 Group' : '📝 Standalone'}
                            </span>
                            {formData.tags && formData.tags.length > 0 && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200 border border-primary-200 dark:border-primary-700">
                                    {formData.tags.length} tag{formData.tags.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Item Modal */}
            <AddActionItemModal
                isOpen={showActionItemModal}
                onClose={() => setShowActionItemModal(false)}
                prefilledTitle={actionItemTitle}
                preselectedPersonId={formData.personId || undefined}
                preselectedGroupId={formData.groupId || undefined}
            />
        </div>
    );
}
