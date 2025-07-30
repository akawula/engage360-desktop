import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Calendar, User, Building2, FileText, ArrowLeft, Target, Plus } from 'lucide-react';
import { useCreateActionItem, useUpdateActionItem, useActionItem } from '../hooks/useActionItems';
import { usePeople } from '../hooks/usePeople';
import { groupsService } from '../services/groupsService';
import { notesService } from '../services/notesService';
import type { CreateActionItemRequest, Person, Group, Note } from '../types';

export default function CreateActionItem() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { actionItemId } = useParams<{ actionItemId: string }>();

    // Determine if this is edit mode
    const isEditMode = !!actionItemId;

    // Get prefilled values from URL params (for create mode)
    const prefilledTitle = searchParams.get('title') || '';
    const preselectedPersonId = searchParams.get('personId') || '';
    const preselectedGroupId = searchParams.get('groupId') || '';
    const preselectedNoteId = searchParams.get('noteId') || '';

    const [formData, setFormData] = useState<CreateActionItemRequest>({
        title: prefilledTitle,
        description: '',
        priority: 'medium',
        dueDate: '',
        personId: preselectedPersonId,
        groupId: preselectedGroupId,
        noteId: preselectedNoteId,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [groups, setGroups] = useState<Group[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [loadingNotes, setLoadingNotes] = useState(false);

    const createActionItemMutation = useCreateActionItem();
    const updateActionItemMutation = useUpdateActionItem();
    const { data: people } = usePeople();

    // Load existing action item data if in edit mode
    const { data: existingActionItem, isLoading: isLoadingActionItem } = useActionItem(actionItemId || '');

    // Load groups and notes on mount
    useEffect(() => {
        loadGroups();
        loadNotes();
    }, []);

    // Populate form with existing data in edit mode
    useEffect(() => {
        if (isEditMode && existingActionItem) {
            setFormData({
                title: existingActionItem.title,
                description: existingActionItem.description || '',
                priority: existingActionItem.priority,
                dueDate: existingActionItem.dueDate ? new Date(existingActionItem.dueDate).toISOString().slice(0, 16) : '',
                personId: existingActionItem.personId || '',
                groupId: existingActionItem.groupId || '',
                noteId: existingActionItem.noteId || '',
            });
        }
    }, [isEditMode, existingActionItem]);

    const loadGroups = async () => {
        setLoadingGroups(true);
        try {
            const response = await groupsService.getGroups();
            if (response.success && response.data) {
                setGroups(response.data);
            }
        } catch (error) {
            console.error('Failed to load groups:', error);
        } finally {
            setLoadingGroups(false);
        }
    };

    const loadNotes = async () => {
        setLoadingNotes(true);
        try {
            const response = await notesService.getNotes();
            if (response.success && response.data) {
                setNotes(response.data.notes);
            }
        } catch (error) {
            console.error('Failed to load notes:', error);
        } finally {
            setLoadingNotes(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Format the dueDate properly if provided
            let formattedDueDate: string | undefined = undefined;
            if (formData.dueDate && formData.dueDate.trim() !== '') {
                // Convert datetime-local format to ISO string
                const dateObj = new Date(formData.dueDate);
                if (!isNaN(dateObj.getTime())) {
                    formattedDueDate = dateObj.toISOString();
                } else {
                    console.warn('Invalid date format:', formData.dueDate);
                }
            }

            const actionData: CreateActionItemRequest = {
                title: formData.title,
                description: formData.description || undefined,
                priority: formData.priority,
                dueDate: formattedDueDate,
                personId: (formData.personId && formData.personId.trim() !== '') ? formData.personId : undefined,
                groupId: (formData.groupId && formData.groupId.trim() !== '') ? formData.groupId : undefined,
                noteId: (formData.noteId && formData.noteId.trim() !== '') ? formData.noteId : undefined,
            };

            // Remove undefined values to clean up the request
            const cleanedActionData = Object.fromEntries(
                Object.entries(actionData).filter(([_, value]) => value !== undefined)
            ) as CreateActionItemRequest;

            console.log('Form data before submission:', {
                originalDueDate: formData.dueDate,
                formattedDueDate,
                cleanedActionData
            });

            if (isEditMode && actionItemId) {
                // Update existing action item
                updateActionItemMutation.mutate({ id: actionItemId, data: cleanedActionData }, {
                    onSuccess: (response) => {
                        if (response.success) {
                            console.log('Action item updated successfully:', response.data);
                            // Navigate back to action items list
                            navigate('/action-items');
                        } else {
                            console.error('Failed to update action item:', response.error);
                            alert('Failed to update action item. Please try again.');
                        }
                    },
                    onError: (error) => {
                        console.error('Error updating action item:', error);
                        alert('Failed to update action item. Please try again.');
                    }
                });
            } else {
                // Create new action item
                createActionItemMutation.mutate(cleanedActionData, {
                    onSuccess: (response) => {
                        if (response.success) {
                            console.log('Action item created successfully:', response.data);
                            // Navigate back to action items page
                            navigate('/action-items');
                        } else {
                            console.error('Failed to create action item:', response.error);
                            alert('Failed to create action item. Please try again.');
                        }
                    },
                    onError: (error) => {
                        console.error('Error creating action item:', error);
                        alert('Failed to create action item. Please try again.');
                    }
                });
            }
        } catch (error) {
            console.error('Error creating action item:', error);
            alert('Failed to create action item. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCancel = () => {
        navigate('/action-items');
    };

    // Show loading state while loading existing action item
    if (isEditMode && isLoadingActionItem) {
        return (
            <div className="h-full flex bg-dark-100 dark:bg-dark-950">
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="bg-white dark:bg-dark-900 border-b border-dark-300 dark:border-dark-800 shadow-sm flex-shrink-0">
                        <div className="px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 bg-dark-300 dark:bg-dark-700 rounded animate-pulse"></div>
                                <div className="w-32 h-4 bg-dark-300 dark:bg-dark-700 rounded animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-dark-600 dark:text-dark-400">Loading action item...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex bg-dark-100 dark:bg-dark-950">
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="bg-white dark:bg-dark-900 border-b border-dark-300 dark:border-dark-800 shadow-sm flex-shrink-0">
                    <div className="px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleCancel}
                                    className="group flex items-center gap-2 text-dark-700 dark:text-dark-400 hover:text-dark-950 dark:hover:text-white transition-all duration-200 px-2 py-1 rounded-lg hover:bg-dark-200 dark:hover:bg-dark-800"
                                    title="Back to Action Items"
                                >
                                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                                    <span className="font-medium">Action Items</span>
                                </button>

                                <div className="h-5 w-px bg-dark-400 dark:bg-dark-700"></div>

                                <div className="flex items-center gap-2">
                                    <Plus className="h-4 w-4 text-primary-500" />
                                    <h1 className="text-base font-semibold text-dark-950 dark:text-white">
                                        {isEditMode ? 'Edit Action Item' : 'Create New Action Item'}
                                    </h1>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-3 py-1.5 text-dark-800 dark:text-dark-400 border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-all duration-200 hover:shadow-md flex items-center gap-1.5"
                                >
                                    <span>Cancel</span>
                                </button>
                                <button
                                    type="submit"
                                    form="action-item-form"
                                    disabled={isSubmitting}
                                    className="px-4 py-1.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md hover:shadow-lg disabled:shadow-none"
                                >
                                    <Target className="h-4 w-4" />
                                    <span className="font-medium">
                                        {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update' : 'Create')}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto bg-white dark:bg-dark-900">
                    <div className="w-full p-6">
                        <form id="action-item-form" onSubmit={handleSubmit} className="space-y-6">
                            {/* Title */}
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter action item title"
                                    className="w-full px-4 py-3 text-base border border-dark-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-800 dark:border-dark-700 dark:text-white placeholder-dark-600 dark:placeholder-dark-500 transition-all duration-200"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-2">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Enter action item description"
                                    className="w-full px-4 py-3 text-base border border-dark-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-800 dark:border-dark-700 dark:text-white placeholder-dark-600 dark:placeholder-dark-500 transition-all duration-200 resize-none"
                                />
                            </div>

                            {/* Form Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Priority */}
                                <div>
                                    <label htmlFor="priority" className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-2">
                                        Priority
                                    </label>
                                    <select
                                        id="priority"
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 text-base border border-dark-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-800 dark:border-dark-700 dark:text-white transition-all duration-200"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>

                                {/* Due Date */}
                                <div>
                                    <label htmlFor="dueDate" className="flex items-center text-sm font-medium text-dark-800 dark:text-dark-400 mb-2">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Due Date
                                    </label>
                                    <input
                                        type="datetime-local"
                                        id="dueDate"
                                        name="dueDate"
                                        value={formData.dueDate}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 text-base border border-dark-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-800 dark:border-dark-700 dark:text-white transition-all duration-200"
                                    />
                                </div>

                                {/* Associated Person */}
                                <div>
                                    <label htmlFor="personId" className="flex items-center text-sm font-medium text-dark-800 dark:text-dark-400 mb-2">
                                        <User className="h-4 w-4 mr-2" />
                                        Associated Person
                                    </label>
                                    <select
                                        id="personId"
                                        name="personId"
                                        value={formData.personId}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 text-base border border-dark-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-800 dark:border-dark-700 dark:text-white transition-all duration-200"
                                    >
                                        <option value="">None</option>
                                        {people?.people?.map((person: Person) => (
                                            <option key={person.id} value={person.id}>
                                                {person.firstName} {person.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Associated Group */}
                                <div>
                                    <label htmlFor="groupId" className="flex items-center text-sm font-medium text-dark-800 dark:text-dark-400 mb-2">
                                        <Building2 className="h-4 w-4 mr-2" />
                                        Associated Group
                                    </label>
                                    <select
                                        id="groupId"
                                        name="groupId"
                                        value={formData.groupId}
                                        onChange={handleChange}
                                        disabled={loadingGroups}
                                        className="w-full px-4 py-3 text-base border border-dark-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-800 dark:border-dark-700 dark:text-white disabled:opacity-50 transition-all duration-200"
                                    >
                                        <option value="">None</option>
                                        {groups.map((group) => (
                                            <option key={group.id} value={group.id}>
                                                {group.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Associated Note */}
                            <div>
                                <label htmlFor="noteId" className="flex items-center text-sm font-medium text-dark-800 dark:text-dark-400 mb-2">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Associated Note
                                </label>
                                <select
                                    id="noteId"
                                    name="noteId"
                                    value={formData.noteId}
                                    onChange={handleChange}
                                    disabled={loadingNotes}
                                    className="w-full px-4 py-3 text-base border border-dark-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-800 dark:border-dark-700 dark:text-white disabled:opacity-50 transition-all duration-200"
                                >
                                    <option value="">None</option>
                                    {notes.map((note) => (
                                        <option key={note.id} value={note.id}>
                                            {note.title || 'Untitled Note'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
