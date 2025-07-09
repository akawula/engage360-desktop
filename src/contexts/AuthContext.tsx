import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService } from '../services/authService'; // Using real API service
// import { mockAuthService } from '../services/mockAuthService'; // For demo only
import { useNotification } from './NotificationContext';
import type { AuthUser, LoginRequest, RegisterRequest } from '../types';

// Use real service for production
const authServiceToUse = authService;

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginRequest) => Promise<boolean>;
    register: (userData: RegisterRequest) => Promise<boolean>;
    logout: () => Promise<void>;
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

    // Calculate isAuthenticated based on token
    const isAuthenticated = useMemo(() => {
        const hasToken = !!token;
        console.log('isAuthenticated calculation:', { hasToken, user, token });
        return hasToken;
    }, [user, token]); // Depend on both user and token

    // Check for existing authentication on mount
    useEffect(() => {
        const existingToken = authServiceToUse.getToken();
        setToken(existingToken);
        setIsLoading(false);
    }, []);

    const login = useCallback(async (credentials: LoginRequest): Promise<boolean> => {
        setIsLoading(true);
        try {
            const response = await authServiceToUse.login(credentials);

            if (response.success && response.data) {
                console.log('Login successful, accessToken:', response.data.accessToken);
                setUser(response.data.user);
                authServiceToUse.setToken(response.data.accessToken);
                setToken(response.data.accessToken); // Update token state
                console.log('Token state updated to:', response.data.accessToken);
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

    const register = useCallback(async (userData: RegisterRequest): Promise<boolean> => {
        setIsLoading(true);
        try {
            const response = await authServiceToUse.register(userData);

            if (response.success && response.data) {
                setUser(response.data.user);
                authServiceToUse.setToken(response.data.accessToken);
                setToken(response.data.accessToken); // Update token state
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

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
