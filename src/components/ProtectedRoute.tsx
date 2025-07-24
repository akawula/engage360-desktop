import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthScreen from '../screens/AuthScreen';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark-100 dark:bg-dark-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AuthScreen />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
