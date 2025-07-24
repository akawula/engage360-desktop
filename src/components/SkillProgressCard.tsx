import { TrendingUp, Star } from 'lucide-react';
import { format } from 'date-fns';
import type { PersonSkill } from '../types';

interface SkillProgressCardProps {
    skill: PersonSkill;
    compact?: boolean;
}

export default function SkillProgressCard({ skill, compact = false }: SkillProgressCardProps) {
    const getSkillLevelLabel = (level: number) => {
        switch (level) {
            case 1: return 'Beginner';
            case 2: return 'Novice';
            case 3: return 'Intermediate';
            case 4: return 'Advanced';
            case 5: return 'Expert';
            default: return 'Unknown';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'technical':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'soft':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'leadership':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            case 'domain':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            default:
                return 'bg-dark-200 text-dark-900 dark:bg-dark-950 dark:text-dark-300';
        }
    };

    const renderStars = (level: number, isTarget = false) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-3 h-3 ${star <= level
                                ? isTarget
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-primary-500 fill-primary-500'
                                : 'text-dark-400 dark:text-dark-700'
                            }`}
                    />
                ))}
            </div>
        );
    };

    const progressPercentage = (skill.currentLevel / skill.targetLevel) * 100;

    if (compact) {
        return (
            <div className="flex items-center justify-between p-2 bg-dark-100 dark:bg-dark-800 rounded">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-dark-950 dark:text-white truncate">
                            {skill.skill.name}
                        </p>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getCategoryColor(skill.skill.category)}`}>
                            {skill.skill.category}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs text-dark-700 dark:text-dark-400">
                            <span>Current:</span>
                            {renderStars(skill.currentLevel)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-dark-700 dark:text-dark-400">
                            <span>Target:</span>
                            {renderStars(skill.targetLevel, true)}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white dark:bg-dark-900 rounded-lg shadow transition-colors">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-dark-950 dark:text-white">
                            {skill.skill.name}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(skill.skill.category)}`}>
                            {skill.skill.category}
                        </span>
                    </div>
                    {skill.skill.description && (
                        <p className="text-dark-700 dark:text-dark-400 text-sm">
                            {skill.skill.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Progress Overview */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-dark-800 dark:text-dark-400">
                        Progress to Target
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-dark-950 dark:text-white">
                            {Math.round(progressPercentage)}%
                        </span>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                </div>
                <div className="w-full bg-dark-300 dark:bg-dark-800 rounded-full h-3">
                    <div
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>

            {/* Skill Levels */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-dark-100 dark:bg-dark-800 rounded-lg">
                    <div className="text-xs text-dark-700 dark:text-dark-500 mb-1">Current Level</div>
                    <div className="flex items-center gap-2">
                        {renderStars(skill.currentLevel)}
                        <span className="text-sm font-medium text-dark-950 dark:text-white">
                            {getSkillLevelLabel(skill.currentLevel)}
                        </span>
                    </div>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-xs text-dark-700 dark:text-dark-500 mb-1">Target Level</div>
                    <div className="flex items-center gap-2">
                        {renderStars(skill.targetLevel, true)}
                        <span className="text-sm font-medium text-dark-950 dark:text-white">
                            {getSkillLevelLabel(skill.targetLevel)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Last Assessment */}
            {skill.lastAssessmentDate && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Last Assessment</div>
                    <div className="text-sm text-dark-950 dark:text-white">
                        {format(new Date(skill.lastAssessmentDate), 'MMM d, yyyy')}
                    </div>
                </div>
            )}

            {/* Notes */}
            {skill.notes && (
                <div className="mb-4">
                    <div className="text-xs text-dark-700 dark:text-dark-500 mb-1">Notes</div>
                    <p className="text-sm text-dark-800 dark:text-dark-400">
                        {skill.notes}
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-dark-300 dark:border-dark-800">
                <button className="px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors">
                    Update Assessment
                </button>
                <button className="px-3 py-1 text-xs text-dark-700 dark:text-dark-500 hover:text-dark-950 dark:hover:text-white">
                    Edit Skill
                </button>
            </div>
        </div>
    );
}
