import { apiService } from './apiService';
import type { ApiResponse, UserProfile, AuthUser } from '../types';

class UserProfileService {
    async getUserProfile(): Promise<ApiResponse<UserProfile>> {
        try {
            const response = await apiService.get<any>('/users/profile');

            if (response.success) {
                let user: Partial<AuthUser>;

                // Handle the actual API response structure: response.data.user
                if (response.data?.user) {
                    user = response.data.user;
                }
                // Handle nested structure (legacy)
                else if (response.data?.data) {
                    user = response.data.data;
                }
                // Handle flat structure where user data is directly in response.data
                else if (response.data?.id) {
                    user = response.data;
                }
                else {
                    console.error('Unexpected profile response structure:', response);
                    return {
                        success: false,
                        error: { message: 'Invalid profile response format', code: 500 }
                    };
                }

                // Get stored user profile data to fill in missing fields (like firstName/lastName)
                const storedUserData = this.getStoredUserProfile();

                // Transform AuthUser to UserProfile format, filling in missing data from stored profile
                const userProfile: UserProfile = {
                    id: user.id || '',
                    firstName: user.firstName || storedUserData?.firstName || '',
                    lastName: user.lastName || storedUserData?.lastName || '',
                    email: user.email || '',
                    avatar: user.avatarUrl || storedUserData?.avatar,
                    preferences: storedUserData?.preferences || {
                        theme: 'auto',
                        notifications: {
                            email: true,
                            push: true,
                            actionItems: true
                        }
                    },
                    createdAt: user.createdAt || new Date().toISOString(),
                    updatedAt: user.updatedAt || new Date().toISOString()
                };

                // Store the enhanced profile data
                this.storeUserProfile(userProfile);

                return {
                    success: true,
                    data: userProfile
                };
            }

            return {
                success: false,
                error: response.error || { message: 'Failed to fetch user profile', code: 500 }
            };
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to fetch user profile',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    async updateUserProfile(profileData: {
        email?: string;
        firstName?: string;
        lastName?: string;
        avatar?: string;
    }): Promise<ApiResponse<UserProfile>> {
        try {
            // Transform avatar to avatarUrl for API
            const apiData = {
                ...profileData,
                avatarUrl: profileData.avatar,
            };
            delete apiData.avatar;

            const response = await apiService.put<any>('/users/profile', apiData);

            if (response.success) {
                let user: Partial<AuthUser>;

                // Handle different API response structures
                if (response.data?.data) {
                    user = response.data.data;
                } else if (response.data?.user) {
                    user = response.data.user;
                } else if (response.data?.id) {
                    user = response.data;
                } else {
                    console.error('Unexpected update response structure:', response);
                    return {
                        success: false,
                        error: { message: 'Invalid update response format', code: 500 }
                    };
                }

                // Get existing stored profile to preserve fields not returned by API
                const existingProfile = this.getStoredUserProfile();

                const userProfile: UserProfile = {
                    id: user.id || '',
                    firstName: user.firstName || profileData.firstName || '',
                    lastName: user.lastName || profileData.lastName || '',
                    email: user.email || profileData.email || '',
                    avatar: user.avatarUrl || profileData.avatar,
                    preferences: existingProfile?.preferences || {
                        theme: 'auto',
                        notifications: {
                            email: true,
                            push: true,
                            actionItems: true
                        }
                    },
                    createdAt: user.createdAt || existingProfile?.createdAt || '',
                    updatedAt: user.updatedAt || new Date().toISOString()
                };

                // Store the updated profile locally to persist fields not handled by API
                this.storeUserProfile(userProfile);

                return {
                    success: true,
                    data: userProfile
                };
            }

            return {
                success: false,
                error: response.error || { message: 'Failed to update user profile', code: 500 }
            };
        } catch (error) {
            console.error('Failed to update user profile:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to update user profile',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    async deleteAccount(): Promise<ApiResponse<void>> {
        try {
            const response = await apiService.delete('/users/account');
            return {
                success: response.success,
                error: response.error
            };
        } catch (error) {
            console.error('Failed to delete account:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to delete account',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    /**
     * Store user profile data locally for enhanced profile information
     */
    private storeUserProfile(userProfile: UserProfile): void {
        try {
            localStorage.setItem('extended_user_profile', JSON.stringify({
                firstName: userProfile.firstName,
                lastName: userProfile.lastName,
                avatar: userProfile.avatar,
                preferences: userProfile.preferences
            }));
        } catch (error) {
            console.error('Failed to store user profile:', error);
        }
    }

    /**
     * Get stored user profile data
     */
    private getStoredUserProfile(): Partial<UserProfile> | null {
        try {
            const stored = localStorage.getItem('extended_user_profile');
            if (!stored) return null;

            const parsed = JSON.parse(stored);

            // Clean up old data format by removing company/position fields if they exist
            if (parsed.company !== undefined || parsed.position !== undefined) {
                const cleaned = {
                    firstName: parsed.firstName,
                    lastName: parsed.lastName,
                    avatar: parsed.avatar,
                    preferences: parsed.preferences
                };
                localStorage.setItem('extended_user_profile', JSON.stringify(cleaned));
                return cleaned;
            }

            return parsed;
        } catch (error) {
            console.error('Failed to retrieve user profile:', error);
            return null;
        }
    }
}

export const userProfileService = new UserProfileService();
