import { apiService } from './apiService';
import type { ApiResponse, Device } from '../types';

// Extended device types based on backend schema
export interface UserDevice extends Device {
    publicKey?: string; // Not returned in list view for security
}

export interface DeviceRegistrationRequest {
    deviceName: string;
    deviceType: string;
    password: string; // For private key encryption
    publicKey?: string; // Generated during registration
}

export interface DeviceUpdateRequest {
    deviceName?: string;
    trusted?: boolean;
}

export interface DeviceRegistrationResponse {
    message: string;
    device: UserDevice;
    note?: string;
}

export interface ECDHKeyPair {
    publicKey: string;   // Base64 encoded public key
    privateKey: string;  // Base64 encoded private key (encrypted)
    curve: string;       // Curve identifier
}

/**
 * Transform backend device data to UI-compatible format
 */
function transformDeviceData(device: any): Device {
    const lastUsedDate = device.lastUsed || device.last_used ? new Date(device.lastUsed || device.last_used) : null;
    const now = new Date();
    const diffInMinutes = lastUsedDate
        ? Math.floor((now.getTime() - lastUsedDate.getTime()) / (1000 * 60))
        : null;

    // Consider device active if used within last 30 minutes
    const isActive = diffInMinutes !== null && diffInMinutes < 30;

    // Map device type to UI categories
    const mapDeviceType = (deviceType: string): 'desktop' | 'mobile' | 'tablet' | 'laptop' => {
        const type = deviceType.toLowerCase();
        if (type.includes('mobile') || type.includes('phone')) return 'mobile';
        if (type.includes('tablet') || type.includes('ipad')) return 'tablet';
        if (type.includes('laptop') || type.includes('macbook')) return 'laptop';
        return 'desktop';
    };

    // Get device type from various possible field names
    const deviceTypeRaw = device.deviceType || device.device_type || device.type || 'desktop';

    return {
        id: device.id,
        userId: device.userId || device.user_id || '',
        deviceName: device.deviceName || device.device_name || device.name || 'Unknown Device',
        deviceType: deviceTypeRaw,
        platform: device.platform || deviceTypeRaw || 'Unknown',
        version: device.version,
        trusted: device.trusted !== undefined ? device.trusted : true, // Default to true if not specified
        lastUsed: device.lastUsed || device.last_used,
        createdAt: device.createdAt || device.created_at || new Date().toISOString(),
        // UI compatibility aliases
        name: device.deviceName || device.device_name || device.name || 'Unknown Device',
        type: mapDeviceType(deviceTypeRaw),
        lastSeen: device.lastUsed || device.last_used,
        isActive,
        registeredAt: device.createdAt || device.created_at || new Date().toISOString(),
    };
}

class DevicesService {
    /**
     * Get all devices for the current user
     */
    async getDevices(): Promise<ApiResponse<Device[]>> {
        const response = await apiService.get<any>('/devices');

        if (response.success && response.data) {
            // Handle different response formats from backend
            let devicesArray: any[] = [];

            if (Array.isArray(response.data)) {
                // Direct array response
                devicesArray = response.data;
            } else if (response.data.devices && Array.isArray(response.data.devices)) {
                // Wrapped in devices property
                devicesArray = response.data.devices;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                // Wrapped in data property
                devicesArray = response.data.data;
            } else {
                // Unexpected format, log for debugging
                console.warn('Unexpected devices response format:', response.data);
                console.warn('Response data type:', typeof response.data);
                console.warn('Response data keys:', Object.keys(response.data || {}));
                devicesArray = [];
            }

            return {
                success: true,
                data: devicesArray.map(transformDeviceData),
            };
        }

        // Log API failures for debugging
        console.error('Devices API call failed:', response);
        return response as ApiResponse<Device[]>;
    }

    /**
     * Get a specific device by ID
     */
    async getDevice(deviceId: string): Promise<ApiResponse<Device>> {
        const response = await apiService.get<any>(`/devices/${deviceId}`);
        if (response.success && response.data) {
            return {
                success: true,
                data: transformDeviceData(response.data),
            };
        }
        return response as ApiResponse<Device>;
    }

    /**
     * Register a new device with E2E encryption support
     *
     * NOTE: This method bypasses the standard apiService.post() to avoid automatic
     * token refresh retries on 401 errors. For device registration, a 401 status
     * specifically means "invalid password" and should not trigger token refresh.
     */
    async registerDevice(request: DeviceRegistrationRequest): Promise<ApiResponse<DeviceRegistrationResponse>> {
        try {
            // Generate device key pair for encryption
            const keyPair = await this.generateAndStoreKeyPair(request.password);

            // Store encrypted private key locally
            this.storeEncryptedPrivateKey(keyPair.privateKey);

            // For device registration, we need to handle 401 errors directly without token refresh retry
            // because 401 here means "invalid password", not "expired token"
            const SERVER_BASE_URL = 'http://45.86.33.25:2137';
            const url = `${SERVER_BASE_URL}/api/devices`;

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            // Add auth token if available
            const token = apiService.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Include public key in the request
            const requestWithKey = {
                ...request,
                publicKey: keyPair.publicKey
            };

            const fetchResponse = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestWithKey),
            });

            let data;
            const contentType = fetchResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await fetchResponse.json();
            } else {
                data = await fetchResponse.text();
            }

            if (!fetchResponse.ok) {
                // Clear stored private key on failure
                this.clearEncryptedPrivateKey();

                // Handle specific 401 error for device registration (invalid password)
                if (fetchResponse.status === 401) {
                    return {
                        success: false,
                        error: {
                            message: 'Invalid password. Please enter your correct account password.',
                            code: 401,
                            details: typeof data === 'string' ? data : data?.message || data?.error,
                        },
                    };
                }

                // Handle other HTTP errors
                return {
                    success: false,
                    error: {
                        message: `Device registration failed (${fetchResponse.status})`,
                        code: fetchResponse.status,
                        details: typeof data === 'string' ? data : data?.message || data?.error,
                    },
                };
            }

            // Success case
            if (data?.device) {
                return {
                    success: true,
                    data: {
                        ...data,
                        device: transformDeviceData(data.device),
                    },
                };
            }

            // Unexpected success response format
            return {
                success: false,
                error: {
                    message: 'Device registration failed: Unexpected response format',
                    code: 500,
                    details: 'Server returned success but missing device data',
                },
            };
        } catch (error) {
            console.error('Device registration error:', error);
            return {
                success: false,
                error: {
                    message: 'Device registration failed',
                    code: 0,
                    details: error instanceof Error ? error.message : 'Unknown error occurred',
                },
            };
        }
    }

    /**
     * Update device information (name, trust status)
     */
    async updateDevice(deviceId: string, request: DeviceUpdateRequest): Promise<ApiResponse<Device>> {
        const response = await apiService.put<any>(`/devices/${deviceId}`, request);
        if (response.success && response.data) {
            return {
                success: true,
                data: transformDeviceData(response.data),
            };
        }
        return response as ApiResponse<Device>;
    }

    /**
     * Revoke device access (delete device)
     */
    async revokeDevice(deviceId: string): Promise<ApiResponse<{ message: string; note?: string }>> {
        return apiService.delete(`/devices/${deviceId}`);
    }

    /**
     * Approve an untrusted device
     */
    async approveDevice(deviceId: string): Promise<ApiResponse<DeviceRegistrationResponse>> {
        const response = await apiService.post<any>(`/devices/${deviceId}/approve`, {});
        if (response.success && response.data?.device) {
            return {
                success: true,
                data: {
                    ...response.data,
                    device: transformDeviceData(response.data.device),
                },
            };
        }
        return response as ApiResponse<DeviceRegistrationResponse>;
    }

    /**
     * Get device public key
     */
    async getDeviceKeys(deviceId: string): Promise<ApiResponse<{ publicKey: string }>> {
        return apiService.get<{ publicKey: string }>(`/devices/${deviceId}/keys`);
    }

    /**
     * Generate ECDH key pair for device registration (client-side)
     * This uses the Web Crypto API for actual cryptographic key generation
     */
    async generateKeyPair(): Promise<ECDHKeyPair> {
        if (!window.crypto?.subtle) {
            throw new Error('Web Crypto API not available');
        }

        // Generate ECDH key pair
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "ECDH",
                namedCurve: "P-256"
            },
            true, // extractable
            ["deriveKey"]
        );

        // Export public key
        const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
        const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));

        // Export private key (unencrypted - will be encrypted separately)
        const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
        const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));

        return {
            publicKey: publicKeyBase64,
            privateKey: privateKeyBase64, // Unencrypted for now
            curve: "P-256"
        };
    }

    /**
     * Update device last used timestamp
     * This is typically called automatically when the device makes API requests
     */
    async updateLastUsed(deviceId: string): Promise<ApiResponse<void>> {
        return apiService.post<void>(`/devices/${deviceId}/ping`, {});
    }

    /**
     * Get current device information from the token
     * This helps identify which device is currently being used
     */
    async getCurrentDevice(): Promise<ApiResponse<Device>> {
        const response = await apiService.get<any>('/devices/current');
        if (response.success && response.data) {
            return {
                success: true,
                data: transformDeviceData(response.data),
            };
        }
        return response as ApiResponse<Device>;
    }

    /**
     * Get all trusted device public keys for encryption
     * Used when encrypting notes to share with other devices
     */
    async getTrustedDeviceKeys(): Promise<ApiResponse<Array<{ deviceId: string; publicKey: string }>>> {
        return apiService.get<Array<{ deviceId: string; publicKey: string }>>('/devices/trusted-keys');
    }

    /**
     * Share encrypted note key with specific devices
     * Called when creating/updating notes to ensure all trusted devices can decrypt
     */
    async shareNoteKey(noteId: string, deviceKeys: Array<{ deviceId: string; encryptedKey: string }>): Promise<ApiResponse<void>> {
        return apiService.post<void>(`/notes/${noteId}/device-keys`, { deviceKeys });
    }

    /**
     * Get encrypted note key for current device
     * Used when decrypting notes on this device
     */
    async getNoteKeyForDevice(noteId: string, deviceId: string): Promise<ApiResponse<{ encryptedKey: string }>> {
        return apiService.get<{ encryptedKey: string }>(`/notes/${noteId}/device-keys/${deviceId}`);
    }

    /**
     * Generate and store device key pair using Web Crypto API
     * This should be called during device registration
     */
    async generateAndStoreKeyPair(password: string): Promise<ECDHKeyPair> {
        if (!window.crypto?.subtle) {
            throw new Error('Web Crypto API not available');
        }

        // Generate ECDH key pair
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "ECDH",
                namedCurve: "P-256"
            },
            true, // extractable
            ["deriveKey"]
        );

        // Export public key
        const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
        const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));

        // Export private key
        const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

        // Encrypt private key with password (simplified - use proper key derivation in production)
        const passwordKey = await window.crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const encryptionKey = await window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            passwordKey,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt"]
        );

        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedPrivateKey = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            encryptionKey,
            privateKeyBuffer
        );

        // Combine salt, iv, and encrypted private key
        const combinedBuffer = new Uint8Array(salt.length + iv.length + encryptedPrivateKey.byteLength);
        combinedBuffer.set(salt, 0);
        combinedBuffer.set(iv, salt.length);
        combinedBuffer.set(new Uint8Array(encryptedPrivateKey), salt.length + iv.length);

        const encryptedPrivateKeyBase64 = btoa(String.fromCharCode(...combinedBuffer));

        return {
            publicKey: publicKeyBase64,
            privateKey: encryptedPrivateKeyBase64,
            curve: "P-256"
        };
    }

    /**
     * Auto-detect device information for registration
     */
    getDeviceInfo(): { deviceName: string; deviceType: string; platform: string } {
        const userAgent = navigator.userAgent;
        const platform = navigator.platform || 'Unknown';

        // Detect device type
        let deviceType = 'desktop';
        if (/iPad/i.test(userAgent)) {
            deviceType = 'tablet';
        } else if (/iPhone|Android.*Mobile/i.test(userAgent)) {
            deviceType = 'mobile';
        } else if (/Macintosh.*Intel|Windows.*x64|Linux.*x86_64/i.test(userAgent)) {
            deviceType = /MacBook/i.test(userAgent) ? 'laptop' : 'desktop';
        }

        // Generate a default device name
        const hostname = window.location.hostname;
        const browserName = this.getBrowserName();
        const deviceName = `${browserName} on ${platform}${hostname !== 'localhost' ? ` (${hostname})` : ''}`;

        return {
            deviceName,
            deviceType,
            platform: `${platform} - ${browserName}`,
        };
    }

    private getBrowserName(): string {
        const userAgent = navigator.userAgent;
        if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) return 'Chrome';
        if (/Firefox/i.test(userAgent)) return 'Firefox';
        if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) return 'Safari';
        if (/Edge/i.test(userAgent)) return 'Edge';
        return 'Browser';
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
     * Share encryption keys with a newly approved device
     * This is called from a trusted device when approving a new device
     */
    async shareKeysWithDevice(targetDeviceId: string, _password: string): Promise<ApiResponse<void>> {
        try {
            // Get current device's encrypted private key
            const encryptedPrivateKey = this.getEncryptedPrivateKey();
            if (!encryptedPrivateKey) {
                throw new Error('Current device private key not found');
            }

            // Get target device's public key
            const targetDeviceResponse = await this.getDeviceKeys(targetDeviceId);
            if (!targetDeviceResponse.success || !targetDeviceResponse.data) {
                throw new Error('Could not get target device public key');
            }

            // Get all encrypted notes that this device can access
            const notesResponse = await apiService.get<any[]>('/notes');
            if (!notesResponse.success || !notesResponse.data) {
                return { success: true, data: undefined }; // No notes to share
            }

            // For each note, re-encrypt the AES key for the new device
            for (const note of notesResponse.data) {
                if (note.encrypted && note.deviceKeys) {
                    // Find current device's encrypted key for this note
                    const currentDeviceResponse = await this.getCurrentDevice();
                    if (!currentDeviceResponse.success) continue;

                    const currentDeviceKey = note.deviceKeys.find(
                        (dk: any) => dk.deviceId === currentDeviceResponse.data?.id
                    );

                    if (currentDeviceKey) {
                        // TODO: Decrypt the note key with current device, then re-encrypt for target device
                        // This requires integration with the crypto service
                        console.log(`Sharing note ${note.id} with device ${targetDeviceId}`);
                    }
                }
            }

            return { success: true, data: undefined };
        } catch (error) {
            console.error('Key sharing failed:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to share keys with device',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    /**
     * Enhanced approve device method that also shares encryption keys
     */
    async approveDeviceWithKeySharing(deviceId: string, password: string): Promise<ApiResponse<DeviceRegistrationResponse>> {
        try {
            // First approve the device on the server
            const approvalResponse = await this.approveDevice(deviceId);
            if (!approvalResponse.success) {
                return approvalResponse;
            }

            // Then share encryption keys with the newly approved device
            const keySharingResponse = await this.shareKeysWithDevice(deviceId, password);
            if (!keySharingResponse.success) {
                console.warn('Device approved but key sharing failed:', keySharingResponse.error);
                // Don't fail the approval, but log the issue
            }

            return approvalResponse;
        } catch (error) {
            console.error('Device approval with key sharing failed:', error);
            return {
                success: false,
                error: {
                    message: 'Device approval failed',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    /**
     * Check if current device can decrypt notes
     */
    async canDecryptNotes(): Promise<boolean> {
        const currentDevice = await this.getCurrentDevice();
        if (!currentDevice.success || !currentDevice.data) {
            return false;
        }

        return currentDevice.data.trusted && !!this.getEncryptedPrivateKey();
    }

    /**
     * Recovery: Regenerate device keys using recovery keys
     * Used when all devices are lost and user has recovery keys
     */
    async recoverDeviceWithRecoveryKeys(recoveryKeys: string[], password: string): Promise<ApiResponse<void>> {
        try {
            // Validate recovery keys (this would normally check against server)
            // For now, we'll assume they're valid if properly formatted
            if (!Array.isArray(recoveryKeys) || recoveryKeys.length !== 12) {
                throw new Error('Invalid recovery keys format');
            }

            // Generate new device keys
            const keyPair = await this.generateAndStoreKeyPair(password);

            // Store the new encrypted private key
            this.storeEncryptedPrivateKey(keyPair.privateKey);

            // Register this device as a recovery device
            const deviceInfo = this.getDeviceInfo();
            const recoveryRequest = {
                deviceName: `${deviceInfo.deviceName} (Recovered)`,
                deviceType: deviceInfo.deviceType,
                password: password,
                publicKey: keyPair.publicKey,
                recoveryKeys: recoveryKeys
            };

            // Send recovery request to server
            const response = await apiService.post<any>('/devices/recover', recoveryRequest);

            if (response.success) {
                return { success: true, data: undefined };
            } else {
                this.clearEncryptedPrivateKey();
                return response;
            }
        } catch (error) {
            console.error('Device recovery failed:', error);
            return {
                success: false,
                error: {
                    message: 'Device recovery failed',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
}

// Export singleton instance
export const devicesService = new DevicesService();
export default devicesService;
