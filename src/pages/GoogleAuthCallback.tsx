import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { googleCalendarService } from '../services/googleCalendarService';

export default function GoogleAuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const error = searchParams.get('error');

            if (error) {
                setStatus('error');
                setMessage(`Authentication failed: ${error}`);
                
                // Send error message to parent window if opened in popup
                if (window.opener) {
                    window.opener.postMessage({
                        type: 'GOOGLE_AUTH_ERROR',
                        error: `Authentication failed: ${error}`
                    }, window.location.origin);
                }
                
                // Redirect to dashboard after 3 seconds
                setTimeout(() => {
                    if (window.opener) {
                        window.close();
                    } else {
                        navigate('/dashboard');
                    }
                }, 3000);
                return;
            }

            if (!code) {
                setStatus('error');
                setMessage('No authorization code received from Google');
                
                if (window.opener) {
                    window.opener.postMessage({
                        type: 'GOOGLE_AUTH_ERROR',
                        error: 'No authorization code received'
                    }, window.location.origin);
                }
                
                setTimeout(() => {
                    if (window.opener) {
                        window.close();
                    } else {
                        navigate('/dashboard');
                    }
                }, 3000);
                return;
            }

            try {
                const result = await googleCalendarService.exchangeCodeForToken(code);
                
                if (result.success) {
                    setStatus('success');
                    setMessage('Successfully connected to Google Calendar!');
                    
                    // Send success message to parent window if opened in popup
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'GOOGLE_AUTH_SUCCESS'
                        }, window.location.origin);
                    }
                    
                    // Redirect to dashboard after 2 seconds
                    setTimeout(() => {
                        if (window.opener) {
                            window.close();
                        } else {
                            navigate('/dashboard');
                        }
                    }, 2000);
                } else {
                    setStatus('error');
                    setMessage(result.error?.message || 'Failed to exchange authorization code');
                    
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'GOOGLE_AUTH_ERROR',
                            error: result.error?.message || 'Failed to exchange authorization code'
                        }, window.location.origin);
                    }
                    
                    setTimeout(() => {
                        if (window.opener) {
                            window.close();
                        } else {
                            navigate('/dashboard');
                        }
                    }, 3000);
                }
            } catch (error) {
                setStatus('error');
                setMessage('An unexpected error occurred during authentication');
                
                if (window.opener) {
                    window.opener.postMessage({
                        type: 'GOOGLE_AUTH_ERROR',
                        error: 'An unexpected error occurred'
                    }, window.location.origin);
                }
                
                setTimeout(() => {
                    if (window.opener) {
                        window.close();
                    } else {
                        navigate('/dashboard');
                    }
                }, 3000);
            }
        };

        handleCallback();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-50 via-white to-primary-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-800 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-dark-900 rounded-xl border border-dark-200 dark:border-dark-700 p-8 shadow-sm">
                <div className="text-center">
                    {status === 'loading' && (
                        <div className="space-y-4">
                            <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto animate-spin" />
                            <h1 className="text-xl font-semibold text-dark-950 dark:text-white">
                                Connecting to Google Calendar
                            </h1>
                            <p className="text-dark-600 dark:text-dark-400">
                                Please wait while we complete the authentication...
                            </p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="space-y-4">
                            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto" />
                            <h1 className="text-xl font-semibold text-green-900 dark:text-green-100">
                                Successfully Connected!
                            </h1>
                            <p className="text-green-700 dark:text-green-300">
                                {message}
                            </p>
                            <p className="text-sm text-dark-600 dark:text-dark-400">
                                You can now view your calendar events in the dashboard. This window will close automatically.
                            </p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-4">
                            <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto" />
                            <h1 className="text-xl font-semibold text-red-900 dark:text-red-100">
                                Connection Failed
                            </h1>
                            <p className="text-red-700 dark:text-red-300">
                                {message}
                            </p>
                            <p className="text-sm text-dark-600 dark:text-dark-400">
                                Please try again from the dashboard. This window will close automatically.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}