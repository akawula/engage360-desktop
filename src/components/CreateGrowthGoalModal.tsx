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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Goal Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Master React Advanced Patterns"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Describe what you want to achieve and why it's important..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Category *
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Priority *
                            </label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Target Date
                        </label>
                        <input
                            type="date"
                            name="targetDate"
                            value={formData.targetDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Skills */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Related Skills
                    </label>

                    {/* Add skill input */}
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            placeholder="Add a skill..."
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                            className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Milestones
                    </label>

                    {/* Add milestone form */}
                    <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-3">
                        <div>
                            <input
                                type="text"
                                value={newMilestone.title}
                                onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Milestone title..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <textarea
                                value={newMilestone.description}
                                onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Description (optional)..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <div className="space-y-2">
                                <input
                                    type="date"
                                    value={newMilestone.targetDate}
                                    onChange={(e) => setNewMilestone(prev => ({ ...prev, targetDate: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <button
                                    type="button"
                                    onClick={addMilestone}
                                    disabled={!newMilestone.title.trim()}
                                    className="w-full px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                <div key={index} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                                    <div className="flex-shrink-0">
                                        <Target className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {milestone.title}
                                        </p>
                                        {milestone.description && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {milestone.description}
                                            </p>
                                        )}
                                        {milestone.targetDate && (
                                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={createGoalMutation.isPending}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {createGoalMutation.isPending ? 'Creating...' : 'Create Goal'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
