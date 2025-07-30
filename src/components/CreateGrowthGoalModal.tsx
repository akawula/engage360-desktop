import { useState } from 'react';
import { X, Plus, Calendar, Target } from 'lucide-react';
import Modal from './Modal';
import { useCreateGrowthGoal } from '../hooks/useGrowth';
import type { CreateGrowthGoalRequest } from '../types';

interface CreateGrowthGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    personId: string;
}

interface MilestoneInput {
    title: string;
    description?: string;
    targetDate?: string;
    order: number;
    isCompleted: boolean;
}

export default function CreateGrowthGoalModal({ isOpen, onClose, personId }: CreateGrowthGoalModalProps) {
    const [formData, setFormData] = useState<Omit<CreateGrowthGoalRequest, 'personId'>>({
        title: '',
        description: '',
        category: 'technical',
        priority: 'medium',
        targetDate: '',
        skills: [],
        milestones: []
    });

    const [newSkill, setNewSkill] = useState('');
    const [newMilestone, setNewMilestone] = useState<MilestoneInput>({
        title: '',
        description: '',
        targetDate: '',
        order: 1,
        isCompleted: false
    });

    const createGoalMutation = useCreateGrowthGoal();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const goalData: CreateGrowthGoalRequest = {
            ...formData,
            personId,
            milestones: formData.milestones?.map((milestone, index) => ({
                ...milestone,
                order: index + 1,
                isCompleted: false
            }))
        };

        createGoalMutation.mutate(goalData, {
            onSuccess: (response) => {
                if (response.success) {
                    onClose();
                    // Reset form
                    setFormData({
                        title: '',
                        description: '',
                        category: 'technical',
                        priority: 'medium',
                        targetDate: '',
                        skills: [],
                        milestones: []
                    });
                    setNewSkill('');
                    setNewMilestone({
                        title: '',
                        description: '',
                        targetDate: '',
                        order: 1,
                        isCompleted: false
                    });
                }
            }
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addSkill = () => {
        if (newSkill.trim() && !formData.skills?.includes(newSkill.trim())) {
            setFormData(prev => ({
                ...prev,
                skills: [...(prev.skills || []), newSkill.trim()]
            }));
            setNewSkill('');
        }
    };

    const removeSkill = (skillToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills?.filter(skill => skill !== skillToRemove)
        }));
    };

    const addMilestone = () => {
        if (newMilestone.title.trim()) {
            const milestone: MilestoneInput = {
                ...newMilestone,
                order: (formData.milestones?.length || 0) + 1
            };

            setFormData(prev => ({
                ...prev,
                milestones: [...(prev.milestones || []), milestone]
            }));

            setNewMilestone({
                title: '',
                description: '',
                targetDate: '',
                order: 1,
                isCompleted: false
            });
        }
    };

    const removeMilestone = (index: number) => {
        setFormData(prev => ({
            ...prev,
            milestones: prev.milestones?.filter((_, i) => i !== index)
        }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Growth Goal">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-1">
                            Goal Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Master React Advanced Patterns"
                            className="w-full px-3 py-3 xs:py-2 text-base xs:text-sm min-h-[44px] xs:min-h-[40px] border border-dark-400 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-dark-950 dark:text-white touch-manipulation"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-1">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Describe what you want to achieve and why it's important..."
                            className="w-full px-3 py-3 xs:py-2 text-base xs:text-sm min-h-[88px] xs:min-h-[80px] border border-dark-400 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-dark-950 dark:text-white touch-manipulation"
                        />
                    </div>

                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-1">
                                Category *
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-3 xs:py-2 text-base xs:text-sm min-h-[44px] xs:min-h-[40px] border border-dark-400 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-dark-950 dark:text-white touch-manipulation"
                            >
                                <option value="technical">Technical</option>
                                <option value="leadership">Leadership</option>
                                <option value="communication">Communication</option>
                                <option value="business">Business</option>
                                <option value="personal">Personal</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-1">
                                Priority *
                            </label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-3 xs:py-2 text-base xs:text-sm min-h-[44px] xs:min-h-[40px] border border-dark-400 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-dark-950 dark:text-white touch-manipulation"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-1">
                            Target Date
                        </label>
                        <input
                            type="date"
                            name="targetDate"
                            value={formData.targetDate}
                            onChange={handleChange}
                            className="w-full px-3 py-3 xs:py-2 text-base xs:text-sm min-h-[44px] xs:min-h-[40px] border border-dark-400 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-dark-950 dark:text-white touch-manipulation"
                        />
                    </div>
                </div>

                {/* Skills */}
                <div>
                    <label className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-2">
                        Related Skills
                    </label>

                    {/* Add skill input */}
                    <div className="flex flex-col xs:flex-row gap-2 mb-3">
                        <input
                            type="text"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            placeholder="Add a skill..."
                            className="flex-1 px-3 py-3 xs:py-2 text-base xs:text-sm min-h-[44px] xs:min-h-[40px] border border-dark-400 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-dark-950 dark:text-white touch-manipulation"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addSkill();
                                }
                            }}
                        />
                        <button
                            type="button"
                            onClick={addSkill}
                            className="w-full xs:w-auto px-3 py-3 xs:py-2 text-base xs:text-sm min-h-[44px] xs:min-h-[40px] bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors touch-manipulation"
                        >
                            <Plus className="w-4 h-4 xs:mr-0 mr-2" />
                            <span className="xs:hidden">Add Skill</span>
                        </button>
                    </div>

                    {/* Display added skills */}
                    {formData.skills && formData.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {formData.skills.map((skill) => (
                                <span
                                    key={skill}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                                >
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={() => removeSkill(skill)}
                                        className="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Milestones */}
                <div>
                    <label className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-2">
                        Milestones
                    </label>

                    {/* Add milestone form */}
                    <div className="space-y-3 p-4 bg-dark-100 dark:bg-dark-800 rounded-lg mb-3">
                        <div>
                            <input
                                type="text"
                                value={newMilestone.title}
                                onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Milestone title..."
                                className="w-full px-3 py-3 xs:py-2 text-base xs:text-sm min-h-[44px] xs:min-h-[40px] border border-dark-400 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-dark-950 dark:text-white touch-manipulation"
                            />
                        </div>
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                            <textarea
                                value={newMilestone.description}
                                onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Description (optional)..."
                                rows={2}
                                className="w-full px-3 py-3 xs:py-2 text-base xs:text-sm min-h-[66px] xs:min-h-[60px] border border-dark-400 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-dark-950 dark:text-white touch-manipulation"
                            />
                            <div className="space-y-2">
                                <input
                                    type="date"
                                    value={newMilestone.targetDate}
                                    onChange={(e) => setNewMilestone(prev => ({ ...prev, targetDate: e.target.value }))}
                                    className="w-full px-3 py-3 xs:py-2 text-base xs:text-sm min-h-[44px] xs:min-h-[40px] border border-dark-400 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-dark-950 dark:text-white touch-manipulation"
                                />
                                <button
                                    type="button"
                                    onClick={addMilestone}
                                    disabled={!newMilestone.title.trim()}
                                    className="w-full px-3 py-3 xs:py-2 text-base xs:text-sm min-h-[44px] xs:min-h-[40px] bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                                >
                                    Add Milestone
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Display added milestones */}
                    {formData.milestones && formData.milestones.length > 0 && (
                        <div className="space-y-2">
                            {formData.milestones.map((milestone, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-white dark:bg-dark-900 border border-dark-300 dark:border-dark-700 rounded-lg">
                                    <div className="flex-shrink-0">
                                        <Target className="w-4 h-4 text-dark-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-dark-950 dark:text-white">
                                            {milestone.title}
                                        </p>
                                        {milestone.description && (
                                            <p className="text-xs text-dark-600 dark:text-dark-500">
                                                {milestone.description}
                                            </p>
                                        )}
                                        {milestone.targetDate && (
                                            <div className="flex items-center gap-1 text-xs text-dark-600 dark:text-dark-500 mt-1">
                                                <Calendar className="w-3 h-3" />
                                                Due: {new Date(milestone.targetDate).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeMilestone(index)}
                                        className="flex-shrink-0 text-red-500 hover:text-red-700"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submit Buttons */}
                <div className="flex flex-col xs:flex-row items-center justify-end space-y-3 xs:space-y-0 xs:space-x-3 pt-6 border-t border-dark-300 dark:border-dark-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full xs:w-auto px-4 py-3 xs:py-2 text-base xs:text-sm min-h-[44px] xs:min-h-[40px] font-medium text-dark-800 dark:text-dark-400 bg-white dark:bg-dark-800 border border-dark-400 dark:border-dark-700 rounded-md hover:bg-dark-100 dark:hover:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors touch-manipulation"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={createGoalMutation.isPending}
                        className="w-full xs:w-auto px-4 py-3 xs:py-2 text-base xs:text-sm min-h-[44px] xs:min-h-[40px] font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                    >
                        {createGoalMutation.isPending ? 'Creating...' : 'Create Goal'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
