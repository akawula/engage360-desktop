import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Calendar, User, Building } from 'lucide-react';
import { notesService } from '../services/notesService';
import { authService } from '../services/authService';
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
        tags: '',
    });

    // Track if there are unsaved changes
    const [hasChanges, setHasChanges] = useState(false);

    const { data: note, isLoading } = useQuery({
        queryKey: ['note', noteId],
        queryFn: async () => {
            if (!noteId) return null;
            const response = await notesService.getNoteById(noteId);
            return response.success ? response.data : null;
        },
        enabled: !!noteId,
    });

    // Initialize form when note loads
    useEffect(() => {
        if (note) {
            setFormData({
                title: note.title,
                content: note.content,
                type: note.type,
                tags: note.tags?.join(', ') || '',
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
                tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
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
            case 'meeting': return 'bg-blue-100 text-blue-800';
            case 'call': return 'bg-green-100 text-green-800';
            case 'email': return 'bg-purple-100 text-purple-800';
            case 'personal': return 'bg-orange-100 text-orange-800';
            case 'follow_up': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

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
                <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Note title..."
                            />
                        </div>

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
                                <option value="meeting">Meeting</option>
                                <option value="call">Call</option>
                                <option value="email">Email</option>
                                <option value="personal">Personal</option>
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

                    {/* Related items */}
                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                        {note.personId && (
                            <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <Link
                                    to={`/people/${note.personId}`}
                                    className="text-primary-600 hover:text-primary-700"
                                >
                                    Related person
                                </Link>
                            </div>
                        )}
                        {note.groupId && (
                            <div className="flex items-center gap-1">
                                <Building className="h-4 w-4" />
                                <Link
                                    to={`/groups/${note.groupId}`}
                                    className="text-primary-600 hover:text-primary-700"
                                >
                                    Related group
                                </Link>
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
                        <span>Updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
