import { useEffect } from 'react';
import { useAppStore } from '../store';
import { useNotification } from '../contexts/NotificationContext';

export const StoreErrorHandler: React.FC = () => {
    const { showError } = useNotification();
    const setErrorHandler = useAppStore(state => state.setErrorHandler);

    useEffect(() => {
        setErrorHandler(showError);
    }, [setErrorHandler, showError]);

    return null;
};
