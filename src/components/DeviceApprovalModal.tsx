import { useState } from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';

interface DeviceApprovalModalProps {
    isOpen: boolean;
    deviceName: string;
    deviceType: string;
    onApprove: (password: string) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function DeviceApprovalModal({
    isOpen,
    deviceName,
    deviceType,
    onApprove,
    onCancel,
    isLoading = false
}: DeviceApprovalModalProps) {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!password.trim()) {
            setError('Password is required');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setError('');
        onApprove(password);
    };

    const handleClose = () => {
        setPassword('');
        setError('');
        setShowPassword(false);
        onCancel();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                            <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Approve Device
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Grant access to encrypted data
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>{deviceName}</strong> ({deviceType}) is requesting access to your encrypted notes.
                            Enter your password to share encryption keys with this device.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Your Account Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (error) setError('');
                                }}
                                className={`w-full px-3 py-2 border ${error ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10`}
                                placeholder="Enter your password"
                                required
                                autoFocus
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                disabled={isLoading}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {error && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                {error}
                            </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Required to decrypt your device keys and share them securely
                        </p>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">
                            <strong>Security Notice:</strong> Only approve devices you own and trust.
                            Approved devices can decrypt all your encrypted notes.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!password.trim() || isLoading}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Approving...' : 'Approve Device'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
