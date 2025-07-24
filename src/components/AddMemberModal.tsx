import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Search, Plus } from 'lucide-react';
import { groupsService } from '../services/groupsService';
import { PeopleService } from '../services/peopleService';
import { formatAvatarSrc } from '../lib/utils';
import type { Person } from '../types';

const peopleService = new PeopleService();

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: string;
    currentMembers: Person[];
}

export default function AddMemberModal({ isOpen, onClose, groupId, currentMembers }: AddMemberModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
    const queryClient = useQueryClient();

    // Get list of all people
    const { data: peopleResponse, isLoading } = useQuery({
        queryKey: ['people', searchTerm],
        queryFn: async () => {
            const response = await peopleService.getPeople({
                search: searchTerm,
                limit: 50
            });
            return response;
        },
        enabled: isOpen,
    }); const people = peopleResponse?.success ? peopleResponse.data?.people || [] : [];

    // Filter out people who are already members
    const currentMemberIds = currentMembers.map(member => member.id);
    const availablePeople = people.filter((person: Person) => !currentMemberIds.includes(person.id));

    // Mutation to add members
    const addMemberMutation = useMutation({
        mutationFn: async (personIds: string[]) => {
            const response = await groupsService.addGroupMembers(groupId, personIds);

            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to add members');
            }

            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['group', groupId] });
            queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] });
            setSelectedPeople([]);
            onClose();
        },
    });

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
            setSelectedPeople([]);
        }
    }, [isOpen]);

    const handlePersonToggle = (personId: string) => {
        setSelectedPeople(prev =>
            prev.includes(personId)
                ? prev.filter(id => id !== personId)
                : [...prev, personId]
        );
    };

    const handleAddMembers = () => {
        if (selectedPeople.length > 0) {
            addMemberMutation.mutate(selectedPeople);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] min-h-[400px] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-dark-300 dark:border-dark-800 flex-shrink-0">
                    <h2 className="text-xl font-semibold text-dark-950 dark:text-white">
                        Add Members to Group
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-dark-500 hover:text-dark-600 dark:hover:text-dark-400"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-6 border-b border-dark-300 dark:border-dark-800 flex-shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-500" />
                        <input
                            type="text"
                            placeholder="Search people..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* People List */}
                <div className="flex-1 min-h-0 p-6 overflow-y-auto">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="h-16 bg-dark-300 dark:bg-dark-800 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : availablePeople.length > 0 ? (
                        <div className="space-y-2">
                            {availablePeople.map((person: Person) => (
                                <div
                                    key={person.id}
                                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedPeople.includes(person.id)
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-dark-300 dark:border-dark-800 hover:border-primary-300 dark:hover:border-primary-600'
                                        }`}
                                    onClick={() => handlePersonToggle(person.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0">
                                            {formatAvatarSrc(person.avatar || person.avatarUrl) ? (
                                                <img
                                                    key={`${person.id}-avatar-${person.avatar || person.avatarUrl}`}
                                                    src={formatAvatarSrc(person.avatar || person.avatarUrl)!}
                                                    alt={`${person.firstName} ${person.lastName}`}
                                                    className="h-10 w-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-dark-400 dark:bg-dark-700 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-dark-800 dark:text-dark-400">
                                                        {person.firstName[0]}{person.lastName[0]}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-dark-950 dark:text-white">
                                                {person.firstName} {person.lastName}
                                            </h3>
                                            <p className="text-sm text-dark-600 dark:text-dark-500">
                                                {person.email}
                                            </p>
                                            {person.position && (
                                                <p className="text-xs text-dark-500 dark:text-dark-600">
                                                    {person.position}
                                                </p>
                                            )}
                                        </div>
                                        {selectedPeople.includes(person.id) && (
                                            <div className="flex-shrink-0">
                                                <div className="h-5 w-5 rounded-full bg-primary-600 flex items-center justify-center">
                                                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
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
                                {searchTerm ? 'No people found matching your search.' : 'No people available to add.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-dark-300 dark:border-dark-800 flex-shrink-0">
                    <div className="text-sm text-dark-600 dark:text-dark-500">
                        {selectedPeople.length} people selected
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-dark-800 dark:text-dark-400 border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddMembers}
                            disabled={selectedPeople.length === 0 || addMemberMutation.isPending}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            {addMemberMutation.isPending ? 'Adding...' : `Add ${selectedPeople.length} Member${selectedPeople.length !== 1 ? 's' : ''}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
