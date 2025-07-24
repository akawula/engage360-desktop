import { useState } from 'react';
import { Plus, Target, TrendingUp, Award, BookOpen, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useGrowthGoals, useGrowthAnalytics, usePersonSkills, useGrowthAssessments } from '../hooks/useGrowth';
import CreateGrowthGoalModal from './CreateGrowthGoalModal';
import GrowthGoalCard from './GrowthGoalCard';
import SkillProgressCard from './SkillProgressCard';

interface GrowthDashboardProps {
    personId: string;
    personName: string;
}

export default function GrowthDashboard({ personId, personName }: GrowthDashboardProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { data: goals = [], isLoading: goalsLoading } = useGrowthGoals(personId);
    const { data: analytics } = useGrowthAnalytics(personId);
    const { data: skills = [] } = usePersonSkills(personId);
    const { data: assessments = [] } = useGrowthAssessments(personId);

    const activeGoals = goals.filter(goal => goal.status === 'in_progress');
    const completedGoals = goals.filter(goal => goal.status === 'completed');
    const upcomingDeadlines = goals
        .filter(goal => goal.targetDate && goal.status !== 'completed')
        .sort((a, b) => new Date(a.targetDate!).getTime() - new Date(b.targetDate!).getTime())
        .slice(0, 3);

    const recentAssessment = assessments.length > 0
        ? assessments.sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime())[0]
        : null;

    if (goalsLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-dark-300 dark:bg-dark-800 rounded w-64 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 bg-dark-300 dark:bg-dark-800 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-dark-950 dark:text-white">
                        {personName}'s Growth Dashboard
                    </h2>
                    <p className="text-dark-700 dark:text-dark-400 mt-1">
                        Track progress, set goals, and develop skills
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Goal
                </button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-dark-900 rounded-lg shadow p-6 transition-colors">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-dark-700 dark:text-dark-500">
                                Active Goals
                            </p>
                            <p className="text-2xl font-bold text-dark-950 dark:text-white">
                                {analytics?.inProgressGoals || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-900 rounded-lg shadow p-6 transition-colors">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                            <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-dark-700 dark:text-dark-500">
                                Completed Goals
                            </p>
                            <p className="text-2xl font-bold text-dark-950 dark:text-white">
                                {analytics?.completedGoals || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-900 rounded-lg shadow p-6 transition-colors">
                    <div className="flex items-center">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-dark-700 dark:text-dark-500">
                                Skills Tracked
                            </p>
                            <p className="text-2xl font-bold text-dark-950 dark:text-white">
                                {analytics?.skillsCount || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-900 rounded-lg shadow p-6 transition-colors">
                    <div className="flex items-center">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-dark-700 dark:text-dark-500">
                                Average Progress
                            </p>
                            <p className="text-2xl font-bold text-dark-950 dark:text-white">
                                {analytics?.averageProgress || 0}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Goals */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-dark-900 rounded-lg shadow transition-colors">
                        <div className="p-6 border-b border-dark-300 dark:border-dark-800">
                            <h3 className="text-lg font-semibold text-dark-950 dark:text-white flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Active Goals
                            </h3>
                        </div>
                        <div className="p-6">
                            {activeGoals.length > 0 ? (
                                <div className="space-y-4">
                                    {activeGoals.map((goal) => (
                                        <GrowthGoalCard key={goal.id} goal={goal} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Target className="h-12 w-12 text-dark-500 mx-auto mb-4" />
                                    <h4 className="text-lg font-medium text-dark-950 dark:text-white mb-2">
                                        No active goals
                                    </h4>
                                    <p className="text-dark-600 dark:text-dark-500 mb-4">
                                        Start setting development goals to track progress
                                    </p>
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Your First Goal
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Upcoming Deadlines */}
                    <div className="bg-white dark:bg-dark-900 rounded-lg shadow transition-colors">
                        <div className="p-6 border-b border-dark-300 dark:border-dark-800">
                            <h3 className="text-lg font-semibold text-dark-950 dark:text-white flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Upcoming Deadlines
                            </h3>
                        </div>
                        <div className="p-6">
                            {upcomingDeadlines.length > 0 ? (
                                <div className="space-y-3">
                                    {upcomingDeadlines.map((goal) => (
                                        <div key={goal.id} className="flex items-center gap-3 p-3 bg-dark-100 dark:bg-dark-800 rounded-lg">
                                            <div className="flex-shrink-0">
                                                <Calendar className="h-4 w-4 text-dark-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-dark-950 dark:text-white truncate">
                                                    {goal.title}
                                                </p>
                                                <p className="text-xs text-dark-600 dark:text-dark-500">
                                                    Due {format(new Date(goal.targetDate!), 'MMM d, yyyy')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-dark-600 dark:text-dark-500 text-sm">
                                    No upcoming deadlines
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Recent Assessment */}
                    {recentAssessment && (
                        <div className="bg-white dark:bg-dark-900 rounded-lg shadow transition-colors">
                            <div className="p-6 border-b border-dark-300 dark:border-dark-800">
                                <h3 className="text-lg font-semibold text-dark-950 dark:text-white flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Latest Assessment
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-dark-700 dark:text-dark-400">
                                            Overall Progress
                                        </span>
                                        <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                                            {recentAssessment.overallProgress}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-dark-300 dark:bg-dark-800 rounded-full h-2">
                                        <div
                                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${recentAssessment.overallProgress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-dark-600 dark:text-dark-500">
                                        Assessed on {format(new Date(recentAssessment.assessmentDate), 'MMM d, yyyy')}
                                    </p>
                                    {recentAssessment.feedback && (
                                        <p className="text-sm text-dark-800 dark:text-dark-400 mt-2">
                                            "{recentAssessment.feedback}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Skills Summary */}
                    <div className="bg-white dark:bg-dark-900 rounded-lg shadow transition-colors">
                        <div className="p-6 border-b border-dark-300 dark:border-dark-800">
                            <h3 className="text-lg font-semibold text-dark-950 dark:text-white flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Skills Overview
                            </h3>
                        </div>
                        <div className="p-6">
                            {skills.length > 0 ? (
                                <div className="space-y-3">
                                    {skills.slice(0, 3).map((skill) => (
                                        <SkillProgressCard key={skill.id} skill={skill} compact />
                                    ))}
                                    {skills.length > 3 && (
                                        <p className="text-sm text-dark-600 dark:text-dark-500 text-center pt-2">
                                            And {skills.length - 3} more skills...
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-dark-600 dark:text-dark-500 text-sm">
                                    No skills tracked yet
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Completed Goals Section */}
            {completedGoals.length > 0 && (
                <div className="bg-white dark:bg-dark-900 rounded-lg shadow transition-colors">
                    <div className="p-6 border-b border-dark-300 dark:border-dark-800">
                        <h3 className="text-lg font-semibold text-dark-950 dark:text-white flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            Recent Achievements
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {completedGoals.slice(0, 6).map((goal) => (
                                <div key={goal.id} className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0">
                                            <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-dark-950 dark:text-white">
                                                {goal.title}
                                            </h4>
                                            {goal.completedDate && (
                                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                                    Completed {format(new Date(goal.completedDate), 'MMM d, yyyy')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <CreateGrowthGoalModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                personId={personId}
            />
        </div>
    );
}
