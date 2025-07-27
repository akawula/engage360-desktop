import React, { useState, useEffect } from 'react';
import { syncService } from '../services/syncService';
import { WifiIcon, WifiOffIcon, RefreshCwIcon, CheckIcon, AlertTriangleIcon } from 'lucide-react';

interface SyncStatusProps {
  className?: string;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState(syncService.getSyncStatus());
  const [lastSyncResult, setLastSyncResult] = useState<{ success: boolean; errors: string[] } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(syncService.getSyncStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    try {
      const result = await syncService.manualSync();
      setLastSyncResult({ success: result.success, errors: result.errors });
    } catch (error) {
      setLastSyncResult({ success: false, errors: [error.toString()] });
    }
  };

  const getStatusIcon = () => {
    if (!status.isOnline) {
      return <WifiOffIcon className="h-4 w-4 text-red-500" />;
    }
    
    if (status.isSync) {
      return <RefreshCwIcon className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    
    if (lastSyncResult?.success === false) {
      return <AlertTriangleIcon className="h-4 w-4 text-yellow-500" />;
    }
    
    return <CheckIcon className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!status.isOnline) {
      return 'Offline';
    }
    
    if (status.isSync) {
      return 'Syncing...';
    }
    
    if (lastSyncResult?.success === false) {
      return 'Sync error';
    }
    
    if (status.lastSync) {
      const timeAgo = Math.floor((Date.now() - status.lastSync.getTime()) / 1000);
      if (timeAgo < 60) return 'Just synced';
      if (timeAgo < 3600) return `Synced ${Math.floor(timeAgo / 60)}m ago`;
      return `Synced ${Math.floor(timeAgo / 3600)}h ago`;
    }
    
    return 'Ready to sync';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={handleManualSync}
        disabled={status.isSync || !status.isOnline}
        className="flex items-center space-x-2 px-2 py-1 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title={lastSyncResult?.errors.join(', ') || 'Click to sync now'}
      >
        {getStatusIcon()}
        <span className="text-xs text-gray-600">{getStatusText()}</span>
      </button>
    </div>
  );
};