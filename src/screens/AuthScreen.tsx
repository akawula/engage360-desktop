import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { devicesService } from '../services/devicesService';
import type { LoginRequest, RegisterRequest } from '../types';

type AuthMode = 'login' | 'register';

const AuthScreen: React.FC = () => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        deviceName: '',
        deviceType: 'desktop',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { login, register, isLoading } = useAuth();

    // Initialize device info when component mounts
    useEffect(() => {
        if (mode === 'register') {
            const deviceInfo = devicesService.getDeviceInfo();
            setFormData(prev => ({
                ...prev,
                deviceName: deviceInfo.deviceName,
                deviceType: deviceInfo.deviceType,
            }));
        }
    }, [mode]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (mode === 'register') {
            // Registration password validation - stricter requirements
            if (formData.password.length < 12) {
                newErrors.password = 'Password must be at least 12 characters';
            } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
                newErrors.password = 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character';
            }
        } else if (formData.password.length < 6) {
            // Login password validation - more lenient
            newErrors.password = 'Password must be at least 6 characters';
        }

        // Registration-specific validation
        if (mode === 'register') {
            if (!formData.firstName) {
                newErrors.firstName = 'First name is required';
            }
            if (!formData.lastName) {
                newErrors.lastName = 'Last name is required';
            }
            if (!formData.deviceName) {
                newErrors.deviceName = 'Device name is required';
            }
            if (!formData.deviceType) {
                newErrors.deviceType = 'Device type is required';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (mode === 'login') {
            const loginData: LoginRequest = {
                email: formData.email,
                password: formData.password,
            };
            await login(loginData);
        } else {
            const registerData: RegisterRequest = {
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                deviceName: formData.deviceName,
                deviceType: formData.deviceType,
            };
            await register(registerData);
        }
    };

    const toggleMode = () => {
        const newMode = mode === 'login' ? 'register' : 'login';
        setMode(newMode);
        setErrors({});

        // Auto-populate device info when switching to register mode
        if (newMode === 'register') {
            const deviceInfo = devicesService.getDeviceInfo();
            setFormData({
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                deviceName: deviceInfo.deviceName,
                deviceType: deviceInfo.deviceType,
            });
        } else {
            setFormData({
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                deviceName: '',
                deviceType: 'desktop',
            });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">E360</span>
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                        {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                            {mode === 'login' ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>

                {/* Form */}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Registration-specific fields */}
                        {mode === 'register' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="firstName" className="sr-only">
                                            First Name
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                                <User className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                id="firstName"
                                                name="firstName"
                                                type="text"
                                                autoComplete="given-name"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                className={`appearance-none relative block w-full pl-10 pr-3 py-2 border ${errors.firstName ? 'border-red-300' : 'border-gray-300'
                                                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400`}
                                                placeholder="👤 First name"
                                            />
                                        </div>
                                        {errors.firstName && (
                                            <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="lastName" className="sr-only">
                                            Last Name
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                                <User className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                id="lastName"
                                                name="lastName"
                                                type="text"
                                                autoComplete="family-name"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                className={`appearance-none relative block w-full pl-10 pr-3 py-2 border ${errors.lastName ? 'border-red-300' : 'border-gray-300'
                                                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400`}
                                                placeholder="👤 Last name"
                                            />
                                        </div>
                                        {errors.lastName && (
                                            <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Device fields */}
                                <div>
                                    <label htmlFor="deviceName" className="sr-only">
                                        Device Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                            <span className="text-gray-400">💻</span>
                                        </div>
                                        <input
                                            id="deviceName"
                                            name="deviceName"
                                            type="text"
                                            value={formData.deviceName}
                                            onChange={handleInputChange}
                                            className={`appearance-none relative block w-full pl-10 pr-3 py-2 border ${errors.deviceName ? 'border-red-300' : 'border-gray-300'
                                                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400`}
                                            placeholder="💻 Device name (e.g., My MacBook Pro)"
                                        />
                                    </div>
                                    {errors.deviceName && (
                                        <p className="mt-1 text-sm text-red-600">{errors.deviceName}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="deviceType" className="sr-only">
                                        Device Type
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                            <span className="text-gray-400">📱</span>
                                        </div>
                                        <select
                                            id="deviceType"
                                            name="deviceType"
                                            value={formData.deviceType}
                                            onChange={handleInputChange}
                                            className={`appearance-none relative block w-full pl-10 pr-3 py-2 border ${errors.deviceType ? 'border-red-300' : 'border-gray-300'
                                                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                                        >
                                            <option value="desktop">🖥️ Desktop</option>
                                            <option value="mobile">📱 Mobile</option>
                                            <option value="tablet">📱 Tablet</option>
                                        </select>
                                    </div>
                                    {errors.deviceType && (
                                        <p className="mt-1 text-sm text-red-600">{errors.deviceType}</p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Email field */}
                        <div>
                            <label htmlFor="email" className="sr-only">
                                Email address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`appearance-none relative block w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'
                                        } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400`}
                                    placeholder="📧 Email address"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        {/* Password field */}
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={`appearance-none relative block w-full pl-10 pr-10 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'
                                        } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400`}
                                    placeholder="🔒 Password"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>
                    </div>

                    {/* Submit button */}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                {mode === 'login' ? (
                                    <LogIn className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" />
                                ) : (
                                    <UserPlus className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" />
                                )}
                            </span>
                            {isLoading
                                ? 'Processing...'
                                : mode === 'login'
                                    ? 'Sign in'
                                    : 'Create account'}
                        </button>
                    </div>

                    {/* Forgot password link for login mode */}
                    {mode === 'login' && (
                        <div className="text-center">
                            <button
                                type="button"
                                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                Forgot your password?
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default AuthScreen;
