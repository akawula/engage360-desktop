import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Mail, Calendar, Settings, Bell, Shield } from 'lucide-react';
import { userProfileService } from '../services/userProfileService';
import { useTheme } from '../contexts/ThemeContext';
import { formatAvatarSrc } from '../lib/utils';
import EditProfileModal from '../components/EditProfileModal';

export default function Profile() {
    const { theme, setTheme } = useTheme();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const response = await userProfileService.getUserProfile();
            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.error?.message || 'Failed to fetch profile');
            }
        },
        staleTime: 15 * 60 * 1000, // 15 minutes - profile changes less frequently
        gcTime: 20 * 60 * 1000, // 20 minutes cache
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6"></div>
                    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <p className="text-gray-600 dark:text-gray-300">Profile not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>

            {/* Profile Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                        {formatAvatarSrc(profile.avatar) ? (
                            <img
                                src={formatAvatarSrc(profile.avatar)!}
                                alt={`${profile.firstName} ${profile.lastName}`}
                                className="w-24 h-24 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                <User className="h-12 w-12 text-primary-600 dark:text-primary-400" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {profile.firstName} {profile.lastName}
                                </h2>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                            >
                                <Settings className="h-4 w-4" />
                                Edit Profile
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <Mail className="h-4 w-4" />
                                <span>{profile.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <Calendar className="h-4 w-4" />
                                <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preferences */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferences</h3>

                <div className="space-y-6">
                    {/* Theme */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                                <Settings className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">Theme</h4>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">Choose your preferred theme</p>
                            </div>
                        </div>
                        <select
                            value={theme}
                            onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'auto')}
                            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="auto">Auto</option>
                        </select>
                    </div>

                    {/* Notifications */}
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">Notifications</h4>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">Manage your notification preferences</p>
                            </div>
                        </div>

                        <div className="ml-11 space-y-3">
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={profile.preferences?.notifications?.email || false}
                                    className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                />
                                <span className="text-gray-700 dark:text-gray-200">Email notifications</span>
                            </label>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={profile.preferences?.notifications?.push || false}
                                    className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                />
                                <span className="text-gray-700 dark:text-gray-200">Push notifications</span>
                            </label>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={profile.preferences?.notifications?.actionItems || false}
                                    className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                />
                                <span className="text-gray-700 dark:text-gray-200">Action item reminders</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Security */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security</h3>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                                <Shield className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">Password</h4>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">Last updated: 30 days ago</p>
                            </div>
                        </div>
                        <button className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
                            Change Password
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {profile && (
                <EditProfileModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    profile={profile}
                />
            )}
        </div>
    );
}
