/**
 * Test utility to verify many-to-many group assignments
 * This can be called from the browser console or integrated into the app
 */

import { groupsService } from '../services/groupsService';
import { databaseService } from '../services/databaseService';
import { syncService } from '../services/syncService';

export async function testGroupAssignments() {
  try {
    // 1. Get all groups and people
    const groupsResponse = await groupsService.getGroups();
    const allPeople = await databaseService.findAll<any>('people', 'deleted_at IS NULL');

    if (!groupsResponse.success || !groupsResponse.data) {
      return false;
    }

    const groups = groupsResponse.data;

    if (groups.length === 0) {
      return false;
    }

    if (allPeople.length === 0) {
      return false;
    }

    // 2. Clear existing assignments for clean test
    await databaseService.clearTable('people_groups');

    // Reset group member counts
    for (const group of groups) {
      await databaseService.update('groups', group.id, {
        member_count: 0,
        updated_at: new Date().toISOString()
      });
    }

    // 3. Test assignments
    const firstGroup = groups[0];
    const secondGroup = groups[1] || firstGroup;

    // Assign first half of people to first group
    const halfwayPoint = Math.ceil(allPeople.length / 2);
    const firstHalf = allPeople.slice(0, halfwayPoint);
    const secondHalf = allPeople.slice(halfwayPoint);

    const firstAssignmentResult = await groupsService.addGroupMembers(
      firstGroup.id,
      firstHalf.map(p => p.id)
    );

    if (!firstAssignmentResult.success) {
      return false;
    }

    // Assign second half to second group (if different)
    if (secondGroup.id !== firstGroup.id && secondHalf.length > 0) {
      const secondAssignmentResult = await groupsService.addGroupMembers(
        secondGroup.id,
        secondHalf.map(p => p.id)
      );

      if (!secondAssignmentResult.success) {
        return false;
      }
    }

    // 4. Test many-to-many by assigning one person to multiple groups
    if (groups.length > 1 && allPeople.length > 0) {
      const testPerson = allPeople[0];

      // Add the same person to all groups
      for (const group of groups) {
        await groupsService.addGroupMember(group.id, testPerson.id);
      }
    }

    // 5. Test member removal
    if (groups.length > 0 && allPeople.length > 0) {
      const testGroup = groups[0];
      const groupMembersResponse = await groupsService.getGroupMembers(testGroup.id);

      if (groupMembersResponse.success && groupMembersResponse.data && groupMembersResponse.data.length > 0) {
        const memberToRemove = groupMembersResponse.data[0];

        const removalResult = await groupsService.removeGroupMember(testGroup.id, memberToRemove.id);
        if (!removalResult.success) {
          return false;
        }
      }
    }

    return true;

  } catch (error) {
    return false;
  }
}

export async function logGroupMembershipStatus() {
  try {
    const groupsResponse = await groupsService.getGroups();
    if (!groupsResponse.success || !groupsResponse.data) {
      return;
    }

    for (const group of groupsResponse.data) {
      await groupsService.getGroupMembers(group.id);
      // Status logged in development only
    }

  } catch (error) {
    // Error handling
  }
}

export async function testSyncFunctionality() {
  try {
    // Check sync status
    await databaseService.getPendingSyncRecords();

    // Test manual sync if online
    if (syncService.isConnected()) {
      const syncResult = await syncService.manualSync();
      return syncResult.success;
    }

    return true;
  } catch (error) {
    return false;
  }
}

// Make functions available globally for browser console testing
(window as any).testGroupAssignments = testGroupAssignments;
(window as any).logGroupMembershipStatus = logGroupMembershipStatus;
(window as any).testSyncFunctionality = testSyncFunctionality;
