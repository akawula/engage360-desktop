import { useState, useEffect } from 'react';
import { Calendar, User, Users, FileText } from 'lucide-react';
import Modal from './Modal';
import { useCreateActionItem } from '../hooks/useActionItems';
import { usePeople } from '../hooks/usePeople';
import { groupsService } from '../services/groupsService';
import { notesService } from '../services/notesService';
import type { CreateActionItemRequest, Person, Group, Note } from '../types';

interface AddActionItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    preselectedPersonId?: string;
    preselectedGroupId?: string;
    preselectedNoteId?: string;
    prefilledTitle?: string;
}

export default function AddActionItemModal({
    isOpen,
    onClose,
    preselectedPersonId,
    preselectedGroupId,
    preselectedNoteId,
    prefilledTitle
}: AddActionItemModalProps) {
    const [formData, setFormData] = useState<CreateActionItemRequest>({
        title: prefilledTitle || '',
        description: '',
        priority: 'medium',
        dueDate: '',
        personId: preselectedPersonId || '',
        groupId: preselectedGroupId || '',
        noteId: preselectedNoteId || '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [groups, setGroups] = useState<Group[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [loadingNotes, setLoadingNotes] = useState(false);

    const createActionItemMutation = useCreateActionItem();
    const { data: people } = usePeople();

    // Load groups and notes on mount
    useEffect(() => {
        if (isOpen) {
            loadGroups();
            loadNotes();
        }
    }, [isOpen]);

    // Update form data when prefilled values change
    useEffect(() => {
        console.log('AddActionItemModal useEffect:', { isOpen, prefilledTitle, preselectedPersonId, preselectedGroupId, preselectedNoteId });

        if (isOpen && (prefilledTitle || preselectedPersonId || preselectedGroupId || preselectedNoteId)) {
            console.log('Setting form data with prefilled values');
            setFormData({
                title: prefilledTitle || '',
                description: '',
                priority: 'medium',
                dueDate: '',
                personId: preselectedPersonId || '',
                groupId: preselectedGroupId || '',
                noteId: preselectedNoteId || '',
            });
        } else if (isOpen && !prefilledTitle && !preselectedPersonId && !preselectedGroupId && !preselectedNoteId) {
            // Only reset if no prefilled values are provided
            console.log('Resetting form data');
            setFormData({
                title: '',
                description: '',
                priority: 'medium',
                dueDate: '',
                personId: '',
                groupId: '',
                noteId: '',
            });
        }
    }, [isOpen, prefilledTitle, preselectedPersonId, preselectedGroupId, preselectedNoteId]);

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
                setNotes(response.data);
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

            createActionItemMutation.mutate(cleanedActionData, {
                onSuccess: (response) => {
                    if (response.success) {
                        console.log('Action item created successfully:', response.data);
                        onClose();
                        // Reset form
                        setFormData({
                            title: prefilledTitle || '',
                            description: '',
                            priority: 'medium',
                            dueDate: '',
                            personId: preselectedPersonId || '',
                            groupId: preselectedGroupId || '',
                            noteId: preselectedNoteId || '',
                        });
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
        onClose();
        // Reset form
        setFormData({
            title: prefilledTitle || '',
            description: '',
            priority: 'medium',
            dueDate: '',
            personId: preselectedPersonId || '',
            groupId: preselectedGroupId || '',
            noteId: preselectedNoteId || '',
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={handleCancel} title="Create Action Item">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                        required
                        placeholder="Enter action item title"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Enter action item description"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>

                {/* Priority */}
                <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Priority
                    </label>
                    <select
                        id="priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>

                {/* Due Date */}
                <div>
                    <label htmlFor="dueDate" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        Due Date
                    </label>
                    <input
                        type="datetime-local"
                        id="dueDate"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>

                {/* Associated Person */}
                <div>
                    <label htmlFor="personId" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <User className="h-4 w-4 mr-1" />
                        Associated Person
                    </label>
                    <select
                        id="personId"
                        name="personId"
                        value={formData.personId}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                    <label htmlFor="groupId" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Users className="h-4 w-4 mr-1" />
                        Associated Group
                    </label>
                    <select
                        id="groupId"
                        name="groupId"
                        value={formData.groupId}
                        onChange={handleChange}
                        disabled={loadingGroups}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                    >
                        <option value="">None</option>
                        {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                                {group.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Associated Note */}
                <div>
                    <label htmlFor="noteId" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <FileText className="h-4 w-4 mr-1" />
                        Associated Note
                    </label>
                    <select
                        id="noteId"
                        name="noteId"
                        value={formData.noteId}
                        onChange={handleChange}
                        disabled={loadingNotes}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                    >
                        <option value="">None</option>
                        {notes.map((note) => (
                            <option key={note.id} value={note.id}>
                                {note.title || 'Untitled Note'}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Action Item'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
