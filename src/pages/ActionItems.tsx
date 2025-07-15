import { useQuery } from '@tanstack/react-query';
import { Plus, CheckSquare, Clock, User, Calendar, AlertCircle } from 'lucide-react';
import { actionItemsService } from '../services/actionItemsService';

export default function ActionItems() {
    const { data: actionItems = [], isLoading } = useQuery({
        queryKey: ['actionItems'],
        queryFn: async () => {
            const response = await actionItemsService.getActionItems();
            return response.success ? response.data : [];
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 15 * 60 * 1000, // 15 minutes cache
    });

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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Action Items</h1>
                <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Action Item
                </button>
            </div>

            <div className="space-y-4">
                {actionItems.map((item) => (
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

                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Created: {new Date(item.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {actionItems.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
                    <CheckSquare className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No action items yet</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">Create your first action item to get started</p>
                    <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                        Create Action Item
                    </button>
                </div>
            )}
        </div>
    );
}
