import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Calendar, User, Building, Tag, Clock, Sparkles, FileText, UserCheck, Check, Play, Timer, Zap, Flame, ChevronDown, ChevronUp, SidebarOpen, SidebarClose } from 'lucide-react';
import { notesService } from '../services/notesService';
import { peopleService } from '../services/peopleService';
import { groupsService } from '../services/groupsService';
import { authService } from '../services/authService';
import { formatAvatarSrc } from '../lib/utils';
import RichTextEditor, { type RichTextEditorRef } from '../components/RichTextEditor';
import AddActionItemModal from '../components/AddActionItemModal';
import { useActionItems } from '../hooks/useActionItems';
import { ollamaService } from '../services/ollamaService';
import { userProfileService } from '../services/userProfileService';
import { useNotification } from '../contexts/NotificationContext';

// Helper functions for action item styling
const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
        case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
        case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
        case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
        default: return 'bg-dark-200 text-dark-900 dark:bg-dark-950/30 dark:text-dark-300';
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
        case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
        case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
        case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
        default: return 'bg-dark-200 text-dark-900 dark:bg-dark-950/30 dark:text-dark-300';
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
    const { showError, showSuccess, showWarning } = useNotification();

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

    // UI state for maximizing editor
    const [isMetadataCollapsed, setIsMetadataCollapsed] = useState(true);
    const [isActionItemsPanelOpen, setIsActionItemsPanelOpen] = useState(false);

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


    // Helper function to check if form data has actually changed from original note
    const hasActualChanges = (currentFormData: typeof formData, originalNote: typeof note) => {
        if (!originalNote) return false;
        
        return (
            currentFormData.title !== originalNote.title ||
            currentFormData.content !== originalNote.content ||
            currentFormData.type !== originalNote.type ||
            JSON.stringify(currentFormData.tags.sort()) !== JSON.stringify((originalNote.tags || []).sort())
        );
    };

    // Initialize form when note loads
    useEffect(() => {
        if (note) {
            setFormData({
                title: note.title,
                content: note.content,
                type: note.type,
                tags: note.tags || [],
            });
            // Reset hasChanges when loading fresh data
            setHasChanges(false);
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
            showSuccess('Note Saved', 'Your note has been saved successfully.');
            // Invalidate and refetch cache to ensure fresh data
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['notes'] }),
                queryClient.invalidateQueries({ queryKey: ['note', noteId] }),
                queryClient.refetchQueries({ queryKey: ['notes'] })
            ]);
            // Stay on the current note after saving
        },
        onError: (error) => {
            console.error('Failed to save note:', error);
            showError('Save Failed', `Failed to save note: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
        },
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFormData = {
            ...formData,
            [name]: value,
        };
        setFormData(newFormData);
        setHasChanges(hasActualChanges(newFormData, note));
    };

    const handleContentChange = (content: string) => {
        const newFormData = {
            ...formData,
            content,
        };
        setFormData(newFormData);
        setHasChanges(hasActualChanges(newFormData, note));
    };

    // Tag handling functions
    const addTag = (tag: string) => {
        const trimmedTag = tag.trim();
        if (trimmedTag && !formData.tags.includes(trimmedTag)) {
            const newFormData = {
                ...formData,
                tags: [...formData.tags, trimmedTag]
            };
            setFormData(newFormData);
            setHasChanges(hasActualChanges(newFormData, note));
        }
    };

    const removeTag = (tagToRemove: string) => {
        const newFormData = {
            ...formData,
            tags: formData.tags.filter(tag => tag !== tagToRemove)
        };
        setFormData(newFormData);
        setHasChanges(hasActualChanges(newFormData, note));
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

        // Validate the note data before saving
        const trimmedTitle = formData.title.trim();
        const trimmedContent = currentContent.trim();

        // Basic validation
        if (!trimmedTitle) {
            showWarning('Title Required', 'Please enter a title for your note.');
            return;
        }

        if (!trimmedContent) {
            showWarning('Content Required', 'Please enter some content for your note.');
            return;
        }

        // Check for potentially problematic characters that might cause encoding issues
        const problematicChars = /[\u0000-\u001F\u007F-\u009F]/g; // Control characters
        if (problematicChars.test(trimmedTitle) || problematicChars.test(trimmedContent)) {
            showError('Invalid Characters', 'Please remove any special control characters from your note.');
            return;
        }

        // Use the content from the editor, not from formData
        const dataWithEditorContent = {
            ...formData,
            title: trimmedTitle,
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

    const handleFindTasks = async (selectedText: string) => {
        try {
            // Get user's Ollama preferences
            const profileResponse = await userProfileService.getUserProfile();
            const isOllamaEnabled = profileResponse.success && profileResponse.data?.preferences?.ollama?.enabled;
            const modelName = profileResponse.data?.preferences?.ollama?.model || 'llama3.2:1b';

            if (isOllamaEnabled) {
                // Check if Ollama is available
                const ollamaStatus = await ollamaService.checkOllamaStatus();
                
                if (ollamaStatus.isInstalled && ollamaStatus.isRunning) {
                    try {
                        const aiResult = await ollamaService.detectTasks(modelName, selectedText);
                        
                        if (aiResult.totalTasks > 0) {
                            // Display AI-detected tasks summary
                            console.log(`🔍 AI detected ${aiResult.totalTasks} tasks in ${aiResult.detectedLanguage}`);
                            aiResult.tasks.forEach((task, index) => {
                                console.log(`${index + 1}. [${task.type}] ${task.content} (${task.priority})`);
                            });
                        } else {
                            console.log('No tasks found by AI analysis');
                        }
                        return; // Successfully used AI, exit early
                        
                    } catch (aiError) {
                        console.warn('AI analysis failed, falling back to regex detection:', aiError);
                    }
                }
            }
        } catch (error) {
            console.warn('Error checking AI availability');
        }

        // Fallback to regex-based detection
        const taskPatterns = [
            /\b(?:todo|TODO|to do|to-do):\s*(.+)/gi,
            /\b(?:task|TASK):\s*(.+)/gi,
            /\b(?:action|ACTION):\s*(.+)/gi,
            /\b(?:need to|needs to|should|must|have to)\s+(.+)/gi,
            /\b(?:implement|fix|create|add|remove|update|refactor|test)\s+(.+)/gi,
            /^\s*[-*]\s*(?:\[[\s\-x]\])?\s*(.+)$/gm, // Bullet points with optional checkboxes
            /^\s*\d+\.\s*(.+)$/gm, // Numbered lists
            /\b(?:deadline|due|by)\s+(?:on\s+)?(.+)/gi,
            /\b(?:remember to|don't forget to)\s+(.+)/gi,
            /\b(?:follow up|followup)\s+(?:on\s+)?(.+)/gi
        ];

        const foundTasks: string[] = [];

        taskPatterns.forEach((pattern) => {
            const matches = [...selectedText.matchAll(pattern)];
            matches.forEach(match => {
                const taskContent = match[1]?.trim();
                if (taskContent && taskContent.length > 3) {
                    foundTasks.push(taskContent);
                }
            });
        });

        // Remove duplicates
        const uniqueTasks = [...new Set(foundTasks)];
        
        if (uniqueTasks.length > 0) {
            console.log(`📋 Found ${uniqueTasks.length} potential tasks using regex detection`);
            uniqueTasks.forEach((task, index) => {
                console.log(`${index + 1}. ${task}`);
            });
        } else {
            console.log('No tasks found in selected text');
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
                <div className="animate-pulse text-dark-600 dark:text-dark-500">Loading note...</div>
            </div>
        );
    }

    if (!note) {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                <p className="text-dark-700 dark:text-dark-400 mb-4">Note not found</p>
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
            default: return 'bg-dark-200 text-dark-900 dark:bg-dark-950/30 dark:text-dark-300 border border-dark-300 dark:border-dark-800';
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-dark-600 dark:text-dark-500">Loading note...</div>
            </div>
        );
    }

    if (!note) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-dark-600 dark:text-dark-500">Note not found</div>
            </div>
        );
    }

    return (
        <div className="h-full flex bg-dark-100 dark:bg-dark-950 relative">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Compact Header */}
                <div className="bg-white dark:bg-dark-900 border-b border-dark-300 dark:border-dark-800 shadow-sm flex-shrink-0">
                    <div className="px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleCancel}
                                    disabled={updateMutation.isPending}
                                    className="group flex items-center gap-2 text-dark-700 dark:text-dark-400 hover:text-dark-950 dark:hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded-lg hover:bg-dark-200 dark:hover:bg-dark-800"
                                >
                                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                                    <span className="font-medium">Notes</span>
                                </button>

                                <div className="h-5 w-px bg-dark-400 dark:bg-dark-700"></div>

                                {/* Related items - always visible */}
                                {(note.personId || note.groupId) && (
                                    <div className="flex items-center gap-2">
                                        {note.personId && relatedPerson && (
                                            <Link
                                                to={`/people/${note.personId}`}
                                                className="group flex items-center gap-2 p-1.5 rounded-lg border border-dark-300 dark:border-dark-700 bg-white dark:bg-dark-800 hover:shadow-sm transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-600"
                                            >
                                                {formatAvatarSrc(relatedPerson.avatarUrl || relatedPerson.avatar) ? (
                                                    <img
                                                        src={formatAvatarSrc(relatedPerson.avatarUrl || relatedPerson.avatar)!}
                                                        alt={`${relatedPerson.firstName} ${relatedPerson.lastName}`}
                                                        className="w-6 h-6 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center">
                                                        <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                                                            {relatedPerson.firstName[0]}{relatedPerson.lastName[0]}
                                                        </span>
                                                    </div>
                                                )}
                                                <span className="text-sm font-medium text-dark-950 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                    {relatedPerson.firstName} {relatedPerson.lastName}
                                                </span>
                                            </Link>
                                        )}
                                        {note.groupId && relatedGroup && (
                                            <Link
                                                to={`/groups/${note.groupId}`}
                                                className="group flex items-center gap-2 p-1.5 rounded-lg border border-dark-300 dark:border-dark-700 bg-white dark:bg-dark-800 hover:shadow-sm transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-600"
                                            >
                                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center">
                                                    <Building className="h-3 w-3 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <span className="text-sm font-medium text-dark-950 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                    {relatedGroup.name}
                                                </span>
                                            </Link>
                                        )}
                                    </div>
                                )}

                                {/* Metadata toggle button */}
                                <button
                                    onClick={() => setIsMetadataCollapsed(!isMetadataCollapsed)}
                                    className="flex items-center gap-2 px-3 py-1 rounded-lg text-dark-600 dark:text-dark-400 hover:text-dark-950 dark:hover:text-white hover:bg-dark-200 dark:hover:bg-dark-800 transition-all duration-200"
                                    title={isMetadataCollapsed ? 'Show metadata' : 'Hide metadata'}
                                >
                                    {isMetadataCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                                    <span className="text-sm">Metadata</span>
                                </button>

                                {actionItems && actionItems.length > 0 && (
                                    <button
                                        onClick={() => setIsActionItemsPanelOpen(!isActionItemsPanelOpen)}
                                        className="flex items-center gap-2 px-3 py-1 rounded-lg text-dark-600 dark:text-dark-400 hover:text-dark-950 dark:hover:text-white hover:bg-dark-200 dark:hover:bg-dark-800 transition-all duration-200"
                                        title={isActionItemsPanelOpen ? 'Hide action items' : 'Show action items'}
                                    >
                                        {isActionItemsPanelOpen ? <SidebarClose className="h-4 w-4" /> : <SidebarOpen className="h-4 w-4" />}
                                        <span className="text-sm">Actions ({actionItems.length})</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {hasChanges && (
                                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                        <span className="text-sm font-medium">Unsaved</span>
                                    </div>
                                )}
                                <button
                                    onClick={handleCancel}
                                    className="px-3 py-1.5 text-dark-800 dark:text-dark-400 border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-all duration-200 hover:shadow-md flex items-center gap-1.5"
                                >
                                    <X className="h-4 w-4" />
                                    <span>Cancel</span>
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!hasChanges || updateMutation.isPending}
                                    className="px-4 py-1.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md hover:shadow-lg disabled:shadow-none"
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

                {/* Title Section - Always Visible */}
                <div className="bg-white dark:bg-dark-900 border-b border-dark-300 dark:border-dark-800 flex-shrink-0">
                    <div className="px-6 py-4">
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full px-0 py-2 border-0 bg-transparent text-dark-950 dark:text-white text-2xl font-semibold placeholder-dark-500 dark:placeholder-dark-600 focus:ring-0 focus:outline-none resize-none"
                            placeholder="Untitled note..."
                            style={{ lineHeight: '1.2' }}
                        />
                        <div className="h-0.5 bg-gradient-to-r from-primary-500 via-primary-400 to-transparent mt-2"></div>
                    </div>
                </div>


                {/* Maximized Content Editor */}
                <div className="flex-1 bg-white dark:bg-dark-900 overflow-hidden">
                    <div className="h-full p-6">
                        <RichTextEditor
                            ref={editorRef}
                            content={formData.content}
                            onChange={handleContentChange}
                            placeholder="Start writing your note here..."
                            className="h-full prose prose-lg max-w-none dark:prose-invert prose-primary"
                            onFindTasks={handleFindTasks}
                        />
                    </div>
                </div>

                {/* Note Type and Tags Section - Hidden by default */}
                {!isMetadataCollapsed && (
                    <div className="bg-white dark:bg-dark-900 border-t border-dark-300 dark:border-dark-800 flex-shrink-0">
                        <div className="px-6 py-4 space-y-4">
                            {/* Note Type Selection */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="h-4 w-4 text-primary-500" />
                                    <span className="text-sm font-medium text-dark-800 dark:text-dark-400">Note Type</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { value: 'personal', emoji: '👥', label: '1on1' },
                                        { value: 'meeting', emoji: '🤝', label: 'Meeting' },
                                        { value: 'call', emoji: '📞', label: 'Call' },
                                        { value: 'email', emoji: '✉️', label: 'Email' },
                                        { value: 'follow_up', emoji: '🔄', label: 'Follow Up' }
                                    ].map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => handleChange({ target: { name: 'type', value: type.value } } as any)}
                                            className={`group px-3 py-1.5 rounded-full border transition-all duration-200 hover:shadow-sm ${formData.type === type.value
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500/20'
                                                : 'border-dark-300 dark:border-dark-700 bg-white dark:bg-dark-800 hover:border-dark-400 dark:hover:border-dark-600'
                                                }`}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm">{type.emoji}</span>
                                                <span className="text-sm font-medium text-dark-800 dark:text-dark-400">
                                                    {type.label}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tags Section */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Tag className="h-4 w-4 text-primary-500" />
                                    <span className="text-sm font-medium text-dark-800 dark:text-dark-400">Tags</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.tags && formData.tags.length > 0 && (
                                        formData.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="group inline-flex items-center px-2.5 py-1 rounded-full text-sm bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200 border border-primary-200 dark:border-primary-700 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-all duration-200"
                                            >
                                                <span className="mr-1">#</span>
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => removeTag(tag)}
                                                    className="ml-1.5 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 transition-colors opacity-0 group-hover:opacity-100"
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
                                        className="px-3 py-1 border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-950 dark:text-white rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm min-w-24"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Compact Footer */}
                <div className="bg-white dark:bg-dark-900 border-t border-dark-300 dark:border-dark-800 px-4 py-2 flex-shrink-0">
                    <div className="flex items-center justify-between text-xs text-dark-600 dark:text-dark-500">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-dark-200 dark:bg-dark-800 rounded text-xs font-mono">⌘S</kbd>
                                Save
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-dark-200 dark:bg-dark-800 rounded text-xs font-mono">Esc</kbd>
                                Cancel
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(formData.type)}`}>
                                {formData.type.replace('_', ' ')}
                            </span>
                            {formData.tags && formData.tags.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200 border border-primary-200 dark:border-primary-700">
                                    {formData.tags.length} tag{formData.tags.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Items Sidebar */}
            {isActionItemsPanelOpen && actionItems && actionItems.length > 0 && (
                <div className="w-80 bg-white dark:bg-dark-900 border-l border-dark-300 dark:border-dark-800 flex-shrink-0 flex flex-col">
                    <div className="px-4 py-3 border-b border-dark-300 dark:border-dark-800">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-dark-950 dark:text-white">
                                Action Items ({actionItems.length})
                            </h3>
                            <button
                                onClick={() => setIsActionItemsPanelOpen(false)}
                                className="p-1 rounded text-dark-500 hover:text-dark-700 dark:hover:text-dark-300"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {actionItems.map((item) => {
                            const StatusIcon = getStatusIcon(item.status);
                            const PriorityIcon = getPriorityIcon(item.priority);
                            const dueDateText = getDueDateText(item.dueDate);
                            const isItemOverdue = isOverdue(item.dueDate);

                            return (
                                <div
                                    key={item.id}
                                    className={`p-3 rounded-lg border transition-all duration-200 ${isItemOverdue
                                        ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
                                        : 'border-dark-300 dark:border-dark-800 hover:border-primary-200 dark:hover:border-primary-700'
                                        }`}
                                >
                                    <div className="flex items-start gap-2 mb-2">
                                        <div className="w-6 h-6 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded flex items-center justify-center flex-shrink-0">
                                            <StatusIcon className="h-3 w-3 text-primary-600 dark:text-primary-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-dark-950 dark:text-white line-clamp-2 mb-1">
                                                {item.title}
                                            </h4>
                                            {item.description && (
                                                <p className="text-xs text-dark-700 dark:text-dark-400 line-clamp-2">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                                            {item.status.replace('_', ' ')}
                                        </span>
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getPriorityColor(item.priority)}`}>
                                            <PriorityIcon className="h-2.5 w-2.5 mr-0.5" />
                                            {item.priority}
                                        </span>
                                    </div>

                                    {dueDateText && (
                                        <div className={`text-xs font-medium mb-1 ${isItemOverdue
                                            ? 'text-red-700 dark:text-red-300'
                                            : item.dueDate && new Date(item.dueDate).getTime() - Date.now() < 24 * 60 * 60 * 1000
                                                ? 'text-orange-700 dark:text-orange-300'
                                                : 'text-dark-700 dark:text-dark-500'
                                            }`}>
                                            {dueDateText} {isItemOverdue && '⚠️'}
                                        </div>
                                    )}

                                    <div className="text-xs text-dark-600 dark:text-dark-500">
                                        {item.assigneeName && (
                                            <div className="flex items-center gap-1 mb-1">
                                                <UserCheck className="h-3 w-3" />
                                                <span>{item.assigneeName}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>{getRelativeTime(item.updatedAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

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
