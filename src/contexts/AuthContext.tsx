import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService } from '../services/authService'; // Using real API service
// import { mockAuthService } from '../services/mockAuthService'; // For demo only
import { useNotification } from './NotificationContext';
import type { AuthUser, LoginRequest, RegisterFormRequest } from '../types';

// Use real service for production
const authServiceToUse = authService;

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: Omit<LoginRequest, 'deviceId'>) => Promise<boolean>;
    register: (userData: RegisterFormRequest) => Promise<boolean>;
    logout: () => Promise<void>;
    handleSessionExpiration: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const { showError, showSuccess } = useNotification();

    // Calculate isAuthenticated based on token only
    const isAuthenticated = useMemo(() => {
        const hasToken = !!token;
        console.log('isAuthenticated calculation:', { hasToken, token: token ? 'present' : 'null' });
        return hasToken;
    }, [token]); // Only depend on token, not user

    // Check for existing authentication on mount
    useEffect(() => {
        const initializeAuth = async () => {
            const existingToken = authServiceToUse.getToken();
            console.log('Initializing auth with existing token:', existingToken ? 'present' : 'null');

            if (existingToken) {
                setToken(existingToken);
                // Try to load user data if token exists
                try {
                    const userResponse = await authServiceToUse.getUserProfile();
                    if (userResponse.success && userResponse.data) {
                        // Handle the API response structure - userResponse.data contains the raw API response
                        let userData: AuthUser | null = null;

                        // Check if the response has the expected structure: response.data.user
                        if (userResponse.data && typeof userResponse.data === 'object' && 'user' in userResponse.data) {
                            userData = (userResponse.data as any).user;
                        }
                        // Fallback to direct user data
                        else if (userResponse.data && 'id' in userResponse.data) {
                            userData = userResponse.data as AuthUser;
                        }

                        if (userData) {
                            setUser(userData);
                            console.log('User profile loaded:', userData);
                        } else {
                            console.log('Could not extract user data from response:', userResponse.data);
                        }
                    } else {
                        console.log('Failed to load user profile:', userResponse.error);
                        // Only clear token if it's an authentication error (401)
                        if (userResponse.error?.code === 401 || userResponse.error?.message?.includes('Unauthorized')) {
                            console.log('Authentication failed, clearing token');
                            authServiceToUse.setToken(null);
                            setToken(null);
                        } else {
                            console.log('Network or other error, keeping token but no user data');
                            // Keep the token but don't set user data - this allows the app to work
                            // User profile will be loaded when they navigate to profile page
                        }
                    }
                } catch (error) {
                    console.error('Error loading user profile:', error);
                    // Don't clear token on network errors - keep user authenticated
                    console.log('Keeping token despite profile load error');
                }
            }
            setIsLoading(false);
        };

        initializeAuth();
    }, []);

    const login = useCallback(async (credentials: Omit<LoginRequest, 'deviceId'>): Promise<boolean> => {
        setIsLoading(true);
        try {
            const response = await authServiceToUse.login(credentials);

            if (response.success && response.data?.data) {
                console.log('Login successful, accessToken:', response.data.data.accessToken);
                setUser(response.data.data.user);
                authServiceToUse.setToken(response.data.data.accessToken);
                setToken(response.data.data.accessToken); // Update token state
                console.log('Token state updated to:', response.data.data.accessToken);
                showSuccess('Welcome back!', 'You have been successfully logged in.');
                return true;
            } else {
                showError('Login Failed', response.error?.message || 'Invalid credentials');
                return false;
            }
        } catch (error) {
            showError('Login Error', 'An unexpected error occurred during login');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [showError, showSuccess]);

    const register = useCallback(async (userData: RegisterFormRequest): Promise<boolean> => {
        setIsLoading(true);
        try {
            const response = await authServiceToUse.register(userData);

            if (response.success && response.data?.data) {
                setUser(response.data.data.user);
                authServiceToUse.setToken(response.data.data.accessToken);
                setToken(response.data.data.accessToken); // Update token state
                showSuccess('Welcome!', 'Your account has been created successfully.');
                return true;
            } else {
                showError('Registration Failed', response.error?.message || 'Registration failed');
                return false;
            }
        } catch (error) {
            showError('Registration Error', 'An unexpected error occurred during registration');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [showError, showSuccess]);

    const logout = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        try {
            await authServiceToUse.logout();
            setUser(null);
            authServiceToUse.setToken(null);
            setToken(null); // Update token state
            showSuccess('Logged Out', 'You have been successfully logged out.');
        } catch (error) {
            showError('Logout Error', 'An error occurred during logout');
        } finally {
            setIsLoading(false);
        }
    }, [showError, showSuccess]);

    const handleSessionExpiration = useCallback(() => {
        setUser(null);
        authServiceToUse.setToken(null);
        authServiceToUse.setRefreshToken(null);
        setToken(null);
        showError('Session Expired', 'Your session has expired. Please log in again.');
    }, [showError]);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated,
                login,
                register,
                logout,
                handleSessionExpiration,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
