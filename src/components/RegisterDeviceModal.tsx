import { useState } from 'react';
import { X, Shield, Smartphone, Monitor, Tablet, Laptop } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { devicesService } from '../services/devicesService';
import { useNotification } from '../contexts/NotificationContext';
import type { DeviceRegistrationRequest } from '../services/devicesService';

interface RegisterDeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function RegisterDeviceModal({ isOpen, onClose }: RegisterDeviceModalProps) {
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useNotification();
    const deviceInfo = devicesService.getDeviceInfo();

    const [formData, setFormData] = useState<DeviceRegistrationRequest>({
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    const registerMutation = useMutation({
        mutationFn: (data: DeviceRegistrationRequest) => devicesService.registerDevice(data),
        onSuccess: (response) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['devices'] });
                handleClose();
                showSuccess(
                    'Device Registered',
                    'Your device has been registered successfully. You may need to approve it from an existing trusted device.'
                );
            } else {
                // Handle API error response
                const errorMessage = response.error?.message || 'Registration failed';
                if (response.error?.code === 401) {
                    setPasswordError('Invalid password. Please enter your correct account password.');
                } else {
                    showError('Registration Failed', errorMessage);
                }
            }
        },
        onError: (error) => {
            showError(
                'Registration Failed',
                error instanceof Error ? error.message : 'Failed to register device'
            );
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Clear previous password error
        setPasswordError('');

        // Client-side validation
        if (!formData.password.trim()) {
            setPasswordError('Password is required');
            return;
        }

        if (formData.password.length < 8) {
            setPasswordError('Password must be at least 8 characters long');
            return;
        }

        if (!formData.deviceName.trim()) {
            showError('Validation Error', 'Device name is required');
            return;
        }

        registerMutation.mutate(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        // Clear password error when user starts typing in password field
        if (name === 'password' && passwordError) {
            setPasswordError('');
        }
    };

    const getDeviceTypeIcon = (type: string) => {
        switch (type) {
            case 'mobile':
                return <Smartphone className="h-5 w-5" />;
            case 'tablet':
                return <Tablet className="h-5 w-5" />;
            case 'laptop':
                return <Laptop className="h-5 w-5" />;
            default:
                return <Monitor className="h-5 w-5" />;
        }
    };

    if (!isOpen) return null;

    // Reset form when modal opens
    const resetForm = () => {
        setFormData({
            deviceName: deviceInfo.deviceName,
            deviceType: deviceInfo.deviceType,
            password: '',
        });
        setPasswordError('');
        setShowPassword(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-dark-900 rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="flex items-center justify-between p-4 border-b border-dark-300 dark:border-dark-800">
                    <h2 className="text-lg font-semibold text-dark-950 dark:text-white">Register New Device</h2>
                    <button
                        onClick={handleClose}
                        className="text-dark-500 hover:text-dark-700 dark:hover:text-dark-400"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                            <Shield className="h-4 w-4" />
                            <span className="text-sm font-medium">Security Notice</span>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                            New devices require approval before they can access encrypted data.
                            You'll need to approve this device from an existing trusted device.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="deviceName" className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-1">
                            Device Name
                        </label>
                        <input
                            type="text"
                            id="deviceName"
                            name="deviceName"
                            value={formData.deviceName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="My MacBook Pro"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="deviceType" className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-1">
                            Device Type
                        </label>
                        <div className="relative">
                            <select
                                id="deviceType"
                                name="deviceType"
                                value={formData.deviceType}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none pr-10"
                                required
                            >
                                <option value="desktop">Desktop</option>
                                <option value="laptop">Laptop</option>
                                <option value="tablet">Tablet</option>
                                <option value="mobile">Mobile</option>
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-dark-500">
                                {getDeviceTypeIcon(formData.deviceType)}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-dark-800 dark:text-dark-400 mb-1">
                            Account Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border ${passwordError ? 'border-red-300 dark:border-red-600' : 'border-dark-400 dark:border-dark-700'} bg-white dark:bg-dark-800 text-dark-950 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10`}
                                placeholder="Your account password"
                                required
                                minLength={8}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-3 flex items-center text-dark-500 hover:text-dark-700 dark:hover:text-dark-400"
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {passwordError ? (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                {passwordError}
                            </p>
                        ) : (
                            <p className="text-xs text-dark-600 dark:text-dark-500 mt-1">
                                Required to encrypt device keys securely
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 text-dark-800 dark:text-dark-400 border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={registerMutation.isPending || !formData.password.trim()}
                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {registerMutation.isPending ? 'Registering...' : 'Register Device'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
