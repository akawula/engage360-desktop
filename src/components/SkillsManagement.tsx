import { useState } from 'react';
import { Plus, Search, Star, TrendingUp } from 'lucide-react';
import { usePersonSkills, useSkills, useCreatePersonSkill, useUpdatePersonSkill } from '../hooks/useGrowth';
import { formatAvatarSrc } from '../lib/utils';
import type { PersonSkill } from '../types';

interface SkillsManagementProps {
    personId: string;
    personName: string;
    personAvatar?: string;
}

export default function SkillsManagement({ personId, personName, personAvatar }: SkillsManagementProps) {
    const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newSkillData, setNewSkillData] = useState({
        skillId: '',
        currentLevel: 1 as 1 | 2 | 3 | 4 | 5,
        targetLevel: 3 as 1 | 2 | 3 | 4 | 5,
        notes: ''
    });

    const { data: personSkills = [], isLoading } = usePersonSkills(personId);
    const { data: allSkills = [] } = useSkills();
    const createSkillMutation = useCreatePersonSkill();
    const updateSkillMutation = useUpdatePersonSkill();

    const availableSkills = allSkills.filter(skill =>
        !personSkills.some(ps => ps.skillId === skill.id) &&
        skill.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700';
            case 'soft':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-700';
            case 'leadership':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-700';
            case 'domain':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-700';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200 dark:border-gray-700';
        }
    };

    const renderStars = (level: number, isTarget = false, onChange?: (level: number) => void) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${onChange ? 'cursor-pointer hover:scale-110 transition-transform' : ''
                            } ${star <= level
                                ? isTarget
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-primary-500 fill-primary-500'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                        onClick={() => onChange && onChange(star as 1 | 2 | 3 | 4 | 5)}
                    />
                ))}
            </div>
        );
    };

    const handleAddSkill = () => {
        if (newSkillData.skillId) {
            createSkillMutation.mutate({
                personId,
                skillId: newSkillData.skillId,
                currentLevel: newSkillData.currentLevel,
                targetLevel: newSkillData.targetLevel,
                notes: newSkillData.notes || undefined
            }, {
                onSuccess: () => {
                    setIsAddSkillOpen(false);
                    setNewSkillData({
                        skillId: '',
                        currentLevel: 1,
                        targetLevel: 3,
                        notes: ''
                    });
                }
            });
        }
    };

    const handleLevelUpdate = (skillId: string, field: 'currentLevel' | 'targetLevel', value: number) => {
        updateSkillMutation.mutate({
            id: skillId,
            updates: { [field]: value }
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
                <div className="flex items-center gap-4">
                    {formatAvatarSrc(personAvatar) ? (
                        <img
                            src={formatAvatarSrc(personAvatar)!}
                            alt={personName}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                                {personName.split(' ').map(n => n[0]).join('')}
                            </span>
                        </div>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {personName}'s Skills
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Track and develop technical and soft skills
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAddSkillOpen(true)}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Skill
                </button>
            </div>

            {/* Skills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {personSkills.map((personSkill) => (
                    <SkillCard
                        key={personSkill.id}
                        personSkill={personSkill}
                        onLevelUpdate={handleLevelUpdate}
                        renderStars={renderStars}
                        getCategoryColor={getCategoryColor}
                        getSkillLevelLabel={getSkillLevelLabel}
                    />
                ))}

                {personSkills.length === 0 && (
                    <div className="col-span-full text-center py-12">
                        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No skills tracked yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            Start tracking skills to monitor development progress
                        </p>
                        <button
                            onClick={() => setIsAddSkillOpen(true)}
                            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Skill
                        </button>
                    </div>
                )}
            </div>

            {/* Add Skill Modal */}
            {isAddSkillOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Add New Skill
                                </h3>
                                <button
                                    onClick={() => setIsAddSkillOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Search Skills */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Search Skills
                                    </label>
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search for skills..."
                                            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                {/* Skill Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Select Skill
                                    </label>
                                    <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md">
                                        {availableSkills.map((skill) => (
                                            <button
                                                key={skill.id}
                                                onClick={() => setNewSkillData(prev => ({ ...prev, skillId: skill.id }))}
                                                className={`w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 last:border-b-0 ${newSkillData.skillId === skill.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-white">
                                                            {skill.name}
                                                        </div>
                                                        {skill.description && (
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {skill.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(skill.category)}`}>
                                                        {skill.category}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                        {availableSkills.length === 0 && (
                                            <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                                                {searchTerm ? 'No skills found matching your search' : 'No available skills to add'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Current Level */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Current Level
                                    </label>
                                    <div className="flex items-center gap-4">
                                        {renderStars(newSkillData.currentLevel, false, (level) =>
                                            setNewSkillData(prev => ({ ...prev, currentLevel: level as 1 | 2 | 3 | 4 | 5 }))
                                        )}
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {getSkillLevelLabel(newSkillData.currentLevel)}
                                        </span>
                                    </div>
                                </div>

                                {/* Target Level */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Target Level
                                    </label>
                                    <div className="flex items-center gap-4">
                                        {renderStars(newSkillData.targetLevel, true, (level) =>
                                            setNewSkillData(prev => ({ ...prev, targetLevel: level as 1 | 2 | 3 | 4 | 5 }))
                                        )}
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {getSkillLevelLabel(newSkillData.targetLevel)}
                                        </span>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={newSkillData.notes}
                                        onChange={(e) => setNewSkillData(prev => ({ ...prev, notes: e.target.value }))}
                                        rows={3}
                                        placeholder="Add any notes about this skill..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setIsAddSkillOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddSkill}
                                    disabled={!newSkillData.skillId || createSkillMutation.isPending}
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {createSkillMutation.isPending ? 'Adding...' : 'Add Skill'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface SkillCardProps {
    personSkill: PersonSkill;
    onLevelUpdate: (skillId: string, field: 'currentLevel' | 'targetLevel', value: number) => void;
    renderStars: (level: number, isTarget?: boolean, onChange?: (level: number) => void) => JSX.Element;
    getCategoryColor: (category: string) => string;
    getSkillLevelLabel: (level: number) => string;
}

function SkillCard({
    personSkill,
    onLevelUpdate,
    renderStars,
    getCategoryColor,
    getSkillLevelLabel
}: SkillCardProps) {
    const progressPercentage = Math.min((personSkill.currentLevel / personSkill.targetLevel) * 100, 100);
    const isTargetExceeded = personSkill.currentLevel > personSkill.targetLevel;
    const isTargetMet = personSkill.currentLevel >= personSkill.targetLevel; return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {personSkill.skill.name}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(personSkill.skill.category)}`}>
                            {personSkill.skill.category}
                        </span>
                    </div>
                    {personSkill.skill.description && (
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            {personSkill.skill.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {isTargetMet ? 'Target Achievement' : 'Progress to Target'}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isTargetExceeded ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                            {Math.round(progressPercentage)}%
                        </span>
                        {isTargetExceeded && (
                            <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full">
                                Exceeded!
                            </span>
                        )}
                        {isTargetMet && !isTargetExceeded && (
                            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full">
                                Achieved!
                            </span>
                        )}
                    </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all duration-500 ${isTargetExceeded
                                ? 'bg-gradient-to-r from-green-500 to-green-600'
                                : isTargetMet
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                    : 'bg-gradient-to-r from-primary-500 to-primary-600'
                            }`}
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>            {/* Skill Levels */}
            <div className="space-y-3 mb-4">
                <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current Level</div>
                    <div className="flex items-center gap-3">
                        {renderStars(personSkill.currentLevel, false, (level) =>
                            onLevelUpdate(personSkill.id, 'currentLevel', level)
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {getSkillLevelLabel(personSkill.currentLevel)}
                        </span>
                    </div>
                </div>
                <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Target Level</div>
                    <div className="flex items-center gap-3">
                        {renderStars(personSkill.targetLevel, true, (level) =>
                            onLevelUpdate(personSkill.id, 'targetLevel', level)
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {getSkillLevelLabel(personSkill.targetLevel)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Notes */}
            {personSkill.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Notes</div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        {personSkill.notes}
                    </p>
                </div>
            )}
        </div>
    );
}
