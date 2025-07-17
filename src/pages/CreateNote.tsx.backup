import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { notesService } from '../services/notesService';
import { peopleService } from '../services/peopleService';
import { groupsService } from '../services/groupsService';
import { devicesService } from '../services/devicesService';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
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
                <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Title *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Enter note title..."
                                required
                            />
                        </div>

                        {/* Note Association */}
                        <div>
                            <label htmlFor="noteAssociation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Association
                            </label>
                            <select
                                id="noteAssociation"
                                name="noteAssociation"
                                value={formData.noteAssociation}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="standalone">📝 Standalone</option>
                                <option value="person">👤 Person</option>
                                <option value="group">👥 Group</option>
                            </select>
                        </div>

                        {/* Person Selector - only show when person association is selected */}
                        {formData.noteAssociation === 'person' && (
                            <div>
                                <label htmlFor="personId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Select Person *
                                </label>
                                <select
                                    id="personId"
                                    name="personId"
                                    value={formData.personId || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Choose a person...</option>
                                    {people.map((person) => (
                                        <option key={person.id} value={person.id}>
                                            {person.firstName} {person.lastName}
                                            {person.position ? ` - ${person.position}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Group Selector - only show when group association is selected */}
                        {formData.noteAssociation === 'group' && (
                            <div>
                                <label htmlFor="groupId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Select Group *
                                </label>
                                <select
                                    id="groupId"
                                    name="groupId"
                                    value={formData.groupId || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Choose a group...</option>
                                    {groups.map((group) => (
                                        <option key={group.id} value={group.id}>
                                            {group.name}
                                            {group.description ? ` - ${group.description}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Type */}
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Type
                            </label>
                            <select
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="personal">Personal</option>
                                <option value="meeting">Meeting</option>
                                <option value="call">Call</option>
                                <option value="email">Email</option>
                                <option value="follow_up">Follow Up</option>
                            </select>
                        </div>

                        {/* Tags */}
                        <div>
                            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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

                    {/* Context information */}
                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                        {formData.noteAssociation === 'person' && formData.personId && (
                            <div className="flex items-center gap-1">
                                <span>� Person-associated note (ID: {formData.personId})</span>
                            </div>
                        )}
                        {formData.noteAssociation === 'group' && formData.groupId && (
                            <div className="flex items-center gap-1">
                                {(() => {
                                    const selectedGroup = groups.find(g => g.id === formData.groupId);
                                    return selectedGroup ? (
                                        <span>👥 Group-associated note: {selectedGroup.name}</span>
                                    ) : (
                                        <span>👥 Group-associated note (ID: {formData.groupId})</span>
                                    );
                                })()}
                            </div>
                        )}
                        {formData.noteAssociation === 'standalone' && (
                            <div className="flex items-center gap-1">
                                <span>📝 Standalone note</span>
                            </div>
                        )}
                        {formData.noteAssociation === 'person' && personId && (
                            <div className="flex items-center gap-1">
                                <span>📝 Creating note for person ID: {personId}</span>
                            </div>
                        )}
                        {formData.noteAssociation === 'group' && groupId && (
                            <div className="flex items-center gap-1">
                                <span>� Creating note for group ID: {groupId}</span>
                            </div>
                        )}
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
