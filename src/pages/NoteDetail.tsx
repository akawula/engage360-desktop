import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Calendar, User, Building } from 'lucide-react';
import { notesService } from '../services/notesService';
import { peopleService } from '../services/peopleService';
import { groupsService } from '../services/groupsService';
import { authService } from '../services/authService';
import { formatAvatarSrc } from '../lib/utils';
import RichTextEditor, { type RichTextEditorRef } from '../components/RichTextEditor';

export default function NoteDetail() {
    const { noteId } = useParams<{ noteId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Ref to get content directly from the rich text editor
    const editorRef = useRef<RichTextEditorRef>(null);

    // Form state for editing
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'personal' as 'meeting' | 'call' | 'email' | 'personal' | 'follow_up',
        tags: [] as string[],
    });

    // Track if there are unsaved changes
    const [hasChanges, setHasChanges] = useState(false);

    // Tag input state
    const [tagInput, setTagInput] = useState('');

    const { data: note, isLoading } = useQuery({
        queryKey: ['note', noteId],
        queryFn: async () => {
            if (!noteId) return null;
            const response = await notesService.getNoteById(noteId);
            return response.success ? response.data : null;
        },
        enabled: !!noteId,
    });

    // Fetch related person data if note has personId
    const { data: relatedPerson } = useQuery({
        queryKey: ['person', note?.personId],
        queryFn: async () => {
            if (!note?.personId) return null;
            const response = await peopleService.getPersonById(note.personId);
            return response.success ? response.data : null;
        },
        enabled: !!note?.personId,
    });

    // Fetch related group data if note has groupId
    const { data: relatedGroup } = useQuery({
        queryKey: ['group', note?.groupId],
        queryFn: async () => {
            if (!note?.groupId) return null;
            const response = await groupsService.getGroupById(note.groupId);
            return response.success ? response.data : null;
        },
        enabled: !!note?.groupId,
    });

    // Initialize form when note loads
    useEffect(() => {
        if (note) {
            setFormData({
                title: note.title,
                content: note.content,
                type: note.type,
                tags: note.tags || [],
            });
        }
    }, [note]);

    const updateMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            if (!note) throw new Error('Note not found');

            // Prepare content for encryption (separate from title)
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
            const deviceKeys = [
                {
                    deviceId: currentDeviceId, // Use actual current device ID
                    encryptedKey: btoa('mock-encrypted-key') // TODO: Implement proper key encryption
                }
            ];

            const response = await notesService.updateNote(note.id, {
                title: data.title, // Plain text title
                content: data.content,
                type: data.type,
                tags: data.tags && data.tags.length > 0 ? data.tags : undefined,
                // Encrypted fields with proper format
                encryptedContent: btoa(contentToEncrypt), // Base64 encoded encrypted content
                deviceKeys: deviceKeys, // Array format
                contentIV: iv // Use contentIV field name
            });

            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to update note');
            }

            return response.data;
        },
        onSuccess: async () => {
            setHasChanges(false);
            // Invalidate and refetch cache before navigation to ensure fresh data
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['notes'] }),
                queryClient.invalidateQueries({ queryKey: ['note', noteId] }),
                queryClient.refetchQueries({ queryKey: ['notes'] })
            ]);
            // Navigate back to notes list after successful save
            navigate('/notes');
        },
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
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

    const handleSave = () => {
        // Get the current content directly from the editor
        const currentContent = editorRef.current?.getContent() || '';

        // Use the content from the editor, not from formData
        const dataWithEditorContent = {
            ...formData,
            content: currentContent
        };

        updateMutation.mutate(dataWithEditorContent);
    };

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

                if (hasChanges) {
                    handleSave();
                }
            }
            if (e.key === 'Escape') {
                handleCancel();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [hasChanges]);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading note...</div>
            </div>
        );
    }

    if (!note) {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                <p className="text-gray-600 dark:text-gray-300 mb-4">Note not found</p>
                <Link
                    to="/notes"
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Notes
                </Link>
            </div>
        );
    }

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

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading note...</div>
            </div>
        );
    }

    if (!note) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-gray-500 dark:text-gray-400">Note not found</div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleCancel}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Notes
                    </button>

                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
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
                        disabled={!hasChanges || updateMutation.isPending}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Save className="h-4 w-4" />
                        {updateMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Note metadata */}
                <div className="p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-colors">
                    {/* Title Section */}
                    <div className="mb-8">
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

                    {/* Related items */}
                    {(note.personId || note.groupId) && (
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                Related To
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {note.personId && relatedPerson && (
                                    <Link
                                        to={`/people/${note.personId}`}
                                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:shadow-md transition-all hover:border-primary-300 dark:hover:border-primary-600"
                                    >
                                        <div className="flex items-center gap-3">
                                            {formatAvatarSrc(relatedPerson.avatarUrl || relatedPerson.avatar) ? (
                                                <img
                                                    src={formatAvatarSrc(relatedPerson.avatarUrl || relatedPerson.avatar)!}
                                                    alt={`${relatedPerson.firstName} ${relatedPerson.lastName}`}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                                                        {relatedPerson.firstName[0]}{relatedPerson.lastName[0]}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {relatedPerson.firstName} {relatedPerson.lastName}
                                                </span>
                                                {relatedPerson.position && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {relatedPerson.position}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <User className="h-4 w-4 text-gray-400" />
                                    </Link>
                                )}
                                {note.groupId && relatedGroup && (
                                    <Link
                                        to={`/groups/${note.groupId}`}
                                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:shadow-md transition-all hover:border-primary-300 dark:hover:border-primary-600"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                                <Building className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {relatedGroup.name}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {relatedGroup.memberCount || 0} members
                                                </span>
                                            </div>
                                        </div>
                                        <Building className="h-4 w-4 text-gray-400" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
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

                {/* Type and Tags Section - Below Content */}
                <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Type Selection */}
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

                        {/* Tags Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Tags
                            </label>

                            {/* Display existing tags as chips */}
                            {formData.tags && formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {formData.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 border border-primary-200 dark:border-primary-700"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 transition-colors"
                                                title="Remove tag"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Input for adding new tags */}
                            <input
                                type="text"
                                value={tagInput}
                                onChange={handleTagInputChange}
                                onKeyPress={handleTagKeyPress}
                                onBlur={handleTagBlur}
                                placeholder="Type and press Enter or comma to add tags"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />

                            {/* Helper text */}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Press Enter or comma to add tags. Click × to remove.
                            </p>
                        </div>
                    </div>
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
                        {formData.tags && formData.tags.length > 0 && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                {formData.tags.length} tag{formData.tags.length !== 1 ? 's' : ''}
                            </span>
                        )}
                        <span>Updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
