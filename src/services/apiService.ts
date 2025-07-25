import type { ApiResponse, ApiError } from '../types';

export interface ApiRequestOptions {
    disableTokenRefresh?: boolean;
}

// Check if running in Tauri environment
const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__;

// Base server URL without any prefix
const SERVER_BASE_URL = 'http://45.86.33.25:2137';
// API prefix for protected endpoints
const API_PREFIX = '/api';

class ApiService {
    private serverBaseURL: string;
    private token: string | null = null;
    private refreshToken: string | null = null;
    private isRefreshing: boolean = false;
    private refreshPromise: Promise<boolean> | null = null;

    constructor(serverBaseURL: string = SERVER_BASE_URL) {
        this.serverBaseURL = serverBaseURL;
        this.token = localStorage.getItem('authToken');
        this.refreshToken = localStorage.getItem('refreshToken');
    }

    private getBaseURL(endpoint: string): string {
        // Auth endpoints don't use the /api prefix
        if (endpoint.startsWith('/auth/')) {
            return this.serverBaseURL;
        }
        // All other endpoints use the /api prefix
        return `${this.serverBaseURL}${API_PREFIX}`;
    }

    setToken(token: string | null) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    setRefreshToken(refreshToken: string | null) {
        this.refreshToken = refreshToken;
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        } else {
            localStorage.removeItem('refreshToken');
        }
    }

    getToken(): string | null {
        return this.token;
    }

    getRefreshToken(): string | null {
        return this.refreshToken;
    }

    private isTokenExpired(token: string): boolean {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Date.now() / 1000;
            return payload.exp < now;
        } catch {
            return true;
        }
    }

    private isTokenExpiringSoon(token: string, bufferMinutes: number = 5): boolean {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Date.now() / 1000;
            const buffer = bufferMinutes * 60; // Convert minutes to seconds
            return payload.exp < (now + buffer);
        } catch {
            return true;
        }
    }

    private async attemptTokenRefresh(): Promise<boolean> {
        if (!this.refreshToken) {
            return false;
        }

        if (this.isRefreshing) {
            return this.refreshPromise || Promise.resolve(false);
        }

        this.isRefreshing = true;
        this.refreshPromise = this.performTokenRefresh();

        try {
            const result = await this.refreshPromise;
            return result;
        } finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
        }
    }

    private async performTokenRefresh(): Promise<boolean> {
        try {
            const url = `${this.serverBaseURL}/auth/refresh`;
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refreshToken: this.refreshToken
                }),
            };

            let response: Response;

            if (isTauri) {
                const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
                response = await tauriFetch(url, options);
            } else {
                response = await fetch(url, options);
            }

            if (response.ok) {
                const data = await response.json();
                if (data.accessToken) {
                    this.setToken(data.accessToken);
                    if (data.refreshToken) {
                        this.setRefreshToken(data.refreshToken);
                    }
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    }

    private async ensureValidToken(apiRequestOptions: ApiRequestOptions = {}): Promise<boolean> {
        if (!this.token) {
            return false;
        }

        if (apiRequestOptions.disableTokenRefresh) {
            return !this.isTokenExpired(this.token);
        }

        // Check if token is expired
        if (this.isTokenExpired(this.token)) {
            return await this.attemptTokenRefresh();
        }

        // Check if token is expiring soon
        if (this.isTokenExpiringSoon(this.token)) {
            await this.attemptTokenRefresh(); // Don't wait for this, let it happen in background
        }

        return true;
    } private async request<T>(
        endpoint: string,
        options: RequestInit = {},
        apiRequestOptions: ApiRequestOptions = {}
    ): Promise<ApiResponse<T>> {
        // For non-auth endpoints, ensure we have a valid token
        if (!endpoint.startsWith('/auth/') && this.token) {
            const hasValidToken = await this.ensureValidToken(apiRequestOptions);
            if (!hasValidToken) {
                // Token refresh failed, redirect to login
                const error: ApiError = {
                    message: 'Session expired. Please log in again.',
                    code: 401,
                    details: 'Token refresh failed',
                };
                return {
                    success: false,
                    error,
                };
            }
        }

        // Check if user is not authenticated for protected endpoints
        if (!endpoint.startsWith('/auth/') && !this.token) {
            const error: ApiError = {
                message: 'Session expired. Please log in again.',
                code: 401,
                details: 'No authentication token available',
            };
            return {
                success: false,
                error,
            };
        }

        const baseURL = this.getBaseURL(endpoint);
        const url = `${baseURL}${endpoint}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {}),
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            let response: Response;

            if (isTauri) {
                try {
                    // Use Tauri's HTTP client in Tauri environment
                    const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
                    response = await tauriFetch(url, {
                        ...options,
                        headers,
                    });
                } catch (importError) {
                    // Fallback to browser fetch
                    response = await fetch(url, {
                        ...options,
                        headers,
                    });
                }
            } else {
                // Use browser's fetch API in web environment
                response = await fetch(url, {
                    ...options,
                    headers,
                });
            } let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                // Handle 304 Not Modified - this is actually a success case for GET requests
                if (response.status === 304) {
                    // Force a fresh request by adding a cache-busting parameter
                    const separator = endpoint.includes('?') ? '&' : '?';
                    const freshEndpoint = `${endpoint}${separator}_t=${Date.now()}`;

                    // Retry without cache-busting headers to avoid CORS issues
                    return this.request(freshEndpoint, options, apiRequestOptions);
                }

                // Handle 401 errors by attempting token refresh
                if (response.status === 401 && !endpoint.startsWith('/auth/') && !apiRequestOptions.disableTokenRefresh) {
                    const refreshSuccess = await this.attemptTokenRefresh();
                    if (refreshSuccess) {
                        // Retry the request with the new token
                        return this.request(endpoint, options, apiRequestOptions);
                    }
                }

                const error: ApiError = {
                    message: this.getErrorMessage(response.status, data),
                    code: response.status,
                    details: typeof data === 'string' ? data : data?.message || data?.error,
                };

                return {
                    success: false,
                    error,
                };
            }

            return {
                success: true,
                data: data as T,
            };
        } catch (error) {
            const apiError: ApiError = {
                message: 'Network error occurred. Please check your connection.',
                code: 0,
                details: error instanceof Error ? error.message : 'Unknown error',
            };

            return {
                success: false,
                error: apiError,
            };
        }
    }

    private getErrorMessage(status: number, data: any): string {
        switch (status) {
            case 400:
                return 'Invalid request. Please check your input.';
            case 401:
                return 'Authentication failed. Please log in again.';
            case 402:
                return 'Payment required. Please check your subscription.';
            case 403:
                return 'Access denied. You don\'t have permission for this action.';
            case 404:
                return 'Resource not found.';
            case 409:
                return 'Conflict. This resource already exists.';
            case 422:
                return 'Validation error. Please check your input.';
            case 429:
                return 'Too many requests. Please try again later.';
            case 500:
                return 'Server error. Please try again later.';
            case 502:
                return 'Bad gateway. The server is temporarily unavailable.';
            case 503:
                return 'Service unavailable. Please try again later.';
            case 504:
                return 'Gateway timeout. The request took too long.';
            default:
                return data?.message || `An error occurred (${status})`;
        }
    }

    async get<T>(endpoint: string, apiRequestOptions?: ApiRequestOptions): Promise<ApiResponse<T>> {
        // Add cache-busting for profile requests to avoid 304 responses
        let requestEndpoint = endpoint;
        if (endpoint.includes('/users/profile')) {
            const separator = endpoint.includes('?') ? '&' : '?';
            requestEndpoint = `${endpoint}${separator}_cb=${Date.now()}`;
        }

        return this.request<T>(requestEndpoint, { method: 'GET' }, apiRequestOptions);
    }

    async post<T>(endpoint: string, body?: any, apiRequestOptions?: ApiRequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        }, apiRequestOptions);
    }

    async put<T>(endpoint: string, body?: any, apiRequestOptions?: ApiRequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        }, apiRequestOptions);
    }

    async delete<T>(endpoint: string, apiRequestOptions?: ApiRequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' }, apiRequestOptions);
    }

    async patch<T>(endpoint: string, body?: any, apiRequestOptions?: ApiRequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        }, apiRequestOptions);
    }
}

export const apiService = new ApiService();
