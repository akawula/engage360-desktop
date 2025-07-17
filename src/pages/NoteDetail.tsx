import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Calendar, User, Building, Tag, Clock, Sparkles, FileText, UserCheck, Check, Play, Timer, Zap, Flame } from 'lucide-react';
import { notesService } from '../services/notesService';
import { peopleService } from '../services/peopleService';
import { groupsService } from '../services/groupsService';
import { authService } from '../services/authService';
import { formatAvatarSrc } from '../lib/utils';
import RichTextEditor, { type RichTextEditorRef } from '../components/RichTextEditor';
import AddActionItemModal from '../components/AddActionItemModal';
import { useActionItems } from '../hooks/useActionItems';

// Helper functions for action item styling
const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
        case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
        case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
        case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
        case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
        case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
        case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
    }
};

const getPriorityIcon = (priority: string) => {
    switch (priority) {
        case 'urgent': return Flame;
        case 'high': return Zap;
        case 'medium': return Timer;
        case 'low': return Clock;
        default: return Clock;
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'completed': return Check;
        case 'in_progress': return Play;
        case 'pending': return Clock;
        case 'cancelled': return X;
        default: return Clock;
    }
};

const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInDays > 0) {
        return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
    } else if (diffInHours > 0) {
        return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    } else if (diffInMinutes > 0) {
        return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
    } else {
        return 'Just now';
    }
};

const isOverdue = (dueDate?: string) => {
    return dueDate && new Date(dueDate) < new Date();
};

const getDueDateText = (dueDate?: string) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    const diffInMs = date.getTime() - now.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMs < 0) {
        const overdueDays = Math.abs(diffInDays);
        if (overdueDays === 0) return 'Due today (overdue)';
        if (overdueDays === 1) return '1 day overdue';
        return `${overdueDays} days overdue`;
    }

    if (diffInDays === 0) return 'Due today';
    if (diffInDays === 1) return 'Due tomorrow';
    if (diffInDays < 7) return `Due in ${diffInDays} days`;

    return `Due ${date.toLocaleDateString()}`;
};

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

    // Action item modal state
    const [showActionItemModal, setShowActionItemModal] = useState(false);
    const [actionItemTitle, setActionItemTitle] = useState('');

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

    // Fetch action items associated with this note
    const { data: allActionItems } = useActionItems(
        note?.id ? { noteId: note.id } : undefined
    );

    // Client-side filter to ensure only action items for this note are shown
    const actionItems = allActionItems?.filter(item => item.noteId === note?.id) || [];

    // Debug logging
    useEffect(() => {
        console.log('NoteDetail - noteId:', note?.id);
        console.log('NoteDetail - allActionItems:', allActionItems);
        console.log('NoteDetail - filtered actionItems:', actionItems);
        console.log('NoteDetail - all actionItems count:', allActionItems?.length);
        console.log('NoteDetail - filtered count:', actionItems?.length);
    }, [note?.id, allActionItems, actionItems]);

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

    const handleCreateActionItem = (selectedText: string) => {
        // Open the modal with the selected text
        setActionItemTitle(selectedText);
        setShowActionItemModal(true);
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
            case 'meeting': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border border-blue-200 dark:border-blue-700';
            case 'call': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border border-green-200 dark:border-green-700';
            case 'email': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 border border-purple-200 dark:border-purple-700';
            case 'personal': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200 border border-orange-200 dark:border-orange-700';
            case 'follow_up': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border border-red-200 dark:border-red-700';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200 border border-gray-200 dark:border-gray-700';
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
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Enhanced Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleCancel}
                                disabled={updateMutation.isPending}
                                className="group flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                                <span className="font-medium">Notes</span>
                            </button>

                            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                    <Calendar className="h-4 w-4" />
                                    <span>Created {new Date(note.createdAt).toLocaleDateString()}</span>
                                </div>
                                {note.updatedAt !== note.createdAt && (
                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                        <Clock className="h-4 w-4" />
                                        <span>Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                )}
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
                                onClick={handleCancel}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md flex items-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                <span>Cancel</span>
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!hasChanges || updateMutation.isPending}
                                className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg disabled:shadow-none"
                            >
                                <Save className="h-4 w-4" />
                                <span className="font-medium">
                                    {updateMutation.isPending ? 'Saving...' : 'Save'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Title and Metadata Section */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-6">
                        {/* Title Input */}
                        <div className="mb-6">
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-0 py-2 border-0 bg-transparent text-gray-900 dark:text-white text-2xl font-semibold placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 focus:outline-none resize-none"
                                placeholder="Untitled note..."
                                style={{ lineHeight: '1.2' }}
                            />
                            <div className="h-0.5 bg-gradient-to-r from-primary-500 via-primary-400 to-transparent mt-2"></div>
                        </div>

                        {/* Note Type Selection */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="h-4 w-4 text-primary-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Note Type</span>
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
                                            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg group-hover:scale-110 transition-transform">{type.emoji}</span>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</span>
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
                                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm min-w-32"
                                />
                            </div>
                        </div>

                        {/* Related Items */}
                        {(note.personId || note.groupId) && (
                            <div className="pt-6 border-t border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-2 mb-4">
                                    <User className="h-4 w-4 text-primary-500" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Related To
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {note.personId && relatedPerson && (
                                        <Link
                                            to={`/people/${note.personId}`}
                                            className="group flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:shadow-lg transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-600 hover:-translate-y-0.5"
                                        >
                                            <div className="flex items-center gap-3">
                                                {formatAvatarSrc(relatedPerson.avatarUrl || relatedPerson.avatar) ? (
                                                    <img
                                                        src={formatAvatarSrc(relatedPerson.avatarUrl || relatedPerson.avatar)!}
                                                        alt={`${relatedPerson.firstName} ${relatedPerson.lastName}`}
                                                        className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-100 dark:ring-primary-900"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center ring-2 ring-primary-100 dark:ring-primary-900">
                                                        <span className="text-lg font-semibold text-primary-700 dark:text-primary-300">
                                                            {relatedPerson.firstName[0]}{relatedPerson.lastName[0]}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                        {relatedPerson.firstName} {relatedPerson.lastName}
                                                    </span>
                                                    {relatedPerson.position && (
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            {relatedPerson.position}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    )}
                                    {note.groupId && relatedGroup && (
                                        <Link
                                            to={`/groups/${note.groupId}`}
                                            className="group flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:shadow-lg transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-600 hover:-translate-y-0.5"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center ring-2 ring-primary-100 dark:ring-primary-900">
                                                    <Building className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                        {relatedGroup.name}
                                                    </span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {relatedGroup.memberCount || 0} members
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Editor */}
                <div className="flex-1 bg-white dark:bg-gray-800 p-6">
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

                {/* Action Items Section */}
                {actionItems && actionItems.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Related Action Items ({actionItems.length})
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {actionItems.map((item) => {
                                    const StatusIcon = getStatusIcon(item.status);
                                    const PriorityIcon = getPriorityIcon(item.priority);
                                    const dueDateText = getDueDateText(item.dueDate);
                                    const isItemOverdue = isOverdue(item.dueDate);

                                    return (
                                        <div
                                            key={item.id}
                                            className={`group bg-white dark:bg-gray-800 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${isItemOverdue
                                                ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20 shadow-red-200/50 dark:shadow-red-900/30 shadow-lg ring-2 ring-red-200 dark:ring-red-800 hover:shadow-red-300/60 dark:hover:shadow-red-900/40'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-primary-500/10'
                                                } p-4`}
                                        >
                                            <div className="h-full flex flex-col">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-lg flex items-center justify-center">
                                                            <StatusIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                                                {item.status.replace('_', ' ')}
                                                            </span>
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                                                                <PriorityIcon className="h-3 w-3 mr-1" />
                                                                {item.priority}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex-1 mb-3">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                                                        {item.title}
                                                    </h4>
                                                    {item.description && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="space-y-2 mt-auto">
                                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            <span>{getRelativeTime(item.updatedAt)}</span>
                                                        </div>
                                                        {dueDateText && (
                                                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full font-medium ${isItemOverdue
                                                                ? 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 animate-pulse'
                                                                : item.dueDate && new Date(item.dueDate).getTime() - Date.now() < 24 * 60 * 60 * 1000
                                                                    ? 'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/40 border border-orange-300 dark:border-orange-700'
                                                                    : 'text-gray-600 dark:text-gray-400'
                                                                }`}>
                                                                <Calendar className="h-3 w-3" />
                                                                <span className="text-xs font-semibold">{dueDateText}</span>
                                                                {isItemOverdue && <span className="text-xs">⚠️</span>}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                                        {item.assigneeName && (
                                                            <div className="flex items-center gap-1">
                                                                <UserCheck className="h-3 w-3" />
                                                                <span>{item.assigneeName}</span>
                                                            </div>
                                                        )}
                                                        {item.noteId && (
                                                            <Link
                                                                to={`/notes/${item.noteId}`}
                                                                className="flex items-center gap-1 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 transition-colors bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/40"
                                                                title="View related note"
                                                            >
                                                                <FileText className="h-3 w-3" />
                                                                <span>Note</span>
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Enhanced Footer */}
                <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">⌘S</kbd>
                                    Save
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Esc</kbd>
                                    Cancel
                                </span>
                            </div>
                            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">⌘B</kbd>
                                    Bold
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">⌘I</kbd>
                                    Italic
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">⌘⇧A</kbd>
                                    Action Item
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(formData.type)}`}>
                                {formData.type.replace('_', ' ')}
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
                preselectedNoteId={note?.id}
                preselectedPersonId={note?.personId}
                preselectedGroupId={note?.groupId}
            />
        </div>
    );
}
