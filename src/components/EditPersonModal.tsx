import { useState, useEffect } from 'react';
import { X, Upload, User } from 'lucide-react';
import Modal from './Modal';
import { Person } from '../types';
import { useUpdatePerson } from '../hooks/usePeople';
import { validateImageFile, resizeImage } from '../lib/imageUtils';

interface EditPersonModalProps {
    isOpen: boolean;
    onClose: () => void;
    person: Person;
}

export default function EditPersonModal({ isOpen, onClose, person }: EditPersonModalProps) {
    const [formData, setFormData] = useState({
        firstName: person.firstName,
        lastName: person.lastName,
        email: person.email,
        phone: person.phone || '',
        position: person.position || '',
        githubUsername: person.githubUsername || '',
        tags: person.tags || [],
        avatarUrl: person.avatarUrl || '',
    });

    const [tagInput, setTagInput] = useState('');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(person.avatarUrl || null);
    const [avatarError, setAvatarError] = useState<string | null>(null);

    const mutation = useUpdatePerson();

    // Update form data when person prop changes (after successful update)
    useEffect(() => {
        setFormData({
            firstName: person.firstName,
            lastName: person.lastName,
            email: person.email,
            phone: person.phone || '',
            position: person.position || '',
            githubUsername: person.githubUsername || '',
            tags: person.tags || [],
            avatarUrl: person.avatarUrl || '',
        });
        setAvatarPreview(person.avatarUrl || null);
    }, [person]);

    const addTag = (tag: string) => {
        const trimmedTag = tag.trim();
        if (trimmedTag && !formData.tags.includes(trimmedTag)) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, trimmedTag]
            }));
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAvatarError(null);

        // Validate the file
        const validation = validateImageFile(file);
        if (!validation.isValid) {
            setAvatarError(validation.error || 'Invalid file');
            return;
        } try {
            // Resize and convert to base64 (100x100 square)
            const base64Avatar = await resizeImage(file, 100);

            setAvatarPreview(base64Avatar);
            setFormData(prev => ({
                ...prev,
                avatarUrl: base64Avatar
            }));
        } catch (error) {
            console.error('Error processing avatar:', error);
            setAvatarError('Failed to process image. Please try again.');
        }
    };

    const removeAvatar = () => {
        setAvatarPreview(null);
        setAvatarError(null);
        setFormData(prev => ({
            ...prev,
            avatarUrl: ''
        }));
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTagInput(e.target.value);
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate({
            id: person.id,
            updates: {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone || undefined,
                position: formData.position || undefined,
                githubUsername: formData.githubUsername || undefined,
                tags: formData.tags.length > 0 ? formData.tags : undefined,
                avatarUrl: formData.avatarUrl || undefined,
            }
        }, {
            onSuccess: (response) => {
                if (response.success) {
                    console.log('Person updated successfully:', response.data);
                    onClose();
                } else {
                    console.error('Failed to update person:', response.error);
                }
            },
            onError: (error) => {
                console.error('Error updating person:', error);
            },
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Person">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            First Name *
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Last Name *
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email *
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        GitHub Username
                    </label>
                    <input
                        type="text"
                        name="githubUsername"
                        value={formData.githubUsername}
                        onChange={handleChange}
                        placeholder="e.g., octocat"
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Position
                    </label>
                    <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                {/* Avatar Upload Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Avatar
                    </label>
                    <div className="flex items-start gap-4">
                        {/* Avatar Preview */}
                        <div className="flex-shrink-0">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="Avatar preview"
                                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                                    <User className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                                </div>
                            )}
                        </div>

                        {/* Upload Controls */}
                        <div className="flex-1">
                            <div className="flex gap-2 mb-2">
                                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                    <Upload className="h-4 w-4" />
                                    <span className="text-sm">Choose Image</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                </label>
                                {avatarPreview && (
                                    <button
                                        type="button"
                                        onClick={removeAvatar}
                                        className="px-4 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Upload a JPEG, PNG, GIF, or WebP image (max 5MB). Image will be resized to 100x100px.
                            </p>
                            {avatarError && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    {avatarError}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                        name="tagInput"
                        value={tagInput}
                        onChange={handleTagsChange}
                        onKeyPress={handleTagKeyPress}
                        onBlur={handleTagBlur}
                        placeholder="Type and press Enter or comma to add tags"
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                        {mutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
