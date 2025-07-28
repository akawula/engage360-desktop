import { useState, useEffect } from 'react';
import { Calendar, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { googleCalendarService } from '../services/googleCalendarService';
import { openUrl } from '@tauri-apps/plugin-opener';

interface GoogleCalendarAuthProps {
    onAuthSuccess?: () => void;
    onAuthError?: (error: string) => void;
}

export default function GoogleCalendarAuth({ onAuthSuccess, onAuthError }: GoogleCalendarAuthProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'awaiting-auth'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const isAuthenticated = googleCalendarService.isAuthenticated();

    useEffect(() => {
        // Listen for Google Calendar authentication events from deep link service
        const handleGoogleCalendarAuth = (event: CustomEvent) => {
            const { data, error } = event.detail;
            
            setIsLoading(false);
            
            if (error) {
                setAuthStatus('error');
                setErrorMessage(error);
                onAuthError?.(error);
            } else if (data) {
                setAuthStatus('success');
                setErrorMessage('');
                onAuthSuccess?.();
            }
        };

        window.addEventListener('google-calendar-auth', handleGoogleCalendarAuth as EventListener);
        
        return () => {
            window.removeEventListener('google-calendar-auth', handleGoogleCalendarAuth as EventListener);
        };
    }, [onAuthSuccess, onAuthError]);

    const handleGoogleAuth = async () => {
        try {
            const authUrl = googleCalendarService.getAuthUrl();
            
            setIsLoading(true);
            setAuthStatus('awaiting-auth');
            setErrorMessage('');
            
            // Open Google OAuth in the system browser using Tauri's opener
            await openUrl(authUrl);
            
            // The deep link service will handle the callback automatically
            // Keep loading state until we get the callback event

        } catch (error) {
            setIsLoading(false);
            setAuthStatus('error');
            setErrorMessage('Failed to open browser for authentication');
            onAuthError?.('Failed to open browser');
        }
    };

    const handleSignOut = () => {
        googleCalendarService.signOut();
        setAuthStatus('idle');
        setErrorMessage('');
    };

    if (isAuthenticated) {
        return (
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                        <p className="font-medium text-green-900 dark:text-green-100">
                            Google Calendar Connected
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                            Your calendar events will be synced
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleSignOut}
                    className="px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 border border-green-300 dark:border-green-600 hover:border-green-400 dark:hover:border-green-500 rounded-md transition-colors"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                            Connect Google Calendar
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                            Connect your Google Calendar to view upcoming events directly in your dashboard.
                            We'll only read your calendar events - we won't make any changes.
                        </p>
                        
                        <button
                            onClick={handleGoogleAuth}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ExternalLink className="w-4 h-4" />
                            )}
                            {isLoading ? 'Authenticating...' : 'Connect Google Calendar'}
                        </button>
                        
                        {authStatus === 'awaiting-auth' && (
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                                Complete authentication in your browser. You'll be redirected back automatically.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {authStatus === 'error' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                        <div>
                            <p className="font-medium text-red-900 dark:text-red-100">
                                Connection Failed
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                {errorMessage || 'Failed to connect to Google Calendar. Please try again.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}