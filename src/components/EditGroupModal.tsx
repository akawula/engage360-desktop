import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import { Group } from '../types';
import { groupsService } from '../services/groupsService';

interface EditGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    group: Group;
}

export default function EditGroupModal({ isOpen, onClose, group }: EditGroupModalProps) {
    const [formData, setFormData] = useState({
        name: group.name,
        description: group.description || '',
        type: group.type,
    });

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const response = await groupsService.updateGroup(group.id, {
                name: data.name,
                description: data.description || undefined,
                type: data.type as 'team' | 'project' | 'customer' | 'interest',
            });

            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to update group');
            }

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            queryClient.invalidateQueries({ queryKey: ['group', group.id] });
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
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Group">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-1">
                        Name *
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-3 xs:py-2 text-base xs:text-sm min-h-[44px] xs:min-h-[40px] border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent touch-manipulation"
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
                        className="w-full px-3 py-3 xs:py-2 text-base xs:text-sm min-h-[88px] xs:min-h-[80px] border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent touch-manipulation"
                    />
                </div>

                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-1">
                        Type *
                    </label>
                    <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-3 xs:py-2 text-base xs:text-sm min-h-[44px] xs:min-h-[40px] border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent touch-manipulation"
                    >
                        <option value="team">Team</option>
                        <option value="project">Project</option>
                        <option value="customer">Customer</option>
                        <option value="interest">Interest</option>
                    </select>
                </div>

                <div className="flex flex-col xs:flex-row gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 xs:py-2 text-base xs:text-sm min-h-[44px] xs:min-h-[40px] text-dark-800 dark:text-dark-400 border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors touch-manipulation"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="flex-1 px-4 py-3 xs:py-2 text-base xs:text-sm min-h-[44px] xs:min-h-[40px] bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 touch-manipulation"
                    >
                        {mutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
