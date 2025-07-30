import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Calendar, Settings, Bell, Shield, Cpu, Download, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { userProfileService } from '../services/userProfileService';
import { ollamaService, type OllamaStatus } from '../services/ollamaService';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification, type NotificationPosition } from '../contexts/NotificationContext';
import { formatAvatarSrc } from '../lib/utils';
import EditProfileModal from '../components/EditProfileModal';

export default function Profile() {
    const { theme, setTheme } = useTheme();
    const { config, setConfig, showInfo } = useNotification();
    const queryClient = useQueryClient();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
    const [checkingOllama, setCheckingOllama] = useState(false);
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

    // Mutation for updating preferences
    const updatePreferencesMutation = useMutation({
        mutationFn: (preferences: Partial<NonNullable<typeof profile>['preferences']>) =>
            userProfileService.updateUserPreferences(preferences),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        }
    });

    // Check Ollama status when component mounts
    useEffect(() => {
        const checkOllama = async () => {
            setCheckingOllama(true);
            try {
                const status = await ollamaService.checkOllamaStatus();
                setOllamaStatus(status);
            } catch (error) {
                setOllamaStatus({
                    isInstalled: false,
                    isRunning: false,
                    error: 'Failed to check Ollama status'
                });
            } finally {
                setCheckingOllama(false);
            }
        };

        checkOllama();
    }, []);

    const handleOllamaToggle = async (enabled: boolean) => {
        if (!profile) return;

        await updatePreferencesMutation.mutateAsync({
            ollama: {
                ...profile.preferences.ollama,
                enabled
            }
        });
    };

    const handleOllamaModelChange = async (model: string) => {
        if (!profile) return;

        await updatePreferencesMutation.mutateAsync({
            ollama: {
                ...profile.preferences.ollama,
                model
            }
        });
    };


    const recheckOllama = async () => {
        setCheckingOllama(true);
        ollamaService.clearCache();
        try {
            const status = await ollamaService.checkOllamaStatus();
            setOllamaStatus(status);
        } catch (error) {
            setOllamaStatus({
                isInstalled: false,
                isRunning: false,
                error: 'Failed to check Ollama status'
            });
        } finally {
            setCheckingOllama(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-dark-300 dark:bg-dark-800 rounded w-32 mb-6"></div>
                    <div className="h-64 bg-dark-300 dark:bg-dark-800 rounded"></div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-dark-950 dark:text-white">Profile</h1>
                <div className="bg-white dark:bg-dark-900 rounded-lg shadow p-6 transition-colors">
                    <p className="text-dark-700 dark:text-dark-400">Profile not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-dark-950 dark:text-white">Profile</h1>

            {/* Profile Header */}
            <div className="bg-white dark:bg-dark-900 rounded-lg shadow p-6 transition-colors">
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
                                <h2 className="text-2xl font-bold text-dark-950 dark:text-white">
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
                            <div className="flex items-center gap-2 text-dark-700 dark:text-dark-400">
                                <Mail className="h-4 w-4" />
                                <span>{profile.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-dark-700 dark:text-dark-400">
                                <Calendar className="h-4 w-4" />
                                <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preferences */}
            <div className="bg-white dark:bg-dark-900 rounded-lg shadow p-6 transition-colors">
                <h3 className="text-lg font-semibold text-dark-950 dark:text-white mb-4">Preferences</h3>

                <div className="space-y-6">
                    {/* Theme */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-dark-200 dark:bg-dark-800 p-2 rounded-lg">
                                <Settings className="h-5 w-5 text-dark-700 dark:text-dark-400" />
                            </div>
                            <div>
                                <h4 className="font-medium text-dark-950 dark:text-white">Theme</h4>
                                <p className="text-dark-700 dark:text-dark-400 text-sm">Choose your preferred theme</p>
                            </div>
                        </div>
                        <select
                            value={theme}
                            onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'auto')}
                            className="border border-dark-400 dark:border-dark-700 rounded-lg px-3 py-2 bg-white dark:bg-dark-800 text-dark-950 dark:text-white"
                        >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="auto">Auto</option>
                        </select>
                    </div>

                    {/* Notifications */}
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-dark-200 dark:bg-dark-800 p-2 rounded-lg">
                                <Bell className="h-5 w-5 text-dark-700 dark:text-dark-400" />
                            </div>
                            <div>
                                <h4 className="font-medium text-dark-950 dark:text-white">Notifications</h4>
                                <p className="text-dark-700 dark:text-dark-400 text-sm">Manage your notification preferences</p>
                            </div>
                        </div>

                        <div className="ml-11 space-y-3">
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={profile.preferences?.notifications?.email || false}
                                    className="rounded border-dark-400 dark:border-dark-700 dark:bg-dark-800"
                                />
                                <span className="text-dark-800 dark:text-dark-300">Email notifications</span>
                            </label>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={profile.preferences?.notifications?.push || false}
                                    className="rounded border-dark-400 dark:border-dark-700 dark:bg-dark-800"
                                />
                                <span className="text-dark-800 dark:text-dark-300">Push notifications</span>
                            </label>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={profile.preferences?.notifications?.actionItems || false}
                                    className="rounded border-dark-400 dark:border-dark-700 dark:bg-dark-800"
                                />
                                <span className="text-dark-800 dark:text-dark-300">Action item reminders</span>
                            </label>

                            {/* Notification Position */}
                            <div className="space-y-2">
                                <label className="text-dark-800 dark:text-dark-300 text-sm font-medium">
                                    Notification Position
                                </label>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={config.position}
                                        onChange={(e) => setConfig({ position: e.target.value as NotificationPosition })}
                                        className="border border-dark-400 dark:border-dark-700 rounded-lg px-3 py-2 bg-white dark:bg-dark-800 text-dark-950 dark:text-white text-sm"
                                    >
                                        <option value="top-left">Top Left</option>
                                        <option value="top-right">Top Right</option>
                                        <option value="top-center">Top Center</option>
                                        <option value="bottom-left">Bottom Left</option>
                                        <option value="bottom-right">Bottom Right</option>
                                        <option value="bottom-center">Bottom Center</option>
                                    </select>
                                    <button
                                        onClick={() => showInfo('Test Notification', `Notifications will appear at ${config.position.replace('-', ' ')}`)}
                                        className="px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                    >
                                        Test
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ollama Settings */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-dark-200 dark:bg-dark-800 p-2 rounded-lg">
                                    <Cpu className="h-5 w-5 text-dark-700 dark:text-dark-400" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-dark-950 dark:text-white">AI Summaries (Ollama)</h4>
                                    <p className="text-dark-700 dark:text-dark-400 text-sm">Local AI-powered note and meeting summaries</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {checkingOllama && <Loader className="h-4 w-4 animate-spin text-dark-500" />}
                                {ollamaStatus && (
                                    <div className="flex items-center gap-2">
                                        {ollamaStatus.isInstalled && ollamaStatus.isRunning ? (
                                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                <CheckCircle className="h-4 w-4" />
                                                <span className="text-xs">Ready</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                                <AlertCircle className="h-4 w-4" />
                                                <span className="text-xs">
                                                    {!ollamaStatus.isInstalled ? 'Not Installed' : 'Not Running'}
                                                </span>
                                            </div>
                                        )}
                                        <button
                                            onClick={recheckOllama}
                                            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                                        >
                                            Recheck
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="ml-11 space-y-4">
                            {/* Installation Status */}
                            {ollamaStatus && !ollamaStatus.isInstalled && (
                                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <Download className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                                        <div>
                                            <h5 className="font-medium text-orange-800 dark:text-orange-200">Ollama Not Installed</h5>
                                            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                                                To enable AI summaries, please install Ollama from{' '}
                                                <a
                                                    href="https://ollama.com"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="underline hover:text-orange-800 dark:hover:text-orange-200"
                                                >
                                                    ollama.com
                                                </a>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Not Running Status */}
                            {ollamaStatus && ollamaStatus.isInstalled && !ollamaStatus.isRunning && (
                                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                                        <div>
                                            <h5 className="font-medium text-orange-800 dark:text-orange-200">Ollama Not Running</h5>
                                            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                                                Please start the Ollama service by running <code className="bg-orange-100 dark:bg-orange-800 px-1 rounded">ollama serve</code> in your terminal.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Ollama Settings - Only show if installed and running */}
                            {ollamaStatus?.isInstalled && ollamaStatus?.isRunning && profile && (
                                <>
                                    <label className="flex items-center justify-between">
                                        <span className="text-dark-800 dark:text-dark-300">Enable AI summaries</span>
                                        <input
                                            type="checkbox"
                                            checked={profile.preferences?.ollama?.enabled || false}
                                            onChange={(e) => handleOllamaToggle(e.target.checked)}
                                            className="rounded border-dark-400 dark:border-dark-700 dark:bg-dark-800"
                                        />
                                    </label>

                                    {profile.preferences?.ollama?.enabled && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-dark-800 dark:text-dark-300 mb-2">
                                                    AI Model
                                                </label>
                                                <select
                                                    value={profile.preferences.ollama.model}
                                                    onChange={(e) => handleOllamaModelChange(e.target.value)}
                                                    className="w-full border border-dark-400 dark:border-dark-700 rounded-lg px-3 py-2 bg-white dark:bg-dark-800 text-dark-950 dark:text-white text-sm"
                                                >
                                                    {ollamaService.getRecommendedModels().map(model => (
                                                        <option key={model} value={model}>{model}</option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-dark-600 dark:text-dark-500 mt-1">
                                                    Smaller models are faster but less accurate. If model is not available, it will be downloaded automatically.
                                                </p>
                                            </div>

                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Security */}
            <div className="bg-white dark:bg-dark-900 rounded-lg shadow p-6 transition-colors">
                <h3 className="text-lg font-semibold text-dark-950 dark:text-white mb-4">Security</h3>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-dark-200 dark:bg-dark-800 p-2 rounded-lg">
                                <Shield className="h-5 w-5 text-dark-700 dark:text-dark-400" />
                            </div>
                            <div>
                                <h4 className="font-medium text-dark-950 dark:text-white">Password</h4>
                                <p className="text-dark-700 dark:text-dark-400 text-sm">Last updated: 30 days ago</p>
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
