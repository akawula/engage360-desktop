import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, UserMinus, AlertTriangle } from 'lucide-react';
import { groupsService } from '../services/groupsService';
import { formatAvatarSrc } from '../lib/utils';
import type { Person } from '../types';

interface RemoveMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: string;
    groupName: string;
    members: Person[];
}

export default function RemoveMemberModal({ isOpen, onClose, groupId, groupName, members }: RemoveMemberModalProps) {
    const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
    const queryClient = useQueryClient();

    // Mutation to remove members
    const removeMemberMutation = useMutation({
        mutationFn: async (personIds: string[]) => {
            const response = await groupsService.removeGroupMembers(groupId, personIds);

            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to remove members');
            }

            return response;
        },
        onSuccess: () => {
            // Invalidate all group-related queries to update member counts
            queryClient.invalidateQueries({ queryKey: ['groups'] }); // Groups list
            queryClient.invalidateQueries({ queryKey: ['group', groupId] }); // Single group
            queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] }); // Group members
            queryClient.invalidateQueries({ queryKey: ['people'] }); // People list (to update their groups)
            setSelectedPeople([]);
            onClose();
        },
    });

    const handlePersonToggle = (personId: string) => {
        setSelectedPeople(prev =>
            prev.includes(personId)
                ? prev.filter(id => id !== personId)
                : [...prev, personId]
        );
    };

    const handleRemoveMembers = () => {
        if (selectedPeople.length > 0) {
            removeMemberMutation.mutate(selectedPeople);
        }
    };

    const handleClose = () => {
        setSelectedPeople([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] min-h-[400px] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-dark-300 dark:border-dark-800 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-semibold text-dark-950 dark:text-white">
                            Remove Members
                        </h2>
                        <p className="text-sm text-dark-600 dark:text-dark-400 mt-1">
                            Remove members from "{groupName}"
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-dark-500 hover:text-dark-600 dark:hover:text-dark-400"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Warning */}
                <div className="p-6 border-b border-dark-300 dark:border-dark-800 flex-shrink-0">
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                Warning: Removing members from groups
                            </p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                This action will remove the selected people from this group. They will no longer have access to group-specific content.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Members List */}
                <div className="flex-1 min-h-0 p-6 overflow-y-auto">
                    {members.length > 0 ? (
                        <div className="space-y-2">
                            {members.map((member: Person) => (
                                <div
                                    key={member.id}
                                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                        selectedPeople.includes(member.id)
                                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                            : 'border-dark-300 dark:border-dark-800 hover:border-red-300 dark:hover:border-red-600'
                                    }`}
                                    onClick={() => handlePersonToggle(member.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0">
                                            {formatAvatarSrc(member.avatar || member.avatarUrl) ? (
                                                <img
                                                    key={`${member.id}-avatar-${member.avatar || member.avatarUrl}`}
                                                    src={formatAvatarSrc(member.avatar || member.avatarUrl)!}
                                                    alt={`${member.firstName} ${member.lastName}`}
                                                    className="h-10 w-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-dark-400 dark:bg-dark-700 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-dark-800 dark:text-dark-400">
                                                        {member.firstName[0]}{member.lastName[0]}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-dark-950 dark:text-white">
                                                {member.firstName} {member.lastName}
                                            </h3>
                                            <p className="text-sm text-dark-600 dark:text-dark-500">
                                                {member.email}
                                            </p>
                                            {member.position && (
                                                <p className="text-xs text-dark-500 dark:text-dark-600">
                                                    {member.position}
                                                </p>
                                            )}
                                        </div>
                                        {selectedPeople.includes(member.id) && (
                                            <div className="flex-shrink-0">
                                                <div className="h-5 w-5 rounded-full bg-red-600 flex items-center justify-center">
                                                    <UserMinus className="h-3 w-3 text-white" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-dark-600 dark:text-dark-500">
                                No members to remove.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-dark-300 dark:border-dark-800 flex-shrink-0">
                    <div className="text-sm text-dark-600 dark:text-dark-500">
                        {selectedPeople.length} member{selectedPeople.length !== 1 ? 's' : ''} selected for removal
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-dark-800 dark:text-dark-400 border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleRemoveMembers}
                            disabled={selectedPeople.length === 0 || removeMemberMutation.isPending}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <UserMinus className="h-4 w-4" />
                            {removeMemberMutation.isPending ? 'Removing...' : `Remove ${selectedPeople.length} Member${selectedPeople.length !== 1 ? 's' : ''}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}