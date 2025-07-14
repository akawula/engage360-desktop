import { useState } from 'react';
import { Key, AlertTriangle, Check } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { devicesService } from '../services/devicesService';
import { useNotification } from '../contexts/NotificationContext';

interface DeviceRecoveryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function DeviceRecoveryModal({ isOpen, onClose, onSuccess }: DeviceRecoveryModalProps) {
    const { showSuccess, showError } = useNotification();
    const [recoveryKeys, setRecoveryKeys] = useState<string[]>(Array(12).fill(''));
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const recoveryMutation = useMutation({
        mutationFn: (data: { recoveryKeys: string[]; password: string }) =>
            devicesService.recoverDeviceWithRecoveryKeys(data.recoveryKeys, data.password),
        onSuccess: (response) => {
            if (response.success) {
                showSuccess(
                    'Device Recovered',
                    'Your device has been successfully recovered. You can now access your encrypted data.'
                );
                onSuccess();
                handleClose();
            } else {
                showError('Recovery Failed', response.error?.message || 'Recovery failed');
            }
        },
        onError: (error) => {
            showError(
                'Recovery Failed',
                error instanceof Error ? error.message : 'Failed to recover device'
            );
        },
    });

    const handleKeyChange = (index: number, value: string) => {
        const newKeys = [...recoveryKeys];
        newKeys[index] = value.trim().toLowerCase();
        setRecoveryKeys(newKeys);

        // Clear errors when user starts typing
        if (errors[`key_${index}`]) {
            const newErrors = { ...errors };
            delete newErrors[`key_${index}`];
            setErrors(newErrors);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Check recovery keys
        const filledKeys = recoveryKeys.filter(key => key.trim().length > 0);
        if (filledKeys.length < 8) {
            newErrors.keys = 'You must enter at least 8 recovery keys';
        }

        // Validate key format (should be hyphenated words)
        recoveryKeys.forEach((key, index) => {
            if (key.trim() && !/^[a-z]+(-[a-z]+)*$/.test(key.trim())) {
                newErrors[`key_${index}`] = 'Invalid format';
            }
        });

        // Password validation
        if (!password.trim()) {
            newErrors.password = 'New device password is required';
        } else if (password.length < 12) {
            newErrors.password = 'Password must be at least 12 characters';
        }

        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const validKeys = recoveryKeys.filter(key => key.trim().length > 0);
        recoveryMutation.mutate({
            recoveryKeys: validKeys,
            password: password
        });
    };

    const handleClose = () => {
        setRecoveryKeys(Array(12).fill(''));
        setPassword('');
        setConfirmPassword('');
        setErrors({});
        onClose();
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const lines = pastedText.split('\n').map(line => line.trim()).filter(line => line);

        const newKeys = [...recoveryKeys];
        lines.forEach((line, index) => {
            if (index < 12) {
                // Remove any numbering (1., 2., etc.)
                const cleanedKey = line.replace(/^\d+\.\s*/, '').trim().toLowerCase();
                newKeys[index] = cleanedKey;
            }
        });

        setRecoveryKeys(newKeys);
    };

    if (!isOpen) return null;

    const filledKeysCount = recoveryKeys.filter(key => key.trim().length > 0).length;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <Key className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Recover Your Account
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Enter your recovery keys to regain access to your encrypted data
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-yellow-700 dark:text-yellow-300">
                                <p className="font-medium mb-1">Account Recovery</p>
                                <p>Enter at least 8 of your 12 recovery keys. You can paste all keys at once or enter them individually.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Recovery Keys ({filledKeysCount}/12 filled, minimum 8 required)
                            </label>
                            <div className="flex items-center gap-2">
                                <div className={`h-2 w-20 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
                                    <div
                                        className={`h-full transition-all duration-300 ${filledKeysCount >= 8 ? 'bg-green-500' : 'bg-blue-500'
                                            }`}
                                        style={{ width: `${Math.min((filledKeysCount / 8) * 100, 100)}%` }}
                                    />
                                </div>
                                {filledKeysCount >= 8 && <Check className="h-4 w-4 text-green-500" />}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2" onPaste={handlePaste}>
                            {recoveryKeys.map((key, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 w-6">
                                        {index + 1}.
                                    </span>
                                    <input
                                        type="text"
                                        value={key}
                                        onChange={(e) => handleKeyChange(index, e.target.value)}
                                        placeholder="word-word-word"
                                        className={`flex-1 px-2 py-1 text-sm border rounded font-mono ${errors[`key_${index}`]
                                                ? 'border-red-300 dark:border-red-600'
                                                : 'border-gray-300 dark:border-gray-600'
                                            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                                    />
                                </div>
                            ))}
                        </div>

                        {errors.keys && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                {errors.keys}
                            </p>
                        )}

                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            💡 Tip: You can paste all your recovery keys at once from a text file
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                New Device Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg ${errors.password
                                        ? 'border-red-300 dark:border-red-600'
                                        : 'border-gray-300 dark:border-gray-600'
                                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                                placeholder="Secure password for this device"
                                required
                            />
                            {errors.password && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg ${errors.confirmPassword
                                        ? 'border-red-300 dark:border-red-600'
                                        : 'border-gray-300 dark:border-gray-600'
                                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                                placeholder="Confirm your password"
                                required
                            />
                            {errors.confirmPassword && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    {errors.confirmPassword}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={recoveryMutation.isPending || filledKeysCount < 8}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {recoveryMutation.isPending ? 'Recovering...' : 'Recover Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
