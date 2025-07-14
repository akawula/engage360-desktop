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
     * Register a new device
     *
     * NOTE: This method bypasses the standard apiService.post() to avoid automatic
     * token refresh retries on 401 errors. For device registration, a 401 status
     * specifically means "invalid password" and should not trigger token refresh.
     */
    async registerDevice(request: DeviceRegistrationRequest): Promise<ApiResponse<DeviceRegistrationResponse>> {
        try {
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

            const fetchResponse = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(request),
            });

            let data;
            const contentType = fetchResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await fetchResponse.json();
            } else {
                data = await fetchResponse.text();
            }

            if (!fetchResponse.ok) {
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
     * This would typically be done using Web Crypto API in a real implementation
     */
    async generateKeyPair(): Promise<ECDHKeyPair> {
        // In a real implementation, this would use the Web Crypto API
        // For now, we'll return a placeholder that would be replaced
        // with actual cryptographic key generation
        throw new Error('Key generation should be implemented using Web Crypto API');
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
}

// Export singleton instance
export const devicesService = new DevicesService();
export default devicesService;
