import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Users, Calendar } from 'lucide-react';
import { groupsService } from '../services/groupsService';
import { useAuth } from '../contexts/AuthContext';
import CreateGroupModal from '../components/CreateGroupModal';

export default function Groups() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { handleSessionExpiration } = useAuth();

    const { data: groupsResponse, isLoading, error } = useQuery({
        queryKey: ['groups'],
        queryFn: groupsService.getGroups,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 15 * 60 * 1000, // 15 minutes cache
        retry: (failureCount, error) => {
            // Don't retry on authentication errors
            if (error && typeof error === 'object' && 'message' in error &&
                typeof error.message === 'string' &&
                error.message.includes('Session expired')) {
                handleSessionExpiration();
                return false;
            }
            return failureCount < 2;
        },
    });

    const groups = groupsResponse?.success ? groupsResponse.data || [] : [];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-dark-200 dark:bg-dark-800 rounded w-32 mb-6"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-dark-200 dark:bg-dark-800 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || (groupsResponse && !groupsResponse.success)) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-dark-950 dark:text-white">Groups</h1>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        New Group
                    </button>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-800 dark:text-red-200">
                        Failed to load groups: {error?.message || groupsResponse?.error?.message || 'Unknown error'}
                    </p>
                </div>
            </div>
        );
    }

    const getGroupTypeColor = (type: string) => {
        const colors = {
            team: 'bg-blue-100 text-blue-800',
            project: 'bg-green-100 text-green-800',
            customer: 'bg-purple-100 text-purple-800',
            interest: 'bg-orange-100 text-orange-800',
        };
        return colors[type as keyof typeof colors] || 'bg-dark-100 text-dark-800';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-dark-950 dark:text-white">Groups</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    New Group
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {groups.map((group) => (
                    <Link
                        key={group.id}
                        to={`/groups/${group.id}`}
                        className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-dark-200 dark:border-dark-700 p-6 hover:shadow-md transition-all"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-lg">
                                    <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-dark-950 dark:text-white">{group.name}</h3>
                                    {group.type && (
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getGroupTypeColor(group.type)}`}>
                                            {group.type}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <p className="text-dark-700 dark:text-dark-400 text-sm mb-4 line-clamp-2">
                            {group.description}
                        </p>

                        <div className="flex items-center justify-between text-sm text-dark-600 dark:text-dark-500">
                            <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{group.memberCount} members</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(group.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {groups.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-dark-900 rounded-lg shadow transition-colors">
                    <Users className="h-12 w-12 text-dark-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-dark-900 dark:text-white mb-2">No groups yet</h3>
                    <p className="text-dark-600 dark:text-dark-300 mb-4">Create your first group to get started</p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Create Group
                    </button>
                </div>
            )}

            <CreateGroupModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
}
