import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { googleCalendarService } from './googleCalendarService';

export type DeepLinkCallback = (url: string) => void;

class DeepLinkService {
    private callbacks: Map<string, DeepLinkCallback[]> = new Map();
    private initialized = false;

    async initialize() {
        if (this.initialized) return;

        try {
            // Listen for deep link events
            await onOpenUrl(async (urls) => {
                console.log('Deep link received:', urls);
                
                for (const url of urls) {
                    await this.handleDeepLink(url);
                }
            });

            this.initialized = true;
            console.log('DeepLinkService initialized successfully');
        } catch (error) {
            console.error('Failed to initialize DeepLinkService:', error);
        }
    }

    private async handleDeepLink(url: string) {
        console.log('Processing deep link:', url);

        try {
            const urlObj = new URL(url);
            
            // Handle Google Calendar OAuth callback
            if (urlObj.protocol === 'engage360:' && urlObj.pathname === '//auth/google') {
                await this.handleGoogleCalendarCallback(urlObj);
                return;
            }

            // Handle other deep links by calling registered callbacks
            const path = urlObj.pathname.replace('//', '');
            const callbacks = this.callbacks.get(path);
            if (callbacks) {
                callbacks.forEach(callback => callback(url));
            }
        } catch (error) {
            console.error('Error processing deep link:', error);
        }
    }

    private async handleGoogleCalendarCallback(urlObj: URL) {
        const code = urlObj.searchParams.get('code');
        const error = urlObj.searchParams.get('error');

        console.log('Google Calendar OAuth callback received', { code: !!code, error });

        if (error) {
            console.error('Google Calendar OAuth error:', error);
            this.notifyGoogleCalendarCallback(null, error);
            return;
        }

        if (!code) {
            console.error('No authorization code received from Google');
            this.notifyGoogleCalendarCallback(null, 'No authorization code received');
            return;
        }

        try {
            // Exchange code for tokens
            const result = await googleCalendarService.exchangeCodeForToken(code);
            
            if (result.success) {
                console.log('Google Calendar authentication successful');
                this.notifyGoogleCalendarCallback(result.data, null);
            } else {
                console.error('Failed to exchange code for tokens:', result.error);
                this.notifyGoogleCalendarCallback(null, result.error?.message || 'Authentication failed');
            }
        } catch (error) {
            console.error('Error during token exchange:', error);
            this.notifyGoogleCalendarCallback(null, 'Token exchange failed');
        }
    }

    private notifyGoogleCalendarCallback(data: any, error: string | null) {
        // Emit custom event for Google Calendar authentication
        const event = new CustomEvent('google-calendar-auth', {
            detail: { data, error }
        });
        window.dispatchEvent(event);
    }

    /**
     * Register a callback for a specific deep link path
     */
    registerCallback(path: string, callback: DeepLinkCallback) {
        if (!this.callbacks.has(path)) {
            this.callbacks.set(path, []);
        }
        this.callbacks.get(path)!.push(callback);
    }

    /**
     * Unregister a callback for a specific deep link path
     */
    unregisterCallback(path: string, callback: DeepLinkCallback) {
        const callbacks = this.callbacks.get(path);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Check if the service is initialized
     */
    isInitialized(): boolean {
        return this.initialized;
    }
}

export const deepLinkService = new DeepLinkService();