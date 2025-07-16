import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Users, Plus } from 'lucide-react';
import { groupsService } from '../services/groupsService';
import EditGroupModal from '../components/EditGroupModal';
import AddMemberModal from '../components/AddMemberModal';

export default function GroupDetail() {
    const { groupId } = useParams<{ groupId: string }>();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

    const { data: groupResponse, isLoading, error } = useQuery({
        queryKey: ['group', groupId],
        queryFn: () => groupId ? groupsService.getGroupById(groupId) : null,
        enabled: !!groupId,
    });

    const { data: membersResponse } = useQuery({
        queryKey: ['groupMembers', groupId],
        queryFn: () => groupId ? groupsService.getGroupMembers(groupId) : null,
        enabled: !!groupId,
    });

    const group = groupResponse?.success ? groupResponse.data : null;
    const members = membersResponse?.success ? membersResponse.data || [] : [];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (error || (groupResponse && !groupResponse.success)) {
        return (
            <div className="space-y-6">
                <Link to="/groups" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Groups
                </Link>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-800 dark:text-red-200">
                        Failed to load group: {error?.message || groupResponse?.error?.message || 'Unknown error'}
                    </p>
                </div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="space-y-6">
                <Link to="/groups" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Groups
                </Link>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <p className="text-gray-600 dark:text-gray-300">Group not found</p>
                </div>
            </div>
        );
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'team': return 'bg-blue-100 text-blue-800';
            case 'project': return 'bg-green-100 text-green-800';
            case 'customer': return 'bg-purple-100 text-purple-800';
            case 'interest': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link to="/groups" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Groups
                </Link>
                <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                    <Edit className="h-4 w-4" />
                    Edit Group
                </button>
            </div>

            {/* Group Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{group.name}</h1>
                        <div className="flex items-center gap-3">
                            {group.type && (
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(group.type)}`}>
                                    {group.type}
                                </span>
                            )}
                            <span className="text-gray-500 dark:text-gray-400 text-sm">
                                {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                </div>

                {group.description && (
                    <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                        <p className="text-gray-600 dark:text-gray-300">{group.description}</p>
                    </div>
                )}

                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Created: {new Date(group.createdAt).toLocaleDateString()}
                </div>
            </div>

            {/* Members Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Members ({members.length})
                        </h2>
                        <button
                            onClick={() => setIsAddMemberModalOpen(true)}
                            className="bg-primary-600 text-white px-3 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm"
                        >
                            <Plus className="h-4 w-4" />
                            Add Member
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {members.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {members.map((member: any) => {
                                // Handle nested person structure from API
                                const person = member.person || member;
                                const firstName = person.first_name || person.firstName || 'Unknown';
                                const lastName = person.last_name || person.lastName || 'User';
                                const avatar = person.avatar_url || person.avatar;
                                const position = person.job_description || person.position || '';

                                return (
                                    <Link
                                        key={member.id || person.id}
                                        to={`/people/${person.id}`}
                                        className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center gap-3">
                                            {avatar ? (
                                                <img
                                                    key={`${person.id}-avatar-${avatar}`}
                                                    src={avatar}
                                                    alt={`${firstName} ${lastName}`}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                                    <span className="text-sm font-bold text-primary-600">
                                                        {firstName[0]}{lastName[0]}
                                                    </span>
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-medium text-gray-900 dark:text-white">
                                                    {firstName} {lastName}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{position}</p>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No members yet</p>
                    )}
                </div>
            </div>

            {/* Edit Group Modal */}
            {group && (
                <EditGroupModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    group={group}
                />
            )}

            {/* Add Member Modal */}
            {group && (
                <AddMemberModal
                    isOpen={isAddMemberModalOpen}
                    onClose={() => setIsAddMemberModalOpen(false)}
                    groupId={group.id}
                    currentMembers={members}
                />
            )}
        </div>
    );
}
