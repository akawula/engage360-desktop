import type { ApiResponse, ApiError } from '../types';

// Using your actual server URL with port 5173 for CORS configuration
const API_BASE_URL = 'http://45.86.33.25:2137';

class ApiService {
    private baseURL: string;
    private token: string | null = null;

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('authToken');
    }

    setToken(token: string | null) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    getToken(): string | null {
        return this.token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {}),
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
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

    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        });
    }
}

export const apiService = new ApiService();
