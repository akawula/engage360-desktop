import { apiService } from './apiService';
import type { Person, CreatePersonRequest, ApiResponse } from '../types';

export interface PeopleListResponse {
    people: Person[];
    total: number;
}

export interface GetPeopleParams {
    limit?: number;
    offset?: number;
    search?: string;
}

// Helper function to calculate engagement score based on activity counts
function calculateEngagementScore(counts: any): number {
    // Calculate engagement score based on activity counts
    // This is a simple algorithm that can be refined based on business requirements
    const notesWeight = 3;
    const achievementsWeight = 5;
    const actionsWeight = 2;

    const notesCount = counts?.notes || 0;
    const achievementsCount = counts?.achievements || 0;
    const actionsCount = counts?.actions || 0;

    const totalActivity = (notesCount * notesWeight) +
        (achievementsCount * achievementsWeight) +
        (actionsCount * actionsWeight);

    // Normalize to 0-100 scale
    // Adjust the divisor based on what constitutes "high engagement"
    const maxExpectedActivity = 50; // This can be tuned based on typical user activity
    const score = Math.min(100, Math.round((totalActivity / maxExpectedActivity) * 100));

    return score;
}

// Helper function to transform API response to frontend format
function transformPersonFromAPI(apiPerson: any): Person {
    // Handle tags - they might be a JSON string or already an array
    let tags: string[] = [];
    if (apiPerson.tags) {
        if (typeof apiPerson.tags === 'string') {
            try {
                tags = JSON.parse(apiPerson.tags);
            } catch (e) {
                // If parsing fails, treat as a single tag
                tags = [apiPerson.tags];
            }
        } else if (Array.isArray(apiPerson.tags)) {
            tags = apiPerson.tags;
        }
    }

    // Calculate engagement score based on activity counts
    const engagementScore = calculateEngagementScore(apiPerson.counts);

    return {
        id: apiPerson.id,
        firstName: apiPerson.first_name,
        lastName: apiPerson.last_name,
        email: apiPerson.email,
        phone: apiPerson.phone,
        avatar: apiPerson.avatar_url,
        position: apiPerson.job_description,
        githubUsername: apiPerson.github_username,
        tags: tags,
        lastInteraction: apiPerson.last_interaction,
        engagementScore: engagementScore,
        notes: [], // Notes would come from a separate endpoint
        groups: apiPerson.groups || [], // Include groups from API
        createdAt: apiPerson.created_at,
        updatedAt: apiPerson.updated_at,
    };
}

export class PeopleService {
    async getPeople(params?: GetPeopleParams): Promise<ApiResponse<PeopleListResponse>> {
        const queryParams = new URLSearchParams();

        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.offset) queryParams.append('offset', params.offset.toString());
        if (params?.search) queryParams.append('search', params.search);

        const queryString = queryParams.toString();
        const endpoint = `/people${queryString ? `?${queryString}` : ''}`;

        const response = await apiService.get<any>(endpoint);

        if (response.success && response.data) {
            // The API returns people directly as an array, not wrapped in an object
            let peopleArray = response.data;

            // If the response is wrapped in an object with a people property, use that
            if (response.data.people && Array.isArray(response.data.people)) {
                peopleArray = response.data.people;
            }

            // Transform the API response to match our frontend types
            const transformedData: PeopleListResponse = {
                people: Array.isArray(peopleArray) ? peopleArray.map(transformPersonFromAPI) : [],
                total: Array.isArray(peopleArray) ? peopleArray.length : (response.data.total || 0)
            };

            return {
                success: true,
                data: transformedData
            };
        }

        return response as ApiResponse<PeopleListResponse>;
    }

    async getPersonById(id: string): Promise<ApiResponse<Person>> {
        const response = await apiService.get<any>(`/people/${id}`);

        if (response.success && response.data) {
            return {
                success: true,
                data: transformPersonFromAPI(response.data)
            };
        }

        return response as ApiResponse<Person>;
    } async createPerson(personData: CreatePersonRequest): Promise<ApiResponse<Person>> {
        // Transform camelCase to snake_case for API
        const apiData = {
            first_name: personData.firstName,
            last_name: personData.lastName,
            email: personData.email,
            phone: personData.phone,
            job_description: personData.position,
            github_username: personData.githubUsername,
            tags: personData.tags,
        };

        const response = await apiService.post<any>('/people', apiData);

        if (response.success && response.data) {
            return {
                success: true,
                data: transformPersonFromAPI(response.data)
            };
        }

        return response as ApiResponse<Person>;
    }

    async updatePerson(id: string, updates: Partial<CreatePersonRequest>): Promise<ApiResponse<Person>> {
        // Transform camelCase to snake_case for API
        const apiData: any = {};

        if (updates.firstName !== undefined) apiData.first_name = updates.firstName;
        if (updates.lastName !== undefined) apiData.last_name = updates.lastName;
        if (updates.email !== undefined) apiData.email = updates.email;
        if (updates.phone !== undefined) apiData.phone = updates.phone;
        if (updates.position !== undefined) apiData.job_description = updates.position;
        if (updates.githubUsername !== undefined) apiData.github_username = updates.githubUsername;
        if (updates.tags !== undefined) apiData.tags = updates.tags;

        const response = await apiService.put<any>(`/people/${id}`, apiData);

        if (response.success && response.data) {
            return {
                success: true,
                data: transformPersonFromAPI(response.data)
            };
        }

        return response as ApiResponse<Person>;
    }

    async deletePerson(id: string): Promise<ApiResponse<void>> {
        return apiService.delete<void>(`/people/${id}`);
    }
}

export const peopleService = new PeopleService();
