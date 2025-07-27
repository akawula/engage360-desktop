import { apiService } from './apiService';
import { databaseService } from './databaseService';
import { syncService } from './syncService';
import type { Group, CreateGroupRequest, ApiResponse, Person } from '../types';

export interface UpdateGroupRequest {
    name?: string;
    description?: string;
    tags?: string[];
    color?: string;
    type?: 'team' | 'project' | 'customer' | 'interest';
}

class GroupsService {
    async getGroups(): Promise<ApiResponse<Group[]>> {
        try {
            // Try to get from local database first
            const localGroups = await databaseService.findAll<any>('groups', 'deleted_at IS NULL');
            
            if (localGroups && localGroups.length >= 0) {
                // Transform database records to frontend Group type
                const groups: Group[] = localGroups.map(item => {
                    // Parse tags if they're stored as JSON string
                    let tags: string[] = [];
                    if (item.tags) {
                        try {
                            tags = typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags;
                        } catch (e) {
                            tags = [];
                        }
                    }

                    return {
                        id: item.id,
                        name: item.name || '',
                        description: item.description || '',
                        tags: tags,
                        color: item.color || '',
                        memberCount: item.member_count || 0,
                        createdAt: item.created_at,
                        updatedAt: item.updated_at,
                        members: [] // Members are loaded separately
                    };
                });

                return {
                    success: true,
                    data: groups
                };
            }

            // Fallback to API if no local data (trigger sync in background)
            console.log('No local groups found, triggering sync...');
            syncService.syncData().catch(error => {
                console.warn('Background sync failed:', error);
            });

            return {
                success: true,
                data: []
            };
        } catch (error) {
            console.error('Error fetching groups from local database:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to fetch groups from local database',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    async getGroupById(id: string): Promise<ApiResponse<Group>> {
        return apiService.get<Group>(`/groups/${id}`);
    }

    async createGroup(data: CreateGroupRequest): Promise<ApiResponse<Group>> {
        return apiService.post<Group>('/groups', data);
    }

    async updateGroup(id: string, data: UpdateGroupRequest): Promise<ApiResponse<Group>> {
        return apiService.put<Group>(`/groups/${id}`, data);
    }

    async getGroupMembers(groupId: string): Promise<ApiResponse<Person[]>> {
        return apiService.get<Person[]>(`/groups/${groupId}/members`);
    }

    async addGroupMember(groupId: string, personId: string): Promise<ApiResponse<void>> {
        return apiService.post<void>(`/groups/${groupId}/members`, { memberIds: [personId] });
    }

    async addGroupMembers(groupId: string, personIds: string[]): Promise<ApiResponse<void>> {
        return apiService.post<void>(`/groups/${groupId}/members`, { memberIds: personIds });
    }

    async getGroupsByPersonId(personId: string): Promise<ApiResponse<Group[]>> {
        const groupsResponse = await this.getGroups();

        if (!groupsResponse.success || !groupsResponse.data) {
            return groupsResponse;
        }

        const personGroups = groupsResponse.data.filter(group =>
            group.members?.some(member => member.id === personId)
        );

        return {
            success: true,
            data: personGroups
        };
    }
}

export const groupsService = new GroupsService();
