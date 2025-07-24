import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, CheckSquare, Calendar, User, Building, FileText } from 'lucide-react';
import { actionItemsService } from '../services/actionItemsService';
import EditActionItemModal from '../components/EditActionItemModal';

export default function ActionItemDetail() {
    const { actionItemId } = useParams<{ actionItemId: string }>();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const { data: actionItem, isLoading } = useQuery({
        queryKey: ['actionItem', actionItemId],
        queryFn: async () => {
            if (!actionItemId) return null;
            const response = await actionItemsService.getActionItems();
            return response.success && response.data ? response.data.find(item => item.id === actionItemId) || null : null;
        },
        enabled: !!actionItemId,
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-dark-300 rounded w-32 mb-6"></div>
                    <div className="h-64 bg-dark-300 rounded"></div>
                </div>
            </div>
        );
    }

    if (!actionItem) {
        return (
            <div className="space-y-6">
                <Link to="/action-items" className="flex items-center gap-2 text-dark-700 dark:text-dark-400 hover:text-dark-950 dark:hover:text-white transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Action Items
                </Link>
                <div className="bg-white dark:bg-dark-900 rounded-lg shadow p-6 transition-colors">
                    <p className="text-dark-700 dark:text-dark-400">Action item not found</p>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-dark-200 text-dark-900';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-dark-200 text-dark-900';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link to="/action-items" className="flex items-center gap-2 text-dark-700 dark:text-dark-400 hover:text-dark-950 dark:hover:text-white transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Action Items
                </Link>
                <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                    <Edit className="h-4 w-4" />
                    Edit Action Item
                </button>
            </div>

            {/* Action Item Content */}
            <div className="bg-white dark:bg-dark-900 rounded-lg shadow p-6 transition-colors">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <CheckSquare className="h-6 w-6 text-primary-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-dark-950 dark:text-white">{actionItem.title}</h1>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(actionItem.status)}`}>
                                    {actionItem.status.replace('_', ' ')}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(actionItem.priority)}`}>
                                    {actionItem.priority} priority
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {actionItem.description && (
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-dark-800 mb-2">Description</h3>
                        <div className="whitespace-pre-wrap text-dark-800">{actionItem.description}</div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-medium text-dark-800 mb-2">Assignment</h3>
                        <div className="text-dark-700 dark:text-dark-400">
                            <p><strong>Assignee:</strong> {actionItem.assigneeName || actionItem.assigneeId}</p>
                        </div>
                    </div>

                    {actionItem.dueDate && (
                        <div>
                            <h3 className="text-sm font-medium text-dark-800 mb-2">Due Date</h3>
                            <div className="flex items-center gap-2 text-dark-700 dark:text-dark-400">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(actionItem.dueDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-6 border-t border-dark-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-dark-700 dark:text-dark-400">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Created: {new Date(actionItem.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Updated: {new Date(actionItem.updatedAt).toLocaleDateString()}</span>
                        </div>
                        {actionItem.personId && (
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <Link
                                    to={`/people/${actionItem.personId}`}
                                    className="text-primary-600 hover:text-primary-700"
                                >
                                    View related person
                                </Link>
                            </div>
                        )}
                        {actionItem.groupId && (
                            <div className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                <Link
                                    to={`/groups/${actionItem.groupId}`}
                                    className="text-primary-600 hover:text-primary-700"
                                >
                                    View related group
                                </Link>
                            </div>
                        )}
                        {actionItem.noteId && (
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <Link
                                    to={`/notes/${actionItem.noteId}`}
                                    className="text-primary-600 hover:text-primary-700"
                                >
                                    View related note
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Action Item Modal */}
            {actionItem && (
                <EditActionItemModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    actionItem={actionItem}
                />
            )}
        </div>
    );
}
