import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Plus, CheckSquare, Clock, User, Calendar, AlertCircle, Edit2, Trash2, Check, Play, Square, Archive, Ban, RotateCcw, Search, Filter, Grid, List, Target, ArrowRight, Flame, Zap, Timer, UserCheck, FileText } from 'lucide-react';
import { useActionItems, useUpdateActionStatus, useDeleteActionItem } from '../hooks/useActionItems';
import { peopleService } from '../services/peopleService';
import { formatAvatarSrc } from '../lib/utils';
import type { ActionItem } from '../types';

// Helper function to format dates in a human-readable way for due dates

// Helper function to format dates in a human-readable way for due dates

export default function ActionItems() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [itemToDelete, setItemToDelete] = useState<ActionItem | null>(null);
    const [activeTab, setActiveTab] = useState<'todo' | 'completed' | 'archived'>('todo');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPriority, setSelectedPriority] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'created' | 'updated' | 'priority' | 'dueDate'>('updated');
    const [showHighlight, setShowHighlight] = useState<boolean>(true);
    const [highlightProgress, setHighlightProgress] = useState<number>(100);

    const { data: actionItems = [], isLoading, refetch } = useActionItems();
    const updateActionStatus = useUpdateActionStatus();
    const deleteActionItem = useDeleteActionItem();


    // Fetch people data to get avatars for assignees and associated people
    const { data: peopleResponse } = useQuery({
        queryKey: ['people'],
        queryFn: () => peopleService.getPeople(),
        staleTime: 10 * 60 * 1000, // 10 minutes
    });

    const people = peopleResponse?.success ? peopleResponse.data?.people || [] : [];

    // Handle URL parameters for pre-filling action item creation and highlighting
    const highlightItemId = searchParams.get('highlight');

    // Auto-fadeout highlight after 5 seconds
    useEffect(() => {
        if (highlightItemId) {
            setShowHighlight(true);
            setHighlightProgress(100);

            // Update progress every 100ms for smooth animation
            const progressInterval = setInterval(() => {
                setHighlightProgress(prev => {
                    const newProgress = prev - 2; // 100ms * 50 intervals = 5 seconds
                    if (newProgress <= 0) {
                        clearInterval(progressInterval);
                        return 0;
                    }
                    return newProgress;
                });
            }, 100);

            // Hide highlight after 5 seconds
            const fadeTimer = setTimeout(() => {
                setShowHighlight(false);
            }, 5000);

            return () => {
                clearInterval(progressInterval);
                clearTimeout(fadeTimer);
            };
        } else {
            setShowHighlight(true);
            setHighlightProgress(100);
        }
    }, [highlightItemId]);

    // Automatically switch to the correct tab for highlighted item
    useEffect(() => {
        if (highlightItemId && actionItems && actionItems.length > 0) {
            const highlightedItem = actionItems.find(item => item.id === highlightItemId);
            if (highlightedItem) {
                if (highlightedItem.status === 'pending' || highlightedItem.status === 'in_progress') {
                    setActiveTab('todo');
                } else if (highlightedItem.status === 'completed') {
                    setActiveTab('completed');
                } else if (highlightedItem.status === 'cancelled') {
                    setActiveTab('archived');
                }
            }
        }
    }, [highlightItemId, actionItems]);

    // Scroll to highlighted item
    useEffect(() => {
        if (highlightItemId && actionItems && actionItems.length > 0) {
            const timer = setTimeout(() => {
                const element = document.getElementById(`action-item-${highlightItemId}`);
                if (element) {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }, 300); // Small delay to ensure rendering is complete

            return () => clearTimeout(timer);
        }
    }, [highlightItemId, actionItems, activeTab]); // Added activeTab to dependencies

    useEffect(() => {
        const title = searchParams.get('title');
        const noteId = searchParams.get('noteId');

        if (title || noteId) {
            // Navigate to create page with prefilled values
            const params = new URLSearchParams();
            if (title) params.set('title', title);
            if (noteId) params.set('noteId', noteId);
            navigate(`/action-items/create?${params.toString()}`);

            // Clear the URL parameters
            setSearchParams(prev => {
                const newParams = new URLSearchParams(prev);
                newParams.delete('title');
                newParams.delete('noteId');
                return newParams;
            });
        }
    }, [searchParams, setSearchParams, navigate, highlightItemId]);

    // Helper function to get person data by ID
    const getPersonById = (personId: string | undefined) => {
        if (!personId) return null;
        return people.find(person => person.id === personId) || null;
    };

    // Filter and sort action items
    const filteredAndSortedItems = useMemo(() => {
        if (!actionItems) return [];

        let filtered = actionItems.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.assigneeName.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesPriority = selectedPriority === 'all' || item.priority === selectedPriority;

            return matchesSearch && matchesPriority;
        });

        // Sort items
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'created':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'updated':
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                case 'priority':
                    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                case 'dueDate':
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                default:
                    return 0;
            }
        });

        return filtered;
    }, [actionItems, searchTerm, selectedPriority, sortBy]);

    // Filter items by tab
    const todoItems = filteredAndSortedItems.filter(item => item.status === 'pending' || item.status === 'in_progress');
    const completedItems = filteredAndSortedItems.filter(item => item.status === 'completed');
    const archivedItems = filteredAndSortedItems.filter(item => item.status === 'cancelled');

    const displayedItems = activeTab === 'todo' ? todoItems : activeTab === 'completed' ? completedItems : archivedItems;


    const priorityTypes = [
        { value: 'all', label: 'All Priorities', icon: Target, count: filteredAndSortedItems.length },
        { value: 'urgent', label: 'Urgent', icon: Flame, count: filteredAndSortedItems.filter(i => i.priority === 'urgent').length },
        { value: 'high', label: 'High', icon: Zap, count: filteredAndSortedItems.filter(i => i.priority === 'high').length },
        { value: 'medium', label: 'Medium', icon: Timer, count: filteredAndSortedItems.filter(i => i.priority === 'medium').length },
        { value: 'low', label: 'Low', icon: Clock, count: filteredAndSortedItems.filter(i => i.priority === 'low').length },
    ];

    if (isLoading) {
        return (
            <div className="h-full bg-dark-100 dark:bg-dark-950">
                {/* Enhanced Loading State */}
                <div className="bg-white dark:bg-dark-900 border-b border-dark-300 dark:border-dark-800 shadow-sm">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-dark-300 dark:bg-dark-800 rounded-lg animate-pulse"></div>
                                <div className="w-32 h-8 bg-dark-300 dark:bg-dark-800 rounded animate-pulse"></div>
                            </div>
                            <div className="w-32 h-10 bg-dark-300 dark:bg-dark-800 rounded-lg animate-pulse"></div>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <div className="w-full h-12 bg-dark-300 dark:bg-dark-800 rounded-lg animate-pulse mb-4"></div>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="w-24 h-8 bg-dark-300 dark:bg-dark-800 rounded-lg animate-pulse"></div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white dark:bg-dark-900 rounded-xl border border-dark-300 dark:border-dark-800 p-6 animate-pulse">
                                <div className="w-full h-4 bg-dark-300 dark:bg-dark-800 rounded mb-4"></div>
                                <div className="w-3/4 h-4 bg-dark-300 dark:bg-dark-800 rounded mb-2"></div>
                                <div className="w-1/2 h-4 bg-dark-300 dark:bg-dark-800 rounded mb-4"></div>
                                <div className="w-full h-20 bg-dark-300 dark:bg-dark-800 rounded mb-4"></div>
                                <div className="flex justify-between">
                                    <div className="w-16 h-4 bg-dark-300 dark:bg-dark-800 rounded"></div>
                                    <div className="w-20 h-4 bg-dark-300 dark:bg-dark-800 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700';
            case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border border-blue-200 dark:border-blue-700';
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border border-green-200 dark:border-green-700';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border border-red-200 dark:border-red-700';
            default: return 'bg-dark-200 text-dark-900 dark:bg-dark-950/30 dark:text-dark-300 border border-dark-300 dark:border-dark-800';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border border-red-200 dark:border-red-700';
            case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200 border border-orange-200 dark:border-orange-700';
            case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700';
            case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border border-green-200 dark:border-green-700';
            default: return 'bg-dark-200 text-dark-900 dark:bg-dark-950/30 dark:text-dark-300 border border-dark-300 dark:border-dark-800';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgent': return Flame;
            case 'high': return Zap;
            case 'medium': return Timer;
            case 'low': return Clock;
            default: return Target;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return CheckSquare;
            case 'in_progress': return Clock;
            case 'cancelled': return Ban;
            default: return Target;
        }
    };

    const isOverdue = (dueDate?: string) => {
        return dueDate && new Date(dueDate) < new Date();
    };

    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

        if (diffInDays > 0) {
            return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
        } else if (diffInHours > 0) {
            return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
        } else if (diffInMinutes > 0) {
            return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
        } else {
            return 'Just now';
        }
    };

    const getDueDateText = (dueDate?: string) => {
        if (!dueDate) return null;
        const date = new Date(dueDate);
        const now = new Date();
        const diffInMs = date.getTime() - now.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMs < 0) {
            const overdueDays = Math.abs(diffInDays);
            if (overdueDays === 0) return 'Due today';
            if (overdueDays === 1) return 'Due yesterday';
            return `${overdueDays} days overdue`;
        }

        if (diffInDays === 0) return 'Due today';
        if (diffInDays === 1) return 'Due tomorrow';
        if (diffInDays < 7) return `Due in ${diffInDays} days`;

        return `Due ${date.toLocaleDateString()}`;
    };

    const handleDeleteItem = (item: ActionItem) => {
        setItemToDelete(item);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            await deleteActionItem.mutateAsync(itemToDelete.id);
            setItemToDelete(null);
            // Force a refetch to ensure UI updates
            await refetch();
        } catch (error) {
            console.error('Delete operation failed:', error);
            alert('Failed to delete action item. Please try again.');
        }
    };

    const cancelDelete = () => {
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

    const handleRestoreItem = async (item: ActionItem) => {
        await updateActionStatus.mutateAsync({
            id: item.id,
            status: 'pending'
        });
    };

    return (
        <div className="min-h-full bg-dark-100 dark:bg-dark-950">
            {/* Enhanced Header */}
            <div className="bg-white dark:bg-dark-900 border-b border-dark-300 dark:border-dark-800 shadow-sm">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                                <Target className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-dark-950 dark:text-white">Action Items</h1>
                                <p className="text-sm text-dark-700 dark:text-dark-500">
                                    {displayedItems.length} of {(actionItems || []).length} items
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid'
                                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                                        : 'text-dark-700 dark:text-dark-500 hover:bg-dark-200 dark:hover:bg-dark-800'
                                        }`}
                                >
                                    <Grid className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list'
                                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                                        : 'text-dark-700 dark:text-dark-500 hover:bg-dark-200 dark:hover:bg-dark-800'
                                        }`}
                                >
                                    <List className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="h-6 w-px bg-dark-400 dark:bg-dark-700"></div>

                            <button
                                onClick={() => navigate('/action-items/create')}
                                className="group flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
                                <span className="font-medium">New Action Item</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white dark:bg-dark-900 border-b border-dark-300 dark:border-dark-800">
                <div className="px-6">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('todo')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'todo'
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-dark-600 hover:text-dark-800 dark:text-dark-500 dark:hover:text-dark-400'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                To Do
                                {todoItems.length > 0 && (
                                    <span className="ml-2 bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 py-0.5 px-2 rounded-full text-xs">
                                        {todoItems.length}
                                    </span>
                                )}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'completed'
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-dark-600 hover:text-dark-800 dark:text-dark-500 dark:hover:text-dark-400'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <CheckSquare className="h-4 w-4" />
                                Completed
                                {completedItems.length > 0 && (
                                    <span className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 py-0.5 px-2 rounded-full text-xs">
                                        {completedItems.length}
                                    </span>
                                )}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('archived')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'archived'
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-dark-600 hover:text-dark-800 dark:text-dark-500 dark:hover:text-dark-400'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <Archive className="h-4 w-4" />
                                Archived
                                {archivedItems.length > 0 && (
                                    <span className="ml-2 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 py-0.5 px-2 rounded-full text-xs">
                                        {archivedItems.length}
                                    </span>
                                )}
                            </span>
                        </button>
                    </nav>
                </div>
            </div>

            {/* Search and Filter Section */}
            <div className="bg-white dark:bg-dark-900 border-b border-dark-300 dark:border-dark-800">
                <div className="px-6 py-4">
                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-500" />
                        <input
                            type="text"
                            placeholder="Search action items by title, description, or assignee..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-dark-100 dark:bg-dark-950 border border-dark-300 dark:border-dark-800 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-dark-950 dark:text-white placeholder-dark-600 dark:placeholder-dark-500 transition-all duration-200"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {priorityTypes.map((type) => {
                            const IconComponent = type.icon;
                            return (
                                <button
                                    key={type.value}
                                    onClick={() => setSelectedPriority(type.value)}
                                    className={`group flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${selectedPriority === type.value
                                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm'
                                        : 'text-dark-700 dark:text-dark-500 hover:bg-dark-200 dark:hover:bg-dark-800'
                                        }`}
                                >
                                    <IconComponent className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                    <span className="font-medium">{type.label}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${selectedPriority === type.value
                                        ? 'bg-primary-200 text-primary-800 dark:bg-primary-800 dark:text-primary-200'
                                        : 'bg-dark-300 text-dark-700 dark:bg-dark-800 dark:text-dark-500'
                                        }`}>
                                        {type.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Sort Options */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-dark-500" />
                            <span className="text-sm text-dark-700 dark:text-dark-500">Sort by:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'created' | 'updated' | 'priority' | 'dueDate')}
                                className="text-sm bg-transparent border-0 text-dark-800 dark:text-dark-400 focus:ring-0 cursor-pointer"
                            >
                                <option value="updated">Last Updated</option>
                                <option value="created">Date Created</option>
                                <option value="priority">Priority</option>
                                <option value="dueDate">Due Date</option>
                            </select>
                        </div>

                        {(searchTerm || selectedPriority !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedPriority('all');
                                }}
                                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Items Grid/List */}
            <div className="flex-1 overflow-y-auto p-6">
                {displayedItems.length > 0 ? (
                    <div className={
                        viewMode === 'grid'
                            ? 'grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-4 lg:gap-6'
                            : 'space-y-3 lg:space-y-4'
                    }>
                        {displayedItems.map((item) => {
                            const StatusIcon = getStatusIcon(item.status);
                            const PriorityIcon = getPriorityIcon(item.priority);
                            const assignee = getPersonById(item.assigneeId);
                            const associatedPerson = getPersonById(item.personId);
                            const dueDateText = getDueDateText(item.dueDate);
                            const isItemOverdue = isOverdue(item.dueDate);
                            const isHighlighted = highlightItemId === item.id && showHighlight;

                            return (
                                <Link
                                    key={item.id}
                                    to={`/action-items/${item.id}/edit`}
                                    id={`action-item-${item.id}`}
                                    className={`group bg-white dark:bg-dark-900 rounded-xl border-2 transition-all duration-1000 hover:shadow-lg cursor-pointer block ${isHighlighted
                                        ? 'border-primary-400 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-primary-200/50 dark:shadow-primary-900/30 shadow-lg ring-2 ring-primary-200 dark:ring-primary-800 hover:shadow-primary-300/60 dark:hover:shadow-primary-900/40'
                                        : isItemOverdue
                                            ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20 shadow-red-200/50 dark:shadow-red-900/30 shadow-lg ring-2 ring-red-200 dark:ring-red-800 hover:shadow-red-300/60 dark:hover:shadow-red-900/40'
                                            : 'border-dark-300 dark:border-dark-800 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-primary-500/10'
                                        } ${viewMode === 'grid' ? 'p-6' : 'p-4'}`}
                                >
                                    {viewMode === 'grid' ? (
                                        // Grid View
                                        <div className="h-full flex flex-col">
                                            {/* Highlighted indicator */}
                                            {isHighlighted && (
                                                <div className="mb-3 flex flex-col gap-2 px-3 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg border border-primary-200 dark:border-primary-700 transition-all duration-1000 ease-in-out animate-in slide-in-from-top-2 fade-in">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                                                        <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                                                            {associatedPerson ? `Highlighted from ${associatedPerson.firstName} ${associatedPerson.lastName}'s profile` : 'Highlighted from person profile'}
                                                        </span>
                                                    </div>
                                                    {/* Progress bar showing fadeout countdown */}
                                                    <div className="w-full bg-primary-200 dark:bg-primary-800 rounded-full h-1">
                                                        <div
                                                            className="bg-primary-500 h-1 rounded-full transition-all duration-100 ease-linear"
                                                            style={{ width: `${highlightProgress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-lg flex items-center justify-center">
                                                        <StatusIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                                            {item.status.replace('_', ' ')}
                                                        </span>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                                                            <PriorityIcon className="h-3 w-3 mr-1" />
                                                            {item.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {assignee && (
                                                        <div className="flex items-center gap-1">
                                                            {formatAvatarSrc(assignee.avatarUrl || assignee.avatar) ? (
                                                                <img
                                                                    src={formatAvatarSrc(assignee.avatarUrl || assignee.avatar)!}
                                                                    alt={`${assignee.firstName} ${assignee.lastName}`}
                                                                    className="w-6 h-6 rounded-full object-cover ring-2 ring-primary-100 dark:ring-primary-900"
                                                                    title={`Assigned to ${assignee.firstName} ${assignee.lastName}`}
                                                                />
                                                            ) : (
                                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center ring-2 ring-primary-100 dark:ring-primary-900">
                                                                    <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                                                                        {assignee.firstName[0]}{assignee.lastName[0]}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    <ArrowRight className="h-4 w-4 text-dark-500 group-hover:text-primary-500 transition-all duration-200 transform group-hover:translate-x-1" />
                                                </div>
                                            </div>

                                            <div className="flex-1 mb-4">
                                                <h3 className="font-semibold text-dark-950 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                                                    {item.title}
                                                </h3>
                                                {item.description && (
                                                    <p className="text-sm text-dark-700 dark:text-dark-400 line-clamp-3">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-3 mt-auto">
                                                <div className="flex items-center justify-between text-xs text-dark-600 dark:text-dark-500">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{getRelativeTime(item.updatedAt)}</span>
                                                    </div>
                                                    {dueDateText && (
                                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full font-medium ${isItemOverdue
                                                            ? 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 animate-pulse'
                                                            : item.dueDate && new Date(item.dueDate).getTime() - Date.now() < 24 * 60 * 60 * 1000
                                                                ? 'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/40 border border-orange-300 dark:border-orange-700'
                                                                : 'text-dark-700 dark:text-dark-500'
                                                            }`}>
                                                            <Calendar className="h-3 w-3" />
                                                            <span className="text-xs font-semibold">{dueDateText}</span>
                                                            {isItemOverdue && <span className="text-xs">⚠️</span>}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between text-xs text-dark-600 dark:text-dark-500">
                                                    {assignee && (
                                                        <div className="flex items-center gap-1">
                                                            <UserCheck className="h-3 w-3" />
                                                            <span>{assignee.firstName} {assignee.lastName}</span>
                                                        </div>
                                                    )}
                                                    {associatedPerson && (
                                                        <div className="flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            <span>{associatedPerson.firstName} {associatedPerson.lastName}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Grid View - Note Link */}
                                                <div className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2">
                                                        {item.noteId && (
                                                            <Link
                                                                to={`/notes/${item.noteId}`}
                                                                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 transition-colors bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/40"
                                                                title="View related note"
                                                            >
                                                                <FileText className="h-3 w-3" />
                                                                <span>Note</span>
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons - Always at bottom */}
                                                <div className="flex items-center justify-between pt-3 border-t border-dark-200 dark:border-dark-800">
                                                    <div className="flex items-center gap-1">
                                                        {/* Status action buttons */}
                                                        {item.status === 'pending' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleStartWork(item);
                                                                }}
                                                                disabled={updateActionStatus.isPending}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors disabled:opacity-50"
                                                                title="Start working"
                                                            >
                                                                <Play className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {item.status === 'in_progress' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleStopWork(item);
                                                                }}
                                                                disabled={updateActionStatus.isPending}
                                                                className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-md transition-colors disabled:opacity-50"
                                                                title="Stop working"
                                                            >
                                                                <Square className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {item.status !== 'completed' && item.status !== 'cancelled' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleToggleStatus(item);
                                                                }}
                                                                disabled={updateActionStatus.isPending}
                                                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors disabled:opacity-50"
                                                                title="Mark as completed"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {item.status === 'completed' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleToggleStatus(item);
                                                                }}
                                                                disabled={updateActionStatus.isPending}
                                                                className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-md transition-colors disabled:opacity-50"
                                                                title="Mark as pending"
                                                            >
                                                                <RotateCcw className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {item.status === 'cancelled' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleRestoreItem(item);
                                                                }}
                                                                disabled={updateActionStatus.isPending}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors disabled:opacity-50"
                                                                title="Restore"
                                                            >
                                                                <RotateCcw className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleDeleteItem(item);
                                                            }}
                                                            disabled={deleteActionItem.isPending}
                                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        // List View
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <StatusIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                {assignee && (
                                                    <div className="flex items-center gap-2">
                                                        {formatAvatarSrc(assignee.avatarUrl || assignee.avatar) ? (
                                                            <img
                                                                src={formatAvatarSrc(assignee.avatarUrl || assignee.avatar)!}
                                                                alt={`${assignee.firstName} ${assignee.lastName}`}
                                                                className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-100 dark:ring-primary-900"
                                                                title={`Assigned to ${assignee.firstName} ${assignee.lastName}`}
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center ring-2 ring-primary-100 dark:ring-primary-900">
                                                                <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                                                                    {assignee.firstName[0]}{assignee.lastName[0]}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-dark-950 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                                                        {item.title}
                                                    </h3>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                                                        {item.status.replace('_', ' ')}
                                                    </span>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(item.priority)}`}>
                                                        <PriorityIcon className="h-3 w-3 mr-1" />
                                                        {item.priority}
                                                    </span>
                                                </div>
                                                {item.description && (
                                                    <p className="text-sm text-dark-700 dark:text-dark-400 line-clamp-1">
                                                        {item.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-4 mt-2">
                                                    <div className="flex items-center gap-1 text-xs text-dark-600 dark:text-dark-500">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{getRelativeTime(item.updatedAt)}</span>
                                                    </div>
                                                    {dueDateText && (
                                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full font-medium ${isItemOverdue
                                                            ? 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 animate-pulse'
                                                            : item.dueDate && new Date(item.dueDate).getTime() - Date.now() < 24 * 60 * 60 * 1000
                                                                ? 'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/40 border border-orange-300 dark:border-orange-700'
                                                                : 'text-dark-700 dark:text-dark-500'
                                                            }`}>
                                                            <Calendar className="h-3 w-3" />
                                                            <span className="text-xs font-semibold">{dueDateText}</span>
                                                            {isItemOverdue && <span className="text-xs">⚠️</span>}
                                                        </div>
                                                    )}
                                                    {assignee && (
                                                        <div className="flex items-center gap-1 text-xs text-dark-600 dark:text-dark-500">
                                                            <UserCheck className="h-3 w-3" />
                                                            <span>{assignee.firstName} {assignee.lastName}</span>
                                                        </div>
                                                    )}
                                                    {associatedPerson && (
                                                        <div className="flex items-center gap-1 text-xs text-dark-600 dark:text-dark-500">
                                                            <User className="h-3 w-3" />
                                                            <span>{associatedPerson.firstName} {associatedPerson.lastName}</span>
                                                        </div>
                                                    )}
                                                    {item.noteId && (
                                                        <Link
                                                            to={`/notes/${item.noteId}`}
                                                            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 transition-colors bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/40"
                                                            title="View related note"
                                                        >
                                                            <FileText className="h-3 w-3" />
                                                            <span>Note</span>
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1">
                                                {item.status === 'pending' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleStartWork(item);
                                                        }}
                                                        disabled={updateActionStatus.isPending}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors disabled:opacity-50"
                                                        title="Start working"
                                                    >
                                                        <Play className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {item.status === 'in_progress' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleStopWork(item);
                                                        }}
                                                        disabled={updateActionStatus.isPending}
                                                        className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-md transition-colors disabled:opacity-50"
                                                        title="Stop working"
                                                    >
                                                        <Square className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {item.status !== 'completed' && item.status !== 'cancelled' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleToggleStatus(item);
                                                        }}
                                                        disabled={updateActionStatus.isPending}
                                                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors disabled:opacity-50"
                                                        title="Mark as completed"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {item.status === 'completed' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleToggleStatus(item);
                                                        }}
                                                        disabled={updateActionStatus.isPending}
                                                        className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-md transition-colors disabled:opacity-50"
                                                        title="Mark as pending"
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {item.status === 'cancelled' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleRestoreItem(item);
                                                        }}
                                                        disabled={updateActionStatus.isPending}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors disabled:opacity-50"
                                                        title="Restore"
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleDeleteItem(item);
                                                    }}
                                                    disabled={deleteActionItem.isPending}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    // Empty State
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            {searchTerm || selectedPriority !== 'all' ? (
                                <Search className="h-12 w-12 text-primary-600 dark:text-primary-400" />
                            ) : (
                                <Target className="h-12 w-12 text-primary-600 dark:text-primary-400" />
                            )}
                        </div>

                        <h3 className="text-xl font-semibold text-dark-950 dark:text-white mb-2">
                            {searchTerm || selectedPriority !== 'all' ? 'No action items found' : 'No action items yet'}
                        </h3>

                        <p className="text-dark-700 dark:text-dark-500 mb-6 max-w-md mx-auto">
                            {searchTerm || selectedPriority !== 'all'
                                ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                                : 'Create your first action item to start tracking your tasks and goals.'
                            }
                        </p>

                        <div className="flex items-center justify-center gap-3">
                            {(searchTerm || selectedPriority !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedPriority('all');
                                    }}
                                    className="px-4 py-2 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                >
                                    Clear filters
                                </button>
                            )}
                            <button
                                onClick={() => navigate('/action-items/create')}
                                className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-2 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="font-medium">Create Your First Action Item</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>


            {/* Custom Delete Confirmation Modal */}
            {itemToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-dark-900 rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center mb-4">
                            <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                            <h3 className="text-lg font-semibold text-dark-950 dark:text-white">
                                Confirm Deletion
                            </h3>
                        </div>

                        <p className="text-dark-700 dark:text-dark-400 mb-6">
                            Are you sure you want to delete "{itemToDelete.title}"?
                            <br />
                            <span className="text-sm text-red-600 dark:text-red-400">
                                This action cannot be undone.
                            </span>
                        </p>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 text-dark-700 dark:text-dark-400 hover:bg-dark-200 dark:hover:bg-dark-800 rounded-md transition-colors"
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
