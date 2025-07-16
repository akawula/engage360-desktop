import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, User } from 'lucide-react';
import Modal from './Modal';
import { userProfileService } from '../services/userProfileService';
import { validateImageFile, resizeImage } from '../lib/imageUtils';
import type { UserProfile } from '../types';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: UserProfile;
}

export default function EditProfileModal({ isOpen, onClose, profile }: EditProfileModalProps) {
    const [formData, setFormData] = useState({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        avatar: profile.avatar || '',
    });

    const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar || null);
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const queryClient = useQueryClient();

    // Update form data when profile prop changes
    useEffect(() => {
        setFormData({
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            avatar: profile.avatar || '',
        });
        setAvatarPreview(profile.avatar || null);
    }, [profile]);

    const mutation = useMutation({
        mutationFn: async (updates: Partial<UserProfile>) => {
            const response = await userProfileService.updateUserProfile(updates);
            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to update profile');
            }
            return response;
        },
        onSuccess: (response) => {
            console.log('Profile update successful:', response);
            // Update the cached profile data
            queryClient.setQueryData(['profile'], response.data);
            onClose();
        },
        onError: (error) => {
            console.error('Profile update failed:', error);
        },
    });

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAvatarError(null);

        // Validate the file
        const validation = validateImageFile(file);
        if (!validation.isValid) {
            setAvatarError(validation.error || 'Invalid file');
            return;
        }

        try {
            // Resize and convert to base64 (100x100 square)
            const base64Avatar = await resizeImage(file, 100);

            setAvatarPreview(base64Avatar);
            setFormData(prev => ({
                ...prev,
                avatar: base64Avatar
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
            avatar: ''
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            avatar: formData.avatar || undefined,
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
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
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {mutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
