import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import { ActionItem } from '../types';
import { actionItemsService } from '../services/actionItemsService';

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
        assigneeId: actionItem.assigneeId,
        dueDate: actionItem.dueDate ? actionItem.dueDate.split('T')[0] : '',
    });

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            // Update basic fields first
            const updateResponse = await actionItemsService.updateActionItem(actionItem.id, {
                title: data.title,
                description: data.description || undefined,
                priority: data.priority as 'low' | 'medium' | 'high' | 'urgent',
                assigneeId: data.assigneeId,
                dueDate: data.dueDate || undefined,
            });

            if (!updateResponse.success) {
                const errorMessage = typeof updateResponse.error === 'string'
                    ? updateResponse.error
                    : updateResponse.error?.message || 'Failed to update action item';
                throw new Error(errorMessage);
            }

            // Update status separately if it changed
            if (data.status !== actionItem.status) {
                const statusResponse = await actionItemsService.updateActionStatus(
                    actionItem.id,
                    data.status as 'pending' | 'in_progress' | 'completed' | 'cancelled'
                );

                if (!statusResponse.success) {
                    const errorMessage = typeof statusResponse.error === 'string'
                        ? statusResponse.error
                        : statusResponse.error?.message || 'Failed to update action status';
                    throw new Error(errorMessage);
                }

                return statusResponse.data;
            }

            return updateResponse.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['actionItems'] });
            queryClient.invalidateQueries({ queryKey: ['actionItem', actionItem.id] });
            onClose();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Status
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Priority
                        </label>
                        <select
                            id="priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Assignee ID *
                    </label>
                    <input
                        type="text"
                        id="assigneeId"
                        name="assigneeId"
                        value={formData.assigneeId}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Due Date
                    </label>
                    <input
                        type="date"
                        id="dueDate"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                        {mutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
