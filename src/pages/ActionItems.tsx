import { useState } from 'react';
import { Plus, CheckSquare, Clock, User, Calendar, AlertCircle, Edit2, Trash2, Check, X } from 'lucide-react';
import { useActionItems, useUpdateActionStatus, useDeleteActionItem } from '../hooks/useActionItems';
import AddActionItemModal from '../components/AddActionItemModal';
import EditActionItemModal from '../components/EditActionItemModal';
import type { ActionItem } from '../types';

export default function ActionItems() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ActionItem | null>(null);

    const { data: actionItems = [], isLoading } = useActionItems();
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

    const handleDeleteItem = async (item: ActionItem) => {
        if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
            await deleteActionItem.mutateAsync(item.id);
        }
    };

    const handleToggleStatus = async (item: ActionItem) => {
        const newStatus = item.status === 'completed' ? 'pending' : 'completed';
        await updateActionStatus.mutateAsync({
            id: item.id,
            status: newStatus
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

            <div className="space-y-4">
                {actionItems?.map((item) => (
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
                                        <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                                        {isOverdue(item.dueDate) && <span className="text-red-500 font-medium">(Overdue)</span>}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Created: {new Date(item.createdAt).toLocaleDateString()}
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-1 ml-4">
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
                                        onClick={() => handleDeleteItem(item)}
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
        </div>
    );
}
