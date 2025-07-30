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
                // For each group, calculate the actual member count from the people table
                const groups: Group[] = [];
                for (const item of localGroups) {
                    // Parse tags if they're stored as JSON string
                    let tags: string[] = [];
                    if (item.tags) {
                        try {
                            tags = typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags;
                        } catch (e) {
                            tags = [];
                        }
                    }

                    // Get actual member count from junction table
                    const memberRelations = await databaseService.findAll<any>('people_groups', 'group_id = ?', [item.id]);
                    const actualMemberCount = memberRelations.length;

                    // Update the stored member count if it's wrong
                    if (item.member_count !== actualMemberCount) {
                        await databaseService.update('groups', item.id, {
                            member_count: actualMemberCount,
                            updated_at: new Date().toISOString()
                        });
                    }

                    groups.push({
                        id: item.id,
                        name: item.name || '',
                        description: item.description || '',
                        tags: tags,
                        color: item.color || '',
                        memberCount: actualMemberCount,
                        userId: item.user_id || 'current-user',
                        type: item.type as 'team' | 'project' | 'customer' | 'interest' | undefined,
                        createdAt: item.created_at,
                        updatedAt: item.updated_at,
                        members: [] // Members are loaded separately
                    });
                }

                return {
                    success: true,
                    data: groups
                };
            }

            // Fallback to empty array if no local data
            // Sync will happen in background via sync service

            return {
                success: true,
                data: []
            };
        } catch (error) {
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
        try {
            // Try local database first
            const localGroup = await databaseService.findById<any>('groups', id);

            if (localGroup && !localGroup.deleted_at) {
                // Transform database record to frontend Group type
                let tags: string[] = [];
                if (localGroup.tags) {
                    try {
                        tags = typeof localGroup.tags === 'string' ? JSON.parse(localGroup.tags) : localGroup.tags;
                    } catch (e) {
                        tags = [];
                    }
                }

                const group: Group = {
                    id: localGroup.id,
                    name: localGroup.name || '',
                    description: localGroup.description || '',
                    tags: tags,
                    color: localGroup.color || '',
                    memberCount: localGroup.member_count || 0,
                    userId: localGroup.user_id || 'current-user',
                    type: localGroup.type as 'team' | 'project' | 'customer' | 'interest' | undefined,
                    createdAt: localGroup.created_at,
                    updatedAt: localGroup.updated_at,
                    members: [] // Members are loaded separately
                };

                return {
                    success: true,
                    data: group
                };
            }

            // Group not found locally
            return {
                success: false,
                error: {
                    message: 'Group not found',
                    code: 404,
                    details: 'Group does not exist in local database'
                }
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    message: 'Failed to get group',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    async createGroup(data: CreateGroupRequest): Promise<ApiResponse<Group>> {
        try {
            const id = crypto.randomUUID();
            const now = new Date().toISOString();

            const newGroup: Group = {
                id,
                name: data.name,
                description: data.description || '',
                tags: data.tags || [],
                color: data.color || '',
                memberCount: 0,
                userId: 'current-user', // TODO: Get actual user ID
                createdAt: now,
                updatedAt: now,
                members: [],
                type: data.type
            };

            // Store in local database immediately
            const dbGroup = {
                id,
                user_id: 'current-user', // TODO: Get actual user ID
                name: data.name,
                description: data.description || '',
                tags: JSON.stringify(data.tags || []),
                color: data.color || '',
                type: data.type || null,
                member_count: 0,
                created_at: now,
                updated_at: now
            };

            await databaseService.insert('groups', dbGroup);

            // Sync with server if online
            if (syncService.isConnected()) {
                try {
                    const apiData = {
                        id,
                        name: data.name,
                        description: data.description,
                        tags: data.tags,
                        color: data.color,
                        created_at: now,
                        updated_at: now
                    };

                    const response = await apiService.post<any>('/groups', apiData);

                    if (response.success) {
                        await databaseService.markSynced('groups', id);
                    }
                } catch (error) {
                    // Group is already stored locally, so we can return success
                }
            }

            return {
                success: true,
                data: newGroup
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    message: 'Failed to create group locally',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    async updateGroup(id: string, data: UpdateGroupRequest): Promise<ApiResponse<Group>> {
        try {

            // Get current group from local database
            const currentGroup = await databaseService.findById<any>('groups', id);
            if (!currentGroup) {
                return {
                    success: false,
                    error: {
                        message: 'Group not found',
                        code: 404,
                        details: 'Group does not exist'
                    }
                };
            }

            // Apply updates
            const now = new Date().toISOString();
            const dbUpdates: any = {
                updated_at: now
            };

            if (data.name !== undefined) dbUpdates.name = data.name;
            if (data.description !== undefined) dbUpdates.description = data.description || '';
            if (data.tags !== undefined) dbUpdates.tags = JSON.stringify(data.tags);
            if (data.color !== undefined) dbUpdates.color = data.color || '';
            if (data.type !== undefined) dbUpdates.type = data.type;

            // Update in local database
            await databaseService.update('groups', id, dbUpdates);

            // Sync with server if online
            if (syncService.isConnected()) {
                try {
                    const apiData: any = {};
                    if (data.name !== undefined) apiData.name = data.name;
                    if (data.description !== undefined) apiData.description = data.description;
                    if (data.tags !== undefined) apiData.tags = data.tags;
                    if (data.color !== undefined) apiData.color = data.color;
                    if (data.type !== undefined) apiData.type = data.type;

                    const response = await apiService.put<any>(`/groups/${id}`, apiData);

                    if (response.success) {
                        await databaseService.markSynced('groups', id);
                    }
                } catch (error) {
                }
            }

            // Return updated group
            const updatedGroup = await databaseService.findById<any>('groups', id);
            if (!updatedGroup) {
                throw new Error('Failed to retrieve updated group');
            }

            // Transform to frontend format
            let tags: string[] = [];
            if (updatedGroup.tags) {
                try {
                    tags = typeof updatedGroup.tags === 'string' ? JSON.parse(updatedGroup.tags) : updatedGroup.tags;
                } catch (e) {
                    tags = [];
                }
            }

            const group: Group = {
                id: updatedGroup.id,
                name: updatedGroup.name || '',
                description: updatedGroup.description || '',
                tags: tags,
                color: updatedGroup.color || '',
                memberCount: updatedGroup.member_count || 0,
                userId: updatedGroup.user_id || 'current-user',
                createdAt: updatedGroup.created_at,
                updatedAt: updatedGroup.updated_at,
                members: []
            };

            return {
                success: true,
                data: group
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    message: 'Failed to update group locally',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    async getGroupMembers(groupId: string): Promise<ApiResponse<Person[]>> {
        try {

            // Get all people who belong to this group via junction table
            const memberRelations = await databaseService.findAll<any>('people_groups', 'group_id = ?', [groupId]);

            // Get the actual people data
            const members = [];
            for (const relation of memberRelations) {
                const person = await databaseService.findById<any>('people', relation.person_id);
                if (person && !person.deleted_at) {
                    members.push(person);
                }
            }


            // Transform database records to frontend Person type
            const transformedMembers: Person[] = members.map(member => ({
                id: member.id,
                firstName: member.first_name,
                lastName: member.last_name,
                email: member.email,
                phone: member.phone,
                avatarUrl: member.avatar_url,
                avatar: member.avatar_url,
                jobDescription: member.job_description,
                position: member.job_description,
                githubUsername: member.github_username,
                tags: member.tags ? JSON.parse(member.tags) : [],
                group: { id: groupId, name: '' }, // Group name would need separate lookup
                counts: member.counts ? JSON.parse(member.counts) : { notes: 0, achievements: 0, actions: 0 },
                engagementScore: 0, // Could calculate this from counts
                createdAt: member.created_at,
                updatedAt: member.updated_at
            }));

            return {
                success: true,
                data: transformedMembers
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    message: 'Failed to get group members',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    async addGroupMember(groupId: string, personId: string): Promise<ApiResponse<void>> {
        return this.addGroupMembers(groupId, [personId]);
    }

    async removeGroupMember(groupId: string, personId: string): Promise<ApiResponse<void>> {
        return this.removeGroupMembers(groupId, [personId]);
    }

    async removeGroupMembers(groupId: string, personIds: string[]): Promise<ApiResponse<void>> {
        try {

            // Verify group exists
            const group = await databaseService.findById<any>('groups', groupId);
            if (!group) {
                return {
                    success: false,
                    error: {
                        message: 'Group not found',
                        code: 404,
                        details: 'Group does not exist'
                    }
                };
            }

            // Remove each person from the group via junction table
            for (const personId of personIds) {
                const person = await databaseService.findById<any>('people', personId);
                if (!person) {
                    continue;
                }

                // Find and remove the relationship
                const existingRelations = await databaseService.findAll<any>('people_groups', 'person_id = ? AND group_id = ?', [personId, groupId]);
                for (const relation of existingRelations) {
                    await databaseService.delete('people_groups', relation.id);
                }
            }

            // Update group member count
            const currentRelations = await databaseService.findAll<any>('people_groups', 'group_id = ?', [groupId]);
            await databaseService.update('groups', groupId, {
                member_count: currentRelations.length,
                updated_at: new Date().toISOString()
            });

            // Sync with server if online
            if (syncService.isConnected()) {
                try {
                    const response = await apiService.delete<void>(`/groups/${groupId}/members`);
                    if (response.success) {
                        // Mark both group and people as synced
                        await databaseService.markSynced('groups', groupId);
                        for (const personId of personIds) {
                            await databaseService.markSynced('people', personId);
                        }
                    }
                } catch (error) {
                }
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: {
                    message: 'Failed to remove group members',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    async addGroupMembers(groupId: string, personIds: string[]): Promise<ApiResponse<void>> {
        try {

            // Verify group exists
            const group = await databaseService.findById<any>('groups', groupId);
            if (!group) {
                return {
                    success: false,
                    error: {
                        message: 'Group not found',
                        code: 404,
                        details: 'Group does not exist'
                    }
                };
            }

            // Add each person to the group via junction table
            for (const personId of personIds) {
                const person = await databaseService.findById<any>('people', personId);
                if (!person) {
                    continue;
                }

                // Check if relationship already exists
                const existingRelation = await databaseService.findAll<any>('people_groups', 'person_id = ? AND group_id = ?', [personId, groupId]);
                if (existingRelation.length > 0) {
                    continue;
                }

                // Create new relationship
                const relationId = crypto.randomUUID();
                await databaseService.insert('people_groups', {
                    id: relationId,
                    person_id: personId,
                    group_id: groupId,
                    created_at: new Date().toISOString()
                });
            }

            // Update group member count
            const currentRelations = await databaseService.findAll<any>('people_groups', 'group_id = ?', [groupId]);
            await databaseService.update('groups', groupId, {
                member_count: currentRelations.length,
                updated_at: new Date().toISOString()
            });

            // Sync with server if online
            if (syncService.isConnected()) {
                try {
                    const response = await apiService.post<void>(`/groups/${groupId}/members`, { memberIds: personIds });
                    if (response.success) {
                        // Mark both group and people as synced
                        await databaseService.markSynced('groups', groupId);
                        for (const personId of personIds) {
                            await databaseService.markSynced('people', personId);
                        }
                    }
                } catch (error) {
                }
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: {
                    message: 'Failed to add group members',
                    code: 500,
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
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

    // Helper function for testing - assign some people to groups
    async assignPeopleToGroupsForTesting(): Promise<void> {
        try {

            // Get all groups and people
            const groupsResponse = await this.getGroups();
            const allPeople = await databaseService.findAll<any>('people', 'deleted_at IS NULL');

            if (!groupsResponse.success || !groupsResponse.data || groupsResponse.data.length === 0) {
                return;
            }

            if (allPeople.length === 0) {
                return;
            }

            const groups = groupsResponse.data;

            // Assign first half of people to first group, second half to second group
            const firstGroup = groups[0];
            const secondGroup = groups[1] || firstGroup; // Use first group if only one exists

            const halfwayPoint = Math.ceil(allPeople.length / 2);
            const firstHalf = allPeople.slice(0, halfwayPoint);
            const secondHalf = allPeople.slice(halfwayPoint);

            // Assign first half to first group
            if (firstHalf.length > 0) {
                await this.addGroupMembers(firstGroup.id, firstHalf.map(p => p.id));
            }

            // Assign second half to second group
            if (secondHalf.length > 0 && secondGroup.id !== firstGroup.id) {
                await this.addGroupMembers(secondGroup.id, secondHalf.map(p => p.id));
            }

        } catch (error) {
        }
    }
}

export const groupsService = new GroupsService();
