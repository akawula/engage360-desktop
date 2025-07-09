// Mock authentication service for demonstration purposes
// This simulates API responses to test the authentication flow

import type { LoginRequest, RegisterRequest, AuthResponse, ApiResponse, AuthUser } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock user database
const mockUsers: Map<string, { password: string; user: AuthUser }> = new Map([
    ['demo@engage360.com', {
        password: 'password123',
        user: {
            id: '1',
            email: 'demo@engage360.com',
            firstName: 'Demo',
            lastName: 'User',
            avatar: undefined,
            isEmailVerified: true,
            createdAt: '2024-01-01T00:00:00Z',
        }
    }],
    ['admin@engage360.com', {
        password: 'admin123',
        user: {
            id: '2',
            email: 'admin@engage360.com',
            firstName: 'Admin',
            lastName: 'User',
            avatar: undefined,
            isEmailVerified: true,
            createdAt: '2024-01-01T00:00:00Z',
        }
    }]
]);

class MockAuthService {
    async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
        // Simulate network delay
        await delay(1000);

        const userData = mockUsers.get(credentials.email);

        if (!userData || userData.password !== credentials.password) {
            return {
                success: false,
                error: {
                    message: 'Invalid email or password',
                    code: 401,
                    details: 'The credentials you provided are incorrect'
                }
            };
        }

        // Simulate a JWT token that includes the user email
        const token = `mock-jwt-token-${credentials.email}-${Date.now()}`;
        const refreshToken = `mock-refresh-token-${credentials.email}-${Date.now()}`;

        return {
            success: true,
            data: {
                user: userData.user,
                token,
                refreshToken
            }
        };
    }

    async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
        // Simulate network delay
        await delay(1200);

        // Check if user already exists
        if (mockUsers.has(userData.email)) {
            return {
                success: false,
                error: {
                    message: 'Email already exists',
                    code: 409,
                    details: 'An account with this email already exists'
                }
            };
        }

        // Validate password requirements
        if (userData.password.length < 12) {
            return {
                success: false,
                error: {
                    message: 'Validation error',
                    code: 400,
                    details: 'Password must be at least 12 characters'
                }
            };
        }

        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(userData.password)) {
            return {
                success: false,
                error: {
                    message: 'Validation error',
                    code: 400,
                    details: 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
                }
            };
        }

        // Validate device fields
        if (!userData.deviceName) {
            return {
                success: false,
                error: {
                    message: 'Validation error',
                    code: 400,
                    details: 'Device name is required'
                }
            };
        }

        if (!userData.deviceType) {
            return {
                success: false,
                error: {
                    message: 'Validation error',
                    code: 400,
                    details: 'Device type is required'
                }
            };
        }

        // Create new user
        const newUser: AuthUser = {
            id: (mockUsers.size + 1).toString(),
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            avatar: undefined,
            isEmailVerified: false,
            createdAt: new Date().toISOString(),
        };

        // Store in mock database
        mockUsers.set(userData.email, {
            password: userData.password,
            user: newUser
        });

        // Simulate a JWT token that includes the user email
        const token = `mock-jwt-token-${userData.email}-${Date.now()}`;
        const refreshToken = `mock-refresh-token-${userData.email}-${Date.now()}`;

        return {
            success: true,
            data: {
                user: newUser,
                token,
                refreshToken
            }
        };
    }

    async logout(): Promise<void> {
        // Simulate API call
        await delay(300);
        // In a real implementation, this would invalidate the token on the server
    }

    async refreshToken(): Promise<ApiResponse<AuthResponse>> {
        await delay(500);

        // Check if we have a valid token
        const token = this.getToken();
        if (!token) {
            return {
                success: false,
                error: {
                    message: 'No token found',
                    code: 401,
                    details: 'Please log in again'
                }
            };
        }

        // Extract email from the mock token
        const tokenParts = token.split('-');
        if (tokenParts.length < 3) {
            return {
                success: false,
                error: {
                    message: 'Invalid token format',
                    code: 401,
                    details: 'Please log in again'
                }
            };
        }

        const email = tokenParts[2];
        const userData = mockUsers.get(email);

        if (!userData) {
            return {
                success: false,
                error: {
                    message: 'User not found',
                    code: 401,
                    details: 'Please log in again'
                }
            };
        }

        // Generate new tokens
        const newToken = `mock-jwt-token-${email}-${Date.now()}`;
        const newRefreshToken = `mock-refresh-token-${email}-${Date.now()}`;

        return {
            success: true,
            data: {
                user: userData.user,
                token: newToken,
                refreshToken: newRefreshToken
            }
        };
    }

    async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
        await delay(800);

        if (!mockUsers.has(email)) {
            return {
                success: false,
                error: {
                    message: 'Email not found',
                    code: 404,
                    details: 'No account found with this email address'
                }
            };
        }

        return {
            success: true,
            data: {
                message: 'Password reset email sent'
            }
        };
    }

    async resetPassword(token: string, password: string): Promise<ApiResponse<{ message: string }>> {
        await delay(600);

        // Mock implementation - in real app, you'd validate the token
        return {
            success: true,
            data: {
                message: 'Password reset successfully'
            }
        };
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem('authToken');
    }

    getToken(): string | null {
        return localStorage.getItem('authToken');
    }

    setToken(token: string | null): void {
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }
}

export const mockAuthService = new MockAuthService();
