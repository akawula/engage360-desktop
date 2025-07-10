import { apiService } from './apiService';
import type { LoginRequest, RegisterRequest, AuthResponse, ApiResponse, AuthUser } from '../types';

class AuthService {
    async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
        const response = await apiService.post<AuthResponse>('/auth/login', credentials);

        if (response.success && response.data) {
            apiService.setToken(response.data.accessToken);
            apiService.setRefreshToken(response.data.refreshToken);
        }

        return response;
    }

    async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
        const response = await apiService.post<AuthResponse>('/auth/register', userData);

        if (response.success && response.data) {
            apiService.setToken(response.data.accessToken);
            apiService.setRefreshToken(response.data.refreshToken);
        }

        return response;
    }

    async logout(): Promise<void> {
        try {
            await apiService.post('/auth/logout');
        } catch (error) {
            // Even if logout fails on server, clear local token
            console.warn('Logout request failed:', error);
        } finally {
            apiService.setToken(null);
            apiService.setRefreshToken(null);
        }
    }

    async refreshToken(): Promise<ApiResponse<AuthResponse>> {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            return {
                success: false,
                error: {
                    message: 'No refresh token available',
                    code: 401
                }
            };
        }

        const response = await apiService.post<AuthResponse>('/auth/refresh', {
            refreshToken
        });

        if (response.success && response.data) {
            apiService.setToken(response.data.accessToken);
            apiService.setRefreshToken(response.data.refreshToken);
        }

        return response;
    }

    async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
        return apiService.post('/auth/forgot-password', { email });
    }

    async resetPassword(token: string, password: string): Promise<ApiResponse<{ message: string }>> {
        return apiService.post('/auth/reset-password', { token, password });
    }

    async getUserProfile(): Promise<ApiResponse<AuthUser>> {
        return apiService.get<AuthUser>('/profile');
    }

    isAuthenticated(): boolean {
        return !!apiService.getToken();
    }

    getToken(): string | null {
        return apiService.getToken();
    }

    setToken(token: string | null): void {
        apiService.setToken(token);
    }

    getRefreshToken(): string | null {
        return apiService.getRefreshToken();
    }

    setRefreshToken(refreshToken: string | null): void {
        apiService.setRefreshToken(refreshToken);
    }
}

export const authService = new AuthService();
