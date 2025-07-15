import { apiService } from './apiService';
import { devicesService } from './devicesService';
import type { LoginRequest, RegisterRequest, RegisterFormRequest, AuthResponse, ApiResponse, AuthUser } from '../types';

class AuthService {
    async login(credentials: Omit<LoginRequest, 'deviceId'>): Promise<ApiResponse<AuthResponse>> {
        // Get stored device ID, or generate new one if first time
        let deviceId = this.getDeviceId();
        if (!deviceId) {
            deviceId = this.generateDeviceId();
            this.setDeviceId(deviceId);
        }

        const loginRequest: LoginRequest = {
            ...credentials,
            deviceId
        };

        const response = await apiService.post<AuthResponse>('/auth/login', loginRequest);

        if (response.success && response.data) {
            const authData = response.data as any;

            // Login API returns flat structure: { message, user, devices, accessToken, refreshToken, expiresIn }
            const accessToken = authData.accessToken;
            const refreshToken = authData.refreshToken;

            if (accessToken && authData.user) {
                apiService.setToken(accessToken);
                if (refreshToken) {
                    apiService.setRefreshToken(refreshToken);
                }

                // Handle devices array - use the first device
                if (authData.devices && authData.devices.length > 0) {
                    const device = authData.devices[0];
                    this.setDeviceId(device.id);
                }

                // Get stored user profile data to complement the minimal user object from login
                const storedUserData = this.getStoredUserProfile();

                // Create enhanced user object
                const user: AuthUser = {
                    id: authData.user.id,
                    email: authData.user.email,
                    firstName: storedUserData?.firstName || 'User', // Fallback if no stored data
                    lastName: storedUserData?.lastName || '',
                    avatarUrl: authData.user.avatarUrl || storedUserData?.avatarUrl,
                    createdAt: authData.user.createdAt || new Date().toISOString(),
                    updatedAt: authData.user.updatedAt || new Date().toISOString()
                };

                // Store the user profile for future logins
                this.storeUserProfile(user);

                // Return standardized response format
                return {
                    success: true,
                    data: {
                        success: true,
                        message: authData.message || 'Login successful',
                        data: {
                            accessToken,
                            refreshToken,
                            user,
                            device: authData.devices?.[0] ? {
                                id: authData.devices[0].id,
                                name: authData.devices[0].name,
                                type: 'desktop' as const,
                                trusted: true
                            } : undefined
                        }
                    }
                };
            }
        }

        return response;
    }

    async register(userData: RegisterFormRequest): Promise<ApiResponse<AuthResponse & { recoveryKeys?: string[] }>> {
        try {
            // Generate device key pair for encryption
            const keyPair = await devicesService.generateAndStoreKeyPair(userData.password);

            // Generate master key pair (separate from device keys)
            const masterKeyPair = await devicesService.generateKeyPair();

            // Store encrypted private keys locally
            this.storeEncryptedPrivateKey(keyPair.privateKey);
            this.storeEncryptedMasterKey(masterKeyPair.privateKey, userData.password);

            // Generate recovery keys for account recovery
            const recoveryKeys = await this.generateRecoveryKeys();

            // Create registration request with all required keys
            const registrationRequest: RegisterRequest = {
                email: userData.email,
                password: userData.password,
                firstName: userData.firstName,
                lastName: userData.lastName,
                deviceName: userData.deviceName,
                deviceType: userData.deviceType,
                devicePublicKey: keyPair.publicKey,
                masterPublicKey: masterKeyPair.publicKey
            }; const response = await apiService.post<AuthResponse>('/auth/register', registrationRequest);

            // Handle different response formats
            let accessToken: string | undefined;
            let refreshToken: string | undefined;
            let user: AuthUser | undefined;
            let deviceInfo: any;

            if (response.success && response.data) {
                const authData = response.data as any; // Cast to any to handle flexible response format

                // Your backend returns a flat structure with: message, user, device, accessToken, refreshToken
                accessToken = authData.accessToken;
                refreshToken = authData.refreshToken;

                // Backend user object only has id and email, we need to enhance it with firstName/lastName
                if (authData.user) {
                    user = {
                        id: authData.user.id,
                        email: authData.user.email,
                        firstName: userData.firstName,  // Use the data we sent in registration
                        lastName: userData.lastName,    // Use the data we sent in registration
                        avatarUrl: authData.user.avatarUrl,
                        createdAt: authData.user.createdAt || new Date().toISOString(),
                        updatedAt: authData.user.updatedAt || new Date().toISOString()
                    };
                }

                deviceInfo = authData.device;

                if (accessToken && user) {
                    apiService.setToken(accessToken);
                    if (refreshToken) {
                        apiService.setRefreshToken(refreshToken);
                    }

                    // Store device ID from registration response
                    if (deviceInfo?.id) {
                        this.setDeviceId(deviceInfo.id);
                    }

                    // Store user profile for future logins
                    this.storeUserProfile(user);

                    // Return response with recovery keys for user to save
                    return {
                        success: true,
                        data: {
                            success: true,
                            message: 'Registration successful',
                            data: {
                                accessToken,
                                refreshToken: refreshToken || '',
                                user,
                                device: deviceInfo || { id: '', name: '', type: 'desktop' as const, trusted: false }
                            },
                            recoveryKeys
                        }
                    };
                }
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
            // Clear all device and encryption data on logout
            this.clearEncryptedPrivateKey();
            this.clearEncryptedMasterKey();
            this.clearDeviceId();
            this.clearStoredUserProfile();
        }
    }

    async refreshToken(): Promise<ApiResponse<{ success: boolean; data: { accessToken: string } }>> {
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

        const response = await apiService.post<{ success: boolean; data: { accessToken: string } }>('/auth/refresh', {
            refreshToken
        });

        if (response.success && response.data?.data) {
            apiService.setToken(response.data.data.accessToken);
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
        return apiService.get<AuthUser>('/users/profile');
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

    /**
     * Device ID management
     */
    generateDeviceId(): string {
        return crypto.randomUUID();
    }

    getDeviceId(): string | null {
        try {
            return localStorage.getItem('device_id');
        } catch (error) {
            console.error('Failed to retrieve device ID:', error);
            return null;
        }
    }

    setDeviceId(deviceId: string): void {
        try {
            localStorage.setItem('device_id', deviceId);
        } catch (error) {
            console.error('Failed to store device ID:', error);
        }
    }

    private clearDeviceId(): void {
        try {
            localStorage.removeItem('device_id');
        } catch (error) {
            console.error('Failed to clear device ID:', error);
        }
    }

    /**
     * Store encrypted master key in local storage
     */
    private storeEncryptedMasterKey(encryptedMasterKey: string, _password: string): void {
        try {
            // In a real implementation, you'd want to encrypt this with the password
            // For now, we'll store it directly
            localStorage.setItem('master_private_key', encryptedMasterKey);
        } catch (error) {
            console.error('Failed to store encrypted master key:', error);
            throw new Error('Could not store master encryption key');
        }
    }

    /**
     * Get encrypted master key from local storage
     */
    getEncryptedMasterKey(): string | null {
        try {
            return localStorage.getItem('master_private_key');
        } catch (error) {
            console.error('Failed to retrieve encrypted master key:', error);
            return null;
        }
    }

    /**
     * Clear encrypted master key from local storage
     */
    private clearEncryptedMasterKey(): void {
        try {
            localStorage.removeItem('master_private_key');
        } catch (error) {
            console.error('Failed to clear encrypted master key:', error);
        }
    }

    /**
     * Store user profile data locally
     */
    private storeUserProfile(user: AuthUser): void {
        try {
            localStorage.setItem('user_profile', JSON.stringify({
                firstName: user.firstName,
                lastName: user.lastName,
                avatarUrl: user.avatarUrl,
                email: user.email
            }));
        } catch (error) {
            console.error('Failed to store user profile:', error);
        }
    }

    /**
     * Get stored user profile data
     */
    private getStoredUserProfile(): Partial<AuthUser> | null {
        try {
            const stored = localStorage.getItem('user_profile');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Failed to retrieve user profile:', error);
            return null;
        }
    }

    /**
     * Clear stored user profile
     */
    private clearStoredUserProfile(): void {
        try {
            localStorage.removeItem('user_profile');
        } catch (error) {
            console.error('Failed to clear user profile:', error);
        }
    }
}

export const authService = new AuthService();
