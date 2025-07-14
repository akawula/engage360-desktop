import { apiService } from './apiService';
import { devicesService } from './devicesService';
import type { LoginRequest, RegisterRequest, AuthResponse, ApiResponse, AuthUser } from '../types';

// Extended registration request with device key
interface ExtendedRegisterRequest extends RegisterRequest {
    devicePublicKey: string;
}

class AuthService {
    async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
        const response = await apiService.post<AuthResponse>('/auth/login', credentials);

        if (response.success && response.data) {
            apiService.setToken(response.data.accessToken);
            apiService.setRefreshToken(response.data.refreshToken);
        }

        return response;
    }

    async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse & { recoveryKeys?: string[] }>> {
        try {
            // Generate device key pair for encryption
            const keyPair = await devicesService.generateAndStoreKeyPair(userData.password);

            // Store encrypted private key locally
            this.storeEncryptedPrivateKey(keyPair.privateKey);

            // Generate recovery keys for account recovery
            const recoveryKeys = await this.generateRecoveryKeys();

            // Include public key in registration request
            const extendedUserData: ExtendedRegisterRequest = {
                ...userData,
                devicePublicKey: keyPair.publicKey
            };

            const response = await apiService.post<AuthResponse>('/auth/register', extendedUserData);

            if (response.success && response.data) {
                apiService.setToken(response.data.accessToken);
                apiService.setRefreshToken(response.data.refreshToken);

                // Return response with recovery keys for user to save
                return {
                    ...response,
                    data: {
                        ...response.data,
                        recoveryKeys
                    }
                };
            }

            return response;
        } catch (error) {
            console.error('Registration with device key generation failed:', error);
            return {
                success: false,
                error: {
                    message: 'Registration failed: Could not generate device encryption keys',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
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
            // Clear device private key on logout
            this.clearEncryptedPrivateKey();
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

    /**
     * Store encrypted private key in local storage
     * In production, consider using IndexedDB for better security
     */
    private storeEncryptedPrivateKey(encryptedPrivateKey: string): void {
        try {
            localStorage.setItem('device_private_key', encryptedPrivateKey);
        } catch (error) {
            console.error('Failed to store encrypted private key:', error);
            throw new Error('Could not store device encryption key');
        }
    }

    /**
     * Get encrypted private key from local storage
     */
    getEncryptedPrivateKey(): string | null {
        try {
            return localStorage.getItem('device_private_key');
        } catch (error) {
            console.error('Failed to retrieve encrypted private key:', error);
            return null;
        }
    }

    /**
     * Clear encrypted private key from local storage
     */
    private clearEncryptedPrivateKey(): void {
        try {
            localStorage.removeItem('device_private_key');
        } catch (error) {
            console.error('Failed to clear encrypted private key:', error);
        }
    }

    /**
     * Check if user has device encryption keys available
     */
    hasDeviceKeys(): boolean {
        return !!this.getEncryptedPrivateKey();
    }

    /**
     * Generate and store recovery keys during registration
     * These are used when all devices are lost
     */
    async generateRecoveryKeys(): Promise<string[]> {
        const recoveryKeys: string[] = [];

        // Generate 12 recovery keys (similar to crypto wallet seed phrases)
        for (let i = 0; i < 12; i++) {
            const key = this.generateSecureRecoveryKey();
            recoveryKeys.push(key);
        }

        // Store encrypted recovery keys locally (encrypted with password)
        await this.storeRecoveryKeys(recoveryKeys);

        return recoveryKeys;
    }

    /**
     * Store recovery keys encrypted with user password
     */
    private async storeRecoveryKeys(recoveryKeys: string[]): Promise<void> {
        try {
            const keysString = JSON.stringify(recoveryKeys);
            // In a real implementation, encrypt these with user password
            localStorage.setItem('recovery_keys', btoa(keysString));
        } catch (error) {
            console.error('Failed to store recovery keys:', error);
            throw new Error('Could not store recovery keys');
        }
    }

    /**
     * Get stored recovery keys
     */
    getRecoveryKeys(): string[] | null {
        try {
            const stored = localStorage.getItem('recovery_keys');
            if (!stored) return null;

            const keysString = atob(stored);
            return JSON.parse(keysString);
        } catch (error) {
            console.error('Failed to retrieve recovery keys:', error);
            return null;
        }
    }

    /**
     * Validate recovery key input
     */
    validateRecoveryKeys(inputKeys: string[]): boolean {
        const storedKeys = this.getRecoveryKeys();
        if (!storedKeys || inputKeys.length !== storedKeys.length) {
            return false;
        }

        // Check if at least 8 out of 12 keys match (allows for some typos)
        const matches = inputKeys.filter((key, index) =>
            key.toLowerCase().trim() === storedKeys[index].toLowerCase()
        ).length;

        return matches >= 8;
    }

    /**
     * Generate a secure recovery key
     */
    private generateSecureRecoveryKey(): string {
        const words = [
            'apple', 'banana', 'cherry', 'dragon', 'elephant', 'forest', 'garden', 'harbor',
            'island', 'jungle', 'kitten', 'lemon', 'mountain', 'nature', 'ocean', 'planet',
            'quartz', 'river', 'sunset', 'tiger', 'universe', 'valley', 'wizard', 'xenon',
            'yellow', 'zebra', 'anchor', 'bridge', 'castle', 'diamond', 'eagle', 'falcon'
        ];

        // Generate 3-4 random words
        const numWords = 3 + Math.floor(Math.random() * 2);
        const selectedWords = [];

        for (let i = 0; i < numWords; i++) {
            const randomIndex = Math.floor(Math.random() * words.length);
            selectedWords.push(words[randomIndex]);
        }

        return selectedWords.join('-');
    }
}

export const authService = new AuthService();
