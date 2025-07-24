import { useState } from 'react';
import { Calendar, CheckCircle, Circle, Edit, MoreHorizontal, Target, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useUpdateGrowthGoal } from '../hooks/useGrowth';
import type { GrowthGoal } from '../types';

interface GrowthGoalCardProps {
    goal: GrowthGoal;
    compact?: boolean;
}

export default function GrowthGoalCard({ goal, compact = false }: GrowthGoalCardProps) {
    const [showMilestones, setShowMilestones] = useState(false);
    const updateGoalMutation = useUpdateGrowthGoal();

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'technical':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'leadership':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            case 'communication':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'business':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            case 'personal':
                return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
            default:
                return 'bg-dark-200 text-dark-900 dark:bg-dark-950 dark:text-dark-300';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'high':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'low':
                return 'bg-dark-200 text-dark-900 dark:bg-dark-950 dark:text-dark-300';
            default:
                return 'bg-dark-200 text-dark-900 dark:bg-dark-950 dark:text-dark-300';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'on_hold':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-dark-200 text-dark-900 dark:bg-dark-950 dark:text-dark-300';
        }
    };

    const handleStatusUpdate = (newStatus: GrowthGoal['status']) => {
        const updates: Partial<GrowthGoal> = { status: newStatus };

        if (newStatus === 'completed') {
            updates.progress = 100;
            updates.completedDate = new Date().toISOString().split('T')[0];
        } else if (newStatus === 'in_progress' && goal.startDate === undefined) {
            updates.startDate = new Date().toISOString().split('T')[0];
        }

        updateGoalMutation.mutate({ id: goal.id, updates });
    };

    const completedMilestones = goal.milestones.filter(m => m.isCompleted).length;
    const totalMilestones = goal.milestones.length;

    if (compact) {
        return (
            <div className="p-4 border border-dark-300 dark:border-dark-800 rounded-lg hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-dark-950 dark:text-white text-sm">
                        {goal.title}
                    </h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(goal.category)}`}>
                        {goal.category}
                    </span>
                </div>

                <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-dark-700 dark:text-dark-400">Progress</span>
                        <span className="font-medium text-dark-950 dark:text-white">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-dark-300 dark:bg-dark-800 rounded-full h-2">
                        <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${goal.progress}%` }}
                        ></div>
                    </div>
                </div>

                {goal.targetDate && (
                    <div className="flex items-center text-xs text-dark-600 dark:text-dark-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        Due {format(new Date(goal.targetDate), 'MMM d, yyyy')}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-6 border border-dark-300 dark:border-dark-800 rounded-lg hover:shadow-md transition-all bg-white dark:bg-dark-900">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-dark-950 dark:text-white">
                            {goal.title}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(goal.category)}`}>
                            {goal.category}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                            {goal.priority}
                        </span>
                    </div>
                    {goal.description && (
                        <p className="text-dark-700 dark:text-dark-400 text-sm">
                            {goal.description}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                        {goal.status.replace('_', ' ')}
                    </span>
                    <button className="p-1 text-dark-500 hover:text-dark-700 dark:hover:text-dark-400">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-dark-800 dark:text-dark-400">Progress</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-dark-950 dark:text-white">{goal.progress}%</span>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                </div>
                <div className="w-full bg-dark-300 dark:bg-dark-800 rounded-full h-3">
                    <div
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                    ></div>
                </div>
            </div>

            {/* Dates */}
            <div className="flex items-center justify-between mb-4 text-sm">
                <div className="flex items-center text-dark-700 dark:text-dark-400">
                    {goal.startDate && (
                        <>
                            <Calendar className="w-4 h-4 mr-1" />
                            Started {format(new Date(goal.startDate), 'MMM d, yyyy')}
                        </>
                    )}
                </div>
                {goal.targetDate && (
                    <div className="flex items-center text-dark-700 dark:text-dark-400">
                        <Target className="w-4 h-4 mr-1" />
                        Due {format(new Date(goal.targetDate), 'MMM d, yyyy')}
                    </div>
                )}
            </div>

            {/* Milestones */}
            {goal.milestones.length > 0 && (
                <div className="mb-4">
                    <button
                        onClick={() => setShowMilestones(!showMilestones)}
                        className="flex items-center justify-between w-full text-sm font-medium text-dark-800 dark:text-dark-400 hover:text-dark-950 dark:hover:text-white"
                    >
                        <span>Milestones ({completedMilestones}/{totalMilestones})</span>
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-1">
                                {goal.milestones.slice(0, 3).map((milestone) => (
                                    <div
                                        key={milestone.id}
                                        className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${milestone.isCompleted
                                                ? 'bg-green-500'
                                                : 'bg-dark-400 dark:bg-dark-700'
                                            }`}
                                    >
                                        {milestone.isCompleted && (
                                            <CheckCircle className="w-3 h-3 text-white" />
                                        )}
                                    </div>
                                ))}
                                {goal.milestones.length > 3 && (
                                    <div className="w-6 h-6 rounded-full border-2 border-white bg-dark-500 flex items-center justify-center text-xs text-white">
                                        +{goal.milestones.length - 3}
                                    </div>
                                )}
                            </div>
                        </div>
                    </button>

                    {showMilestones && (
                        <div className="mt-3 space-y-2">
                            {goal.milestones.map((milestone) => (
                                <div key={milestone.id} className="flex items-center gap-3 p-2 bg-dark-100 dark:bg-dark-800 rounded">
                                    <button className="flex-shrink-0">
                                        {milestone.isCompleted ? (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <Circle className="w-5 h-5 text-dark-500" />
                                        )}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${milestone.isCompleted ? 'line-through text-dark-600' : 'text-dark-950 dark:text-white'}`}>
                                            {milestone.title}
                                        </p>
                                        {milestone.targetDate && (
                                            <p className="text-xs text-dark-600 dark:text-dark-500">
                                                Due: {format(new Date(milestone.targetDate), 'MMM d, yyyy')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Skills */}
            {goal.skills.length > 0 && (
                <div className="mb-4">
                    <span className="text-sm font-medium text-dark-800 dark:text-dark-400 mb-2 block">
                        Skills Developed:
                    </span>
                    <div className="flex flex-wrap gap-1">
                        {goal.skills.map((skill) => (
                            <span
                                key={skill}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-dark-200 text-dark-800 dark:bg-dark-800 dark:text-dark-400"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-dark-300 dark:border-dark-800">
                <div className="flex items-center gap-2">
                    {goal.status !== 'completed' && (
                        <>
                            {goal.status === 'not_started' && (
                                <button
                                    onClick={() => handleStatusUpdate('in_progress')}
                                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                    Start Goal
                                </button>
                            )}
                            {goal.status === 'in_progress' && (
                                <button
                                    onClick={() => handleStatusUpdate('completed')}
                                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                >
                                    Mark Complete
                                </button>
                            )}
                        </>
                    )}
                </div>

                <button className="flex items-center gap-1 px-3 py-1 text-xs text-dark-700 dark:text-dark-500 hover:text-dark-950 dark:hover:text-white">
                    <Edit className="w-3 h-3" />
                    Edit
                </button>
            </div>
        </div>
    );
}
