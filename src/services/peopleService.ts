import { apiService } from './apiService';
import { databaseService } from './databaseService';
import { syncService } from './syncService';
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
        phone: apiPerson.phone === null ? undefined : apiPerson.phone,
        avatar: apiPerson.avatar_url,
        avatarUrl: apiPerson.avatar_url, // Add this for consistency
        position: apiPerson.job_description === null ? undefined : apiPerson.job_description,
        jobDescription: apiPerson.job_description === null ? undefined : apiPerson.job_description, // Add this for consistency
        githubUsername: apiPerson.github_username === null ? undefined : apiPerson.github_username,
        tags: tags,
        lastInteraction: apiPerson.last_interaction,
        engagementScore: engagementScore,
        notes: [], // Notes would come from a separate endpoint
        groups: apiPerson.groups || [], // Include groups from API
        createdAt: apiPerson.created_at,
        updatedAt: apiPerson.updated_at,
        counts: apiPerson.counts,
        group: apiPerson.group,
    };
}

export class PeopleService {
    async getPeople(params?: GetPeopleParams): Promise<ApiResponse<PeopleListResponse>> {
        // Try to get from local database first
        try {
            let whereClause = '';
            let queryParams: any[] = [];
            
            if (params?.search) {
                whereClause = 'first_name LIKE ? OR last_name LIKE ? OR email LIKE ?';
                const searchTerm = `%${params.search}%`;
                queryParams = [searchTerm, searchTerm, searchTerm];
            }
            
            const localPeople = await databaseService.findAll<any>('people', whereClause, queryParams);
            
            if (localPeople.length > 0) {
                // Apply offset and limit
                const offset = params?.offset || 0;
                const limit = params?.limit || localPeople.length;
                const paginatedPeople = localPeople.slice(offset, offset + limit);
                
                const transformedPeople = await Promise.all(
                    paginatedPeople.map(person => this.transformPersonFromDB(person))
                );

                const transformedData: PeopleListResponse = {
                    people: transformedPeople,
                    total: localPeople.length
                };
                
                return {
                    success: true,
                    data: transformedData
                };
            }
        } catch (error) {
            console.warn('Failed to get people from local database, falling back to API:', error);
        }

        // Fallback to API if local database is empty or fails
        if (syncService.isConnected()) {
            const queryParams = new URLSearchParams();

            if (params?.limit) queryParams.append('limit', params.limit.toString());
            if (params?.offset) queryParams.append('offset', params.offset.toString());
            if (params?.search) queryParams.append('search', params.search);

            const queryString = queryParams.toString();
            const endpoint = `/people${queryString ? `?${queryString}` : ''}`;

            const response = await apiService.get<any>(endpoint);

            if (response.success && response.data) {
                let peopleArray = response.data;

                if (response.data.people && Array.isArray(response.data.people)) {
                    peopleArray = response.data.people;
                }

                // Store in local database for offline access
                try {
                    for (const person of peopleArray) {
                        const dbPerson = this.transformPersonForDB(person);
                        await databaseService.insert('people', dbPerson);
                    }
                } catch (error) {
                    console.warn('Failed to cache people in local database:', error);
                }

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

        // Offline mode - return empty result
        return {
            success: false,
            error: { message: 'Offline and no local data available', code: 503, details: 'No network connection' }
        };
    }

    async getPersonById(id: string): Promise<ApiResponse<Person>> {
        // Try local database first
        try {
            const localPerson = await databaseService.findById('people', id);
            if (localPerson) {
                return {
                    success: true,
                    data: await this.transformPersonFromDB(localPerson)
                };
            }
        } catch (error) {
            console.warn('Failed to get person from local database:', error);
        }

        // Fallback to API
        if (syncService.isConnected()) {
            const response = await apiService.get<any>(`/people/${id}`);

            if (response.success && response.data) {
                // Cache in local database
                try {
                    const dbPerson = this.transformPersonForDB(response.data);
                    await databaseService.insert('people', dbPerson);
                } catch (error) {
                    console.warn('Failed to cache person in local database:', error);
                }

                return {
                    success: true,
                    data: transformPersonFromAPI(response.data)
                };
            }

            return response as ApiResponse<Person>;
        }

        return {
            success: false,
            error: { message: 'Person not found offline', code: 404, details: 'No network connection' }
        };
    }

    async createPerson(personData: CreatePersonRequest): Promise<ApiResponse<Person>> {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        
        const newPerson: Person = {
            id,
            firstName: personData.firstName,
            lastName: personData.lastName,
            email: personData.email,
            phone: personData.phone,
            jobDescription: personData.position,
            githubUsername: personData.githubUsername,
            avatarUrl: personData.avatarUrl,
            tags: personData.tags || [],
            counts: { notes: 0, achievements: 0, actions: 0 },
            createdAt: now,
            updatedAt: now
        };

        // Store in local database immediately
        try {
            const dbPerson = this.transformPersonForDB(newPerson);
            await databaseService.insert('people', dbPerson);
        } catch (error) {
            console.error('Failed to store person in local database:', error);
            return {
                success: false,
                error: { message: 'Failed to create person locally', code: 500, details: error.toString() }
            };
        }

        // Sync with server if online
        if (syncService.isConnected()) {
            try {
                const apiData: any = {
                    id,
                    first_name: personData.firstName,
                    last_name: personData.lastName,
                    email: personData.email,
                    phone: personData.phone,
                    job_description: personData.position,
                    github_username: personData.githubUsername,
                    tags: personData.tags,
                    created_at: now,
                    updated_at: now
                };

                if (personData.avatarUrl) {
                    apiData.avatar_url = personData.avatarUrl;
                }

                const response = await apiService.post<any>('/people', apiData);
                
                if (response.success) {
                    // Update local record with server response if needed
                    await databaseService.markSynced('people', id);
                }
            } catch (error) {
                console.warn('Failed to sync person to server, will retry later:', error);
                // Person is already stored locally, so we can return success
            }
        }

        return {
            success: true,
            data: newPerson
        };
    }

    async updatePerson(id: string, updates: Partial<CreatePersonRequest & { avatarUrl?: string }>): Promise<ApiResponse<Person>> {
        // Get current person from local database
        const currentPerson = await databaseService.findById<any>('people', id);
        if (!currentPerson) {
            return {
                success: false,
                error: { message: 'Person not found', code: 404, details: 'Person does not exist' }
            };
        }

        // Apply updates
        const dbUpdates: any = {
            updated_at: new Date().toISOString()
        };

        if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
        if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone || null;
        if (updates.position !== undefined) dbUpdates.job_description = updates.position || null;
        if (updates.githubUsername !== undefined) dbUpdates.github_username = updates.githubUsername || null;
        if (updates.tags !== undefined) dbUpdates.tags = JSON.stringify(updates.tags);
        if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl || null;

        // Update in local database
        try {
            await databaseService.update('people', id, dbUpdates);
        } catch (error) {
            console.error('Failed to update person in local database:', error);
            return {
                success: false,
                error: { message: 'Failed to update person locally', code: 500, details: error.toString() }
            };
        }

        // Sync with server if online
        if (syncService.isConnected()) {
            try {
                const apiData: any = {};
                if (updates.firstName !== undefined) apiData.first_name = updates.firstName;
                if (updates.lastName !== undefined) apiData.last_name = updates.lastName;
                if (updates.email !== undefined) apiData.email = updates.email;
                if (updates.phone !== undefined) apiData.phone = updates.phone || null;
                if (updates.position !== undefined) apiData.job_description = updates.position || null;
                if (updates.githubUsername !== undefined) apiData.github_username = updates.githubUsername || null;
                if (updates.tags !== undefined) apiData.tags = updates.tags;
                if (updates.avatarUrl !== undefined) apiData.avatar_url = updates.avatarUrl || null;

                const response = await apiService.put<any>(`/people/${id}`, apiData);
                
                if (response.success) {
                    await databaseService.markSynced('people', id);
                }
            } catch (error) {
                console.warn('Failed to sync person update to server, will retry later:', error);
            }
        }

        // Return updated person
        const updatedPerson = await databaseService.findById<any>('people', id);
        return {
            success: true,
            data: await this.transformPersonFromDB(updatedPerson!)
        };
    }

    async deletePerson(id: string): Promise<ApiResponse<void>> {
        // Delete from local database
        try {
            await databaseService.delete('people', id);
        } catch (error) {
            console.error('Failed to delete person from local database:', error);
            return {
                success: false,
                error: { message: 'Failed to delete person locally', code: 500, details: error.toString() }
            };
        }

        // Delete from server if online
        if (syncService.isConnected()) {
            try {
                await apiService.delete<void>(`/people/${id}`);
            } catch (error) {
                console.warn('Failed to delete person from server, will retry later:', error);
            }
        }

        return { success: true };
    }

    private async transformPersonFromDB(dbPerson: any): Promise<Person> {
        // Get groups for this person from junction table
        const groups: any[] = [];
        try {
            const groupRelations = await databaseService.findAll<any>('people_groups', 'person_id = ?', [dbPerson.id]);
            for (const relation of groupRelations) {
                const group = await databaseService.findById<any>('groups', relation.group_id);
                if (group && !group.deleted_at) {
                    groups.push({
                        id: group.id,
                        name: group.name,
                        color: group.color
                    });
                }
            }
        } catch (error) {
            console.warn('Failed to load groups for person:', dbPerson.id, error);
        }

        return {
            id: dbPerson.id,
            firstName: dbPerson.first_name,
            lastName: dbPerson.last_name,
            email: dbPerson.email,
            phone: dbPerson.phone,
            avatarUrl: dbPerson.avatar_url,
            avatar: dbPerson.avatar_url,
            jobDescription: dbPerson.job_description,
            position: dbPerson.job_description,
            githubUsername: dbPerson.github_username,
            tags: dbPerson.tags ? JSON.parse(dbPerson.tags) : [],
            groups: groups, // Use many-to-many groups
            group: groups.length > 0 ? groups[0] : undefined, // Backwards compatibility
            counts: dbPerson.counts ? JSON.parse(dbPerson.counts) : { notes: 0, achievements: 0, actions: 0 },
            engagementScore: calculateEngagementScore(dbPerson.counts ? JSON.parse(dbPerson.counts) : { notes: 0, achievements: 0, actions: 0 }),
            createdAt: dbPerson.created_at,
            updatedAt: dbPerson.updated_at
        };
    }

    private transformPersonForDB(person: any): any {
        return {
            id: person.id,
            first_name: person.first_name || person.firstName,
            last_name: person.last_name || person.lastName,
            email: person.email,
            phone: person.phone,
            avatar_url: person.avatar_url || person.avatarUrl,
            job_description: person.job_description || person.jobDescription || person.position,
            github_username: person.github_username || person.githubUsername,
            tags: typeof person.tags === 'string' ? person.tags : JSON.stringify(person.tags || []),
            group_id: person.group_id || person.group?.id,
            created_at: person.created_at || person.createdAt,
            updated_at: person.updated_at || person.updatedAt
        };
    }
}

export const peopleService = new PeopleService();