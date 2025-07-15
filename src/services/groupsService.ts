import { apiService } from './apiService';
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
        return apiService.get<Group[]>('/groups');
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
