import { invoke } from '@tauri-apps/api/core';
import { actionItemsService } from './actionItemsService';

export class DueActionItemsService {
    private static instance: DueActionItemsService;
    private notifiedItems: Set<string> = new Set(); // Track notified action item IDs

    private constructor() {
        // Load previously notified items from localStorage
        this.loadNotifiedItems();
    }

    static getInstance(): DueActionItemsService {
        if (!DueActionItemsService.instance) {
            DueActionItemsService.instance = new DueActionItemsService();
        }
        return DueActionItemsService.instance;
    }

    /**
     * Load previously notified items from localStorage
     */
    private loadNotifiedItems(): void {
        try {
            const stored = localStorage.getItem('notified-due-action-items');
            if (stored) {
                const notifiedArray = JSON.parse(stored);
                this.notifiedItems = new Set(notifiedArray);
            }
        } catch (error) {
            this.notifiedItems = new Set();
        }
    }

    /**
     * Save notified items to localStorage
     */
    private saveNotifiedItems(): void {
        try {
            const notifiedArray = Array.from(this.notifiedItems);
            localStorage.setItem('notified-due-action-items', JSON.stringify(notifiedArray));
        } catch (error) {
        }
    }

    /**
     * Mark an action item as notified
     */
    private markAsNotified(itemId: string): void {
        this.notifiedItems.add(itemId);
        this.saveNotifiedItems();
    }

    /**
     * Check if an action item has already been notified
     */
    private isAlreadyNotified(itemId: string): boolean {
        return this.notifiedItems.has(itemId);
    }

    /**
     * Clean up notifications for completed or cancelled items
     */
    private cleanupNotifiedItems(currentItemIds: string[]): void {
        const currentIdSet = new Set(currentItemIds);
        const itemsToRemove: string[] = [];

        // Find items that are no longer in the current list
        for (const itemId of this.notifiedItems) {
            if (!currentIdSet.has(itemId)) {
                itemsToRemove.push(itemId);
            }
        }

        // Remove them from the notified set
        for (const itemId of itemsToRemove) {
            this.notifiedItems.delete(itemId);
        }

        if (itemsToRemove.length > 0) {
            this.saveNotifiedItems();
        }
    }

    /**
     * Check if an action item is due today or overdue
     */
    private isDueTodayOrOverdue(dueDate: string): boolean {
        const due = new Date(dueDate);
        const today = new Date();

        // Set time to start of day for comparison
        due.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        return due.getTime() <= today.getTime();
    }

    /**
     * Format due date for notification
     */
    private formatDueDate(dueDate: string): string {
        const due = new Date(dueDate);
        const today = new Date();

        // Set time to start of day for comparison
        due.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const timeDiff = due.getTime() - today.getTime();
        const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        if (dayDiff === 0) {
            return 'today';
        } else if (dayDiff === -1) {
            return 'yesterday';
        } else if (dayDiff < 0) {
            return `${Math.abs(dayDiff)} days ago`;
        } else {
            return due.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    /**
     * Check for due action items and send notifications
     */
    async checkAndNotifyDueItems(): Promise<void> {
        try {

            // Fetch all pending and in-progress action items
            const response = await actionItemsService.getActionItems({
                status: 'pending',
                limit: 100
            });

            const inProgressResponse = await actionItemsService.getActionItems({
                status: 'in_progress',
                limit: 100
            });

            if (!response.success || !inProgressResponse.success) {
                return;
            }

            const allItems = [
                ...(response.data || []),
                ...(inProgressResponse.data || [])
            ];

            // Clean up notifications for items that are no longer pending/in-progress
            this.cleanupNotifiedItems(allItems.map(item => item.id));

            // Filter items that are due today or overdue
            const dueItems = allItems.filter(item => {
                if (!item.dueDate) return false;
                return this.isDueTodayOrOverdue(item.dueDate);
            });


            // Send notifications for each due item (only once per item)
            let newNotifications = 0;
            for (const item of dueItems) {
                if (item.dueDate && !this.isAlreadyNotified(item.id)) {
                    const dueDateText = this.formatDueDate(item.dueDate);

                    try {
                        await invoke('notify_due_action_item', {
                            title: item.title,
                            dueDate: dueDateText
                        });

                        this.markAsNotified(item.id);
                        newNotifications++;
                    } catch (error) {
                    }
                }
            }

            // Log summary
            if (newNotifications > 0) {
            } else if (dueItems.length > 0) {
            } else {
            }

        } catch (error) {
        }
    }

    /**
     * Clear all notified items (useful for testing or resetting)
     */
    clearAllNotifications(): void {
        this.notifiedItems.clear();
        this.saveNotifiedItems();
    }

    /**
     * Clear notification for a specific item (useful when item is completed)
     */
    clearNotification(itemId: string): void {
        if (this.notifiedItems.delete(itemId)) {
            this.saveNotifiedItems();
        }
    }

    /**
     * Get count of notified items
     */
    getNotifiedCount(): number {
        return this.notifiedItems.size;
    }
}

export const dueActionItemsService = DueActionItemsService.getInstance();
