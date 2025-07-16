import { useState } from 'react';
import { Plus, CheckSquare, Clock, User, Calendar, AlertCircle, Edit2, Trash2, Check, X, Play, Square } from 'lucide-react';
import { useActionItems, useUpdateActionStatus, useDeleteActionItem } from '../hooks/useActionItems';
import AddActionItemModal from '../components/AddActionItemModal';
import EditActionItemModal from '../components/EditActionItemModal';
import type { ActionItem } from '../types';

// Helper function to format dates in a human-readable way
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    // Same day
    if (diffInDays === 0) {
        if (diffInHours === 0) {
            if (diffInMinutes < 1) return 'Just now';
            if (diffInMinutes === 1) return '1 minute ago';
            return `${diffInMinutes} minutes ago`;
        }
        if (diffInHours === 1) return '1 hour ago';
        return `${diffInHours} hours ago`;
    }

    // Yesterday
    if (diffInDays === 1) {
        return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // This week (within 7 days)
    if (diffInDays < 7) {
        const dayName = date.toLocaleDateString([], { weekday: 'long' });
        return `${dayName} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // This year
    const isThisYear = date.getFullYear() === now.getFullYear();
    if (isThisYear) {
        return date.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Different year
    return date.toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Helper function to format due dates
const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = date.getTime() - now.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    // Overdue
    if (diffInMs < 0) {
        const overdueDays = Math.abs(diffInDays);
        if (overdueDays === 0) return 'Due today';
        if (overdueDays === 1) return 'Due yesterday';
        return `${overdueDays} days overdue`;
    }

    // Today
    if (diffInDays === 0) {
        return `Due today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Tomorrow
    if (diffInDays === 1) {
        return `Due tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // This week
    if (diffInDays < 7) {
        const dayName = date.toLocaleDateString([], { weekday: 'long' });
        return `Due ${dayName} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Future dates
    const isThisYear = date.getFullYear() === now.getFullYear();
    if (isThisYear) {
        return `Due ${date.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`;
    }

    return `Due ${date.toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}`;
};

export default function ActionItems() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<ActionItem | null>(null);
    const [activeTab, setActiveTab] = useState<'todo' | 'completed'>('todo');

    const { data: actionItems = [], isLoading, refetch } = useActionItems();
    const updateActionStatus = useUpdateActionStatus();
    const deleteActionItem = useDeleteActionItem();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            in_progress: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const getPriorityColor = (priority: string) => {
        const colors = {
            low: 'bg-green-100 text-green-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-orange-100 text-orange-800',
            urgent: 'bg-red-100 text-red-800',
        };
        return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    // Filter and sort action items by completion status
    const todoItems = (actionItems || [])
        .filter(item => item.status === 'pending' || item.status === 'in_progress')
        .sort((a, b) => {
            // Sort: in_progress items first, then pending items
            if (a.status === 'in_progress' && b.status === 'pending') return -1;
            if (a.status === 'pending' && b.status === 'in_progress') return 1;
            // Within same status, sort by creation date (newest first)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

    const completedItems = (actionItems || [])
        .filter(item => item.status === 'completed')
        .sort((a, b) => {
            // Sort completed items by completion date (newest first)
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

    const displayedItems = activeTab === 'todo' ? todoItems : completedItems;

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'high':
                return <AlertCircle className="h-4 w-4 text-orange-500" />;
            default:
                return null;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckSquare className="h-4 w-4 text-green-500" />;
            case 'in_progress':
                return <Clock className="h-4 w-4 text-blue-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
        }
    };

    const isOverdue = (dueDate?: string) => {
        return dueDate && new Date(dueDate) < new Date();
    };

    const handleDeleteItem = (item: ActionItem) => {
        console.log('Delete button clicked for item:', item);
        setItemToDelete(item);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            console.log('User confirmed deletion, starting delete operation for item ID:', itemToDelete.id);
            await deleteActionItem.mutateAsync(itemToDelete.id);
            console.log('Delete operation completed successfully');
            setItemToDelete(null);
            // Force a refetch to ensure UI updates
            await refetch();
        } catch (error) {
            console.error('Delete operation failed:', error);
            alert('Failed to delete action item. Please try again.');
        }
    };

    const cancelDelete = () => {
        console.log('Delete operation cancelled by user');
        setItemToDelete(null);
    };

    const handleToggleStatus = async (item: ActionItem) => {
        const newStatus = item.status === 'completed' ? 'pending' : 'completed';
        await updateActionStatus.mutateAsync({
            id: item.id,
            status: newStatus
        });
    };

    const handleStartWork = async (item: ActionItem) => {
        await updateActionStatus.mutateAsync({
            id: item.id,
            status: 'in_progress'
        });
    };

    const handleStopWork = async (item: ActionItem) => {
        await updateActionStatus.mutateAsync({
            id: item.id,
            status: 'pending'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Action Items</h1>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    New Action Item
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('todo')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'todo'
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        To Do
                        {todoItems.length > 0 && (
                            <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
                                {todoItems.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'completed'
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        Completed
                        {completedItems.length > 0 && (
                            <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
                                {completedItems.length}
                            </span>
                        )}
                    </button>
                </nav>
            </div>

            {/* Empty State */}
            {displayedItems.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-gray-400 dark:text-gray-500 mb-4">
                        {activeTab === 'todo' ? (
                            <>
                                <CheckSquare className="h-12 w-12 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No pending action items</h3>
                                <p className="text-gray-500 dark:text-gray-400">Create your first action item to get started!</p>
                            </>
                        ) : (
                            <>
                                <Check className="h-12 w-12 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No completed items yet</h3>
                                <p className="text-gray-500 dark:text-gray-400">Complete some action items to see them here.</p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Action Items List */}
            <div className="space-y-4">
                {displayedItems.map((item) => (
                    <div
                        key={item.id}
                        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6 hover:shadow-md transition-all ${isOverdue(item.dueDate)
                            ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3">
                                {getStatusIcon(item.status)}
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                                    {item.description && (
                                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{item.description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {getPriorityIcon(item.priority)}
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(item.priority)}`}>
                                    {item.priority}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                                    {item.status.replace('_', ' ')}
                                </span>

                                <div className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    <span>{item.assigneeName}</span>
                                </div>

                                {item.dueDate && (
                                    <div className={`flex items-center gap-1 ${isOverdue(item.dueDate) ? 'text-red-500' : ''}`}>
                                        <Calendar className="h-4 w-4" />
                                        <span>{formatDueDate(item.dueDate)}</span>
                                        {isOverdue(item.dueDate) && <span className="text-red-500 font-medium">(Overdue)</span>}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Created {formatDate(item.createdAt)}
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-1 ml-4">
                                    {/* Play button for pending items */}
                                    {item.status === 'pending' && (
                                        <button
                                            onClick={() => handleStartWork(item)}
                                            disabled={updateActionStatus.isPending}
                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors disabled:opacity-50"
                                            title="Start working on this"
                                        >
                                            <Play className="h-4 w-4" />
                                        </button>
                                    )}

                                    {/* Stop button for in-progress items */}
                                    {item.status === 'in_progress' && (
                                        <button
                                            onClick={() => handleStopWork(item)}
                                            disabled={updateActionStatus.isPending}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
                                            title="Stop working on this"
                                        >
                                            <Square className="h-4 w-4" />
                                        </button>
                                    )}

                                    {/* Complete button for non-completed items */}
                                    {item.status !== 'completed' && (
                                        <button
                                            onClick={() => handleToggleStatus(item)}
                                            disabled={updateActionStatus.isPending}
                                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors disabled:opacity-50"
                                            title="Mark as done"
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                    )}

                                    {/* Revert button for completed items */}
                                    {item.status === 'completed' && (
                                        <button
                                            onClick={() => handleToggleStatus(item)}
                                            disabled={updateActionStatus.isPending}
                                            className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-md transition-colors disabled:opacity-50"
                                            title="Mark as pending"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setEditingItem(item)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                        title="Edit action item"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDeleteItem(item);
                                        }}
                                        disabled={deleteActionItem.isPending}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
                                        title="Delete action item"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {(!actionItems || actionItems.length === 0) && (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
                    <CheckSquare className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No action items yet</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">Create your first action item to get started</p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Create Action Item
                    </button>
                </div>
            )}

            <AddActionItemModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />

            {editingItem && (
                <EditActionItemModal
                    isOpen={true}
                    onClose={() => setEditingItem(null)}
                    actionItem={editingItem}
                />
            )}

            {/* Custom Delete Confirmation Modal */}
            {itemToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center mb-4">
                            <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Confirm Deletion
                            </h3>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Are you sure you want to delete "{itemToDelete.title}"?
                            <br />
                            <span className="text-sm text-red-600 dark:text-red-400">
                                This action cannot be undone.
                            </span>
                        </p>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleteActionItem.isPending}
                                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 rounded-md transition-colors"
                            >
                                {deleteActionItem.isPending ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
