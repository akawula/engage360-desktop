import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type NotificationPosition = 
    | 'top-left' 
    | 'top-right' 
    | 'top-center'
    | 'bottom-left' 
    | 'bottom-right' 
    | 'bottom-center';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    duration?: number;
}

export interface NotificationConfig {
    position: NotificationPosition;
    maxNotifications?: number;
}

interface NotificationContextType {
    notifications: Notification[];
    config: NotificationConfig;
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;
    setConfig: (config: Partial<NotificationConfig>) => void;
    showError: (title: string, message?: string) => void;
    showSuccess: (title: string, message?: string) => void;
    showWarning: (title: string, message?: string) => void;
    showInfo: (title: string, message?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ 
    children: React.ReactNode;
    defaultConfig?: Partial<NotificationConfig>;
}> = ({ children, defaultConfig }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [config, setConfigState] = useState<NotificationConfig>({
        position: 'top-right',
        maxNotifications: 5,
        ...defaultConfig
    });

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newNotification = { ...notification, id };

        setNotifications(prev => {
            const updated = [...prev, newNotification];
            // Respect maxNotifications limit
            if (config.maxNotifications && updated.length > config.maxNotifications) {
                return updated.slice(-config.maxNotifications);
            }
            return updated;
        });

        // Auto remove after duration (default 5 seconds)
        const duration = notification.duration ?? 5000;
        setTimeout(() => {
            removeNotification(id);
        }, duration);
    }, [config.maxNotifications]);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const setConfig = useCallback((newConfig: Partial<NotificationConfig>) => {
        setConfigState(prev => ({ ...prev, ...newConfig }));
    }, []);

    const showError = useCallback((title: string, message?: string) => {
        addNotification({ type: 'error', title, message });
    }, [addNotification]);

    const showSuccess = useCallback((title: string, message?: string) => {
        addNotification({ type: 'success', title, message });
    }, [addNotification]);

    const showWarning = useCallback((title: string, message?: string) => {
        addNotification({ type: 'warning', title, message });
    }, [addNotification]);

    const showInfo = useCallback((title: string, message?: string) => {
        addNotification({ type: 'info', title, message });
    }, [addNotification]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                config,
                addNotification,
                removeNotification,
                setConfig,
                showError,
                showSuccess,
                showWarning,
                showInfo,
            }}
        >
            {children}
            <NotificationContainer 
                notifications={notifications} 
                config={config}
                onRemove={removeNotification} 
            />
        </NotificationContext.Provider>
    );
};

const NotificationContainer: React.FC<{
    notifications: Notification[];
    config: NotificationConfig;
    onRemove: (id: string) => void;
}> = ({ notifications, config, onRemove }) => {
    if (notifications.length === 0) return null;

    const getPositionClasses = (position: NotificationPosition): string => {
        const baseClasses = "fixed z-50 space-y-2";
        
        switch (position) {
            case 'top-left':
                return `${baseClasses} top-4 left-4`;
            case 'top-right':
                return `${baseClasses} top-4 right-4`;
            case 'top-center':
                return `${baseClasses} top-4 left-1/2 transform -translate-x-1/2`;
            case 'bottom-left':
                return `${baseClasses} bottom-4 left-4`;
            case 'bottom-right':
                return `${baseClasses} bottom-4 right-4`;
            case 'bottom-center':
                return `${baseClasses} bottom-4 left-1/2 transform -translate-x-1/2`;
            default:
                return `${baseClasses} top-4 right-4`;
        }
    };

    return (
        <div className={getPositionClasses(config.position)}>
            {notifications.map((notification) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRemove={onRemove}
                />
            ))}
        </div>
    );
};

const NotificationItem: React.FC<{
    notification: Notification;
    onRemove: (id: string) => void;
}> = ({ notification, onRemove }) => {
    const getIcon = () => {
        switch (notification.type) {
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-400" />;
            case 'error':
                return <AlertCircle className="h-5 w-5 text-red-400" />;
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
            case 'info':
                return <Info className="h-5 w-5 text-blue-400" />;
            default:
                return <Info className="h-5 w-5 text-blue-400" />;
        }
    };

    const getBackgroundColor = () => {
        switch (notification.type) {
            case 'success':
                return 'bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700';
            case 'error':
                return 'bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-700';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900 dark:border-yellow-700';
            case 'info':
                return 'bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-700';
            default:
                return 'bg-dark-100 border-dark-300 dark:bg-dark-800 dark:border-dark-700';
        }
    };

    return (
        <div className={`min-w-[300px] max-w-md w-full border rounded-lg shadow-lg p-4 transition-all duration-300 ${getBackgroundColor()}`}>
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    {getIcon()}
                </div>
                <div className="ml-3 w-0 flex-1">
                    <p className="text-sm font-medium text-dark-950 dark:text-white">
                        {notification.title}
                    </p>
                    {notification.message && (
                        <p className="mt-1 text-sm text-dark-600 dark:text-dark-100">
                            {notification.message}
                        </p>
                    )}
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                    <button
                        className="inline-flex text-dark-500 hover:text-dark-700 dark:text-dark-300 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => onRemove(notification.id)}
                    >
                        <span className="sr-only">Close</span>
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
