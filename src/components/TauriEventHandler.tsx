import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { dueActionItemsService } from '../services/dueActionItemsService';

export function TauriEventHandler() {
    useEffect(() => {
        let unlistenCheckDueItems: (() => void) | null = null;
        let unlistenClearNotifications: (() => void) | null = null;

        // Listen for due action items check requests from backend
        const setupListener = async () => {
            try {
                unlistenCheckDueItems = await listen('check-due-action-items', async () => {
                    console.log('Received request to check due action items from backend');
                    await dueActionItemsService.checkAndNotifyDueItems();
                });

                unlistenClearNotifications = await listen('clear-due-item-notifications', async () => {
                    console.log('Received request to clear due item notifications from backend');
                    dueActionItemsService.clearAllNotifications();
                });
            } catch (error) {
                console.error('Failed to set up Tauri event listener:', error);
            }
        };

        setupListener();

        // Cleanup listeners on unmount
        return () => {
            if (unlistenCheckDueItems) {
                unlistenCheckDueItems();
            }
            if (unlistenClearNotifications) {
                unlistenClearNotifications();
            }
        };
    }, []);

    // This component doesn't render anything
    return null;
}
