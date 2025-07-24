import { useState } from 'react';
import { X } from 'lucide-react';
import Modal from './Modal';
import { useCreatePerson } from '../hooks/usePeople';
import AvatarInput from './AvatarInput';
import type { CreatePersonRequest } from '../types';

interface AddPersonModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddPersonModal({ isOpen, onClose }: AddPersonModalProps) {
    const [formData, setFormData] = useState<CreatePersonRequest>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        position: '',
        githubUsername: '',
        tags: [],
        avatarUrl: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const createPersonMutation = useCreatePerson();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const personData: CreatePersonRequest = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone || undefined,
                position: formData.position || undefined,
                githubUsername: formData.githubUsername || undefined,
                tags: formData.tags,
                avatarUrl: formData.avatarUrl || undefined,
            };

            createPersonMutation.mutate(personData, {
                onSuccess: (response) => {
                    if (response.success) {
                        console.log('Person created successfully:', response.data);
                        onClose();
                        // Reset form
                        setFormData({
                            firstName: '',
                            lastName: '',
                            email: '',
                            phone: '',
                            position: '',
                            githubUsername: '',
                            tags: [],
                            avatarUrl: '',
                        });
                        setTagInput('');
                    } else {
                        alert('Failed to create person. Please try again.');
                    }
                },
                onError: (error) => {
                    console.error('Error creating person:', error);
                    alert(`Error creating person: ${error instanceof Error ? error.message : 'Unknown error'}`);
                },
            });
        } catch (error) {
            console.error('Error creating person:', error);
            alert(`Error creating person: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAvatarChange = (avatar: string | null) => {
        setFormData(prev => ({
            ...prev,
            avatarUrl: avatar || ''
        }));
    };

    const [tagInput, setTagInput] = useState('');

    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTagInput(e.target.value);
    };

    const addTag = (tag: string) => {
        const trimmedTag = tag.trim();
        if (trimmedTag && !(formData.tags || []).includes(trimmedTag)) {
            setFormData(prev => ({
                ...prev,
                tags: [...(prev.tags || []), trimmedTag]
            }));
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
        }));
    };

    const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag(tagInput);
            setTagInput('');
        } else if (e.key === ',') {
            e.preventDefault();
            addTag(tagInput);
            setTagInput('');
        }
    };

    const handleTagBlur = () => {
        if (tagInput.trim()) {
            addTag(tagInput);
            setTagInput('');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Person">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-1">
                            First Name *
                        </label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-dark-400 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-dark-950 dark:text-white"
                        />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-1">
                            Last Name *
                        </label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-dark-400 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-dark-950 dark:text-white"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-1">
                        Email *
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-dark-400 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-dark-950 dark:text-white"
                    />
                </div>

                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-1">
                        Phone
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-dark-400 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-dark-950 dark:text-white"
                    />
                </div>

                <div>
                    <label htmlFor="githubUsername" className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-1">
                        GitHub Username
                    </label>
                    <input
                        type="text"
                        id="githubUsername"
                        name="githubUsername"
                        value={formData.githubUsername}
                        onChange={handleChange}
                        placeholder="e.g., octocat"
                        className="w-full px-3 py-2 border border-dark-400 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-dark-950 dark:text-white"
                    />
                </div>

                <div>
                    <label htmlFor="position" className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-1">
                        Position
                    </label>
                    <input
                        type="text"
                        id="position"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-dark-400 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-dark-950 dark:text-white"
                    />
                </div>

                {/* Avatar Input */}
                <AvatarInput
                    value={formData.avatarUrl}
                    onChange={handleAvatarChange}
                    size="md"
                    label="Avatar"
                    placeholder="Enter image URL"
                />

                <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-1">
                        Tags
                    </label>

                    {/* Display existing tags as chips */}
                    {formData.tags && formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {formData.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Input for adding new tags */}
                    <input
                        type="text"
                        id="tags"
                        name="tags"
                        value={tagInput}
                        onChange={handleTagsChange}
                        onKeyPress={handleTagKeyPress}
                        onBlur={handleTagBlur}
                        placeholder="Type and press Enter or comma to add tags"
                        className="w-full px-3 py-2 border border-dark-400 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-dark-950 dark:text-white"
                    />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-dark-800 dark:text-dark-400 bg-white dark:bg-dark-900 border border-dark-400 dark:border-dark-700 rounded-md hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Person'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
