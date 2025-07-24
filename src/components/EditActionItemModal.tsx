import { useState } from 'react';
import Modal from './Modal';
import { ActionItem } from '../types';
import { useUpdateActionItem, useUpdateActionStatus } from '../hooks/useActionItems';

interface EditActionItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    actionItem: ActionItem;
}

export default function EditActionItemModal({ isOpen, onClose, actionItem }: EditActionItemModalProps) {
    const [formData, setFormData] = useState({
        title: actionItem.title,
        description: actionItem.description || '',
        status: actionItem.status,
        priority: actionItem.priority,
        dueDate: actionItem.dueDate ? actionItem.dueDate.split('T')[0] : '',
    });

    const updateActionItem = useUpdateActionItem();
    const updateActionStatus = useUpdateActionStatus();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Format the due date to ISO string if provided
            const formattedDueDate = formData.dueDate
                ? new Date(formData.dueDate + 'T00:00:00.000Z').toISOString()
                : undefined;

            // Update basic fields first
            await updateActionItem.mutateAsync({
                id: actionItem.id,
                data: {
                    title: formData.title,
                    description: formData.description || undefined,
                    priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
                    dueDate: formattedDueDate,
                }
            });

            // Update status if it changed
            if (formData.status !== actionItem.status) {
                await updateActionStatus.mutateAsync({
                    id: actionItem.id,
                    status: formData.status as 'pending' | 'in_progress' | 'completed' | 'cancelled'
                });
            }

            onClose();
        } catch (error) {
            console.error('Failed to update action item:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Action Item">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-1">
                        Title *
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-1">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-1">
                            Status
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-1">
                            Priority
                        </label>
                        <select
                            id="priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-1">
                        Due Date
                    </label>
                    <input
                        type="date"
                        id="dueDate"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-dark-800 dark:text-dark-400 border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={updateActionItem.isPending || updateActionStatus.isPending}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                        {(updateActionItem.isPending || updateActionStatus.isPending) ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
