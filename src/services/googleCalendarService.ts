import type { ApiResponse } from '../types';

export interface CalendarEvent {
    id: string;
    summary: string;
    description?: string;
    start: {
        dateTime: string;
        timeZone?: string;
    };
    end: {
        dateTime: string;
        timeZone?: string;
    };
    location?: string;
    attendees?: {
        email: string;
        displayName?: string;
    }[];
    htmlLink?: string;
    creator?: {
        email: string;
        displayName?: string;
    };
}

export interface GoogleCalendarConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
}

class GoogleCalendarService {
    private config: GoogleCalendarConfig;
    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    constructor() {
        // Use import.meta.env for Vite environment variables
        this.config = {
            clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
            clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
            redirectUri: 'engage360://auth/google', // Custom URI scheme for seamless flow
            scopes: [
                'https://www.googleapis.com/auth/calendar.readonly',
                'https://www.googleapis.com/auth/calendar.events.readonly'
            ]
        };

        // Load tokens from localStorage
        this.accessToken = localStorage.getItem('google_access_token');
        this.refreshToken = localStorage.getItem('google_refresh_token');
    }

    /**
     * Get Google OAuth authorization URL
     */
    getAuthUrl(): string {
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            scope: this.config.scopes.join(' '),
            response_type: 'code',
            access_type: 'offline',
            prompt: 'consent'
        });

        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(code: string): Promise<ApiResponse<{ accessToken: string; refreshToken?: string }>> {
        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: this.config.clientId,
                    client_secret: this.config.clientSecret,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: this.config.redirectUri,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                return {
                    success: false,
                    error: {
                        message: 'Failed to exchange code for token',
                        code: response.status,
                        details: error
                    }
                };
            }

            const data = await response.json();
            
            this.accessToken = data.access_token;
            if (data.refresh_token) {
                this.refreshToken = data.refresh_token;
            }

            // Store tokens
            this.storeTokens(this.accessToken, this.refreshToken || null);

            return {
                success: true,
                data: {
                    accessToken: this.accessToken || '',
                    refreshToken: this.refreshToken || undefined
                }
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    message: 'Network error during token exchange',
                    code: 0,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(): Promise<ApiResponse<{ accessToken: string }>> {
        if (!this.refreshToken) {
            return {
                success: false,
                error: {
                    message: 'No refresh token available',
                    code: 401
                }
            };
        }

        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: this.config.clientId,
                    client_secret: this.config.clientSecret,
                    refresh_token: this.refreshToken,
                    grant_type: 'refresh_token',
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                return {
                    success: false,
                    error: {
                        message: 'Failed to refresh token',
                        code: response.status,
                        details: error
                    }
                };
            }

            const data = await response.json();
            this.accessToken = data.access_token;

            // Store new access token
            this.storeTokens(this.accessToken, this.refreshToken || null);

            return {
                success: true,
                data: {
                    accessToken: this.accessToken || ''
                }
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    message: 'Network error during token refresh',
                    code: 0,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    /**
     * Make authenticated request to Google Calendar API
     */
    private async makeAuthenticatedRequest(url: string): Promise<ApiResponse<any>> {
        if (!this.accessToken) {
            return {
                success: false,
                error: {
                    message: 'Not authenticated with Google Calendar',
                    code: 401
                }
            };
        }

        try {
            let response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            // If token expired, try to refresh it
            if (response.status === 401 && this.refreshToken) {
                const refreshResult = await this.refreshAccessToken();
                if (refreshResult.success) {
                    // Retry the request with new token
                    response = await fetch(url, {
                        headers: {
                            'Authorization': `Bearer ${this.accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    });
                } else {
                    return refreshResult;
                }
            }

            if (!response.ok) {
                const error = await response.text();
                return {
                    success: false,
                    error: {
                        message: 'Google Calendar API request failed',
                        code: response.status,
                        details: error
                    }
                };
            }

            const data = await response.json();
            return {
                success: true,
                data
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    message: 'Network error during Google Calendar request',
                    code: 0,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    /**
     * Get upcoming events from primary calendar
     */
    async getUpcomingEvents(maxResults: number = 10): Promise<ApiResponse<CalendarEvent[]>> {
        const now = new Date().toISOString();
        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
            `timeMin=${encodeURIComponent(now)}&` +
            `maxResults=${maxResults}&` +
            `singleEvents=true&` +
            `orderBy=startTime`;

        const response = await this.makeAuthenticatedRequest(url);
        
        if (!response.success) {
            return response;
        }

        const events: CalendarEvent[] = response.data.items?.map((item: any) => ({
            id: item.id,
            summary: item.summary || 'No title',
            description: item.description,
            start: {
                dateTime: item.start.dateTime || item.start.date,
                timeZone: item.start.timeZone
            },
            end: {
                dateTime: item.end.dateTime || item.end.date,
                timeZone: item.end.timeZone
            },
            location: item.location,
            attendees: item.attendees?.map((attendee: any) => ({
                email: attendee.email,
                displayName: attendee.displayName
            })),
            htmlLink: item.htmlLink,
            creator: item.creator ? {
                email: item.creator.email,
                displayName: item.creator.displayName
            } : undefined
        })) || [];

        return {
            success: true,
            data: events
        };
    }

    /**
     * Get events for a specific date range
     */
    async getEventsInRange(startDate: Date, endDate: Date): Promise<ApiResponse<CalendarEvent[]>> {
        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
            `timeMin=${encodeURIComponent(startDate.toISOString())}&` +
            `timeMax=${encodeURIComponent(endDate.toISOString())}&` +
            `singleEvents=true&` +
            `orderBy=startTime`;

        const response = await this.makeAuthenticatedRequest(url);
        
        if (!response.success) {
            return response;
        }

        const events: CalendarEvent[] = response.data.items?.map((item: any) => ({
            id: item.id,
            summary: item.summary || 'No title',
            description: item.description,
            start: {
                dateTime: item.start.dateTime || item.start.date,
                timeZone: item.start.timeZone
            },
            end: {
                dateTime: item.end.dateTime || item.end.date,
                timeZone: item.end.timeZone
            },
            location: item.location,
            attendees: item.attendees?.map((attendee: any) => ({
                email: attendee.email,
                displayName: attendee.displayName
            })),
            htmlLink: item.htmlLink,
            creator: item.creator ? {
                email: item.creator.email,
                displayName: item.creator.displayName
            } : undefined
        })) || [];

        return {
            success: true,
            data: events
        };
    }

    /**
     * Check if user is authenticated with Google Calendar
     */
    isAuthenticated(): boolean {
        return !!this.accessToken;
    }

    /**
     * Sign out from Google Calendar
     */
    signOut(): void {
        this.accessToken = null;
        this.refreshToken = null;
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_refresh_token');
    }

    /**
     * Store tokens in localStorage
     */
    private storeTokens(accessToken: string | null, refreshToken: string | null): void {
        if (accessToken) {
            localStorage.setItem('google_access_token', accessToken);
        }
        if (refreshToken) {
            localStorage.setItem('google_refresh_token', refreshToken);
        }
    }
}

export const googleCalendarService = new GoogleCalendarService();