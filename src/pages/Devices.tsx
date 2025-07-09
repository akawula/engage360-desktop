import { useQuery } from '@tanstack/react-query';
import { Plus, Monitor, Smartphone, Tablet, Wifi, WifiOff, Calendar } from 'lucide-react';
import { mockApi } from '../data/mockData';

export default function Devices() {
    const { data: devices = [], isLoading } = useQuery({
        queryKey: ['devices'],
        queryFn: mockApi.getDevices,
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const getDeviceIcon = (type: string) => {
        switch (type) {
            case 'desktop':
                return <Monitor className="h-8 w-8 text-blue-600" />;
            case 'mobile':
                return <Smartphone className="h-8 w-8 text-green-600" />;
            case 'tablet':
                return <Tablet className="h-8 w-8 text-purple-600" />;
            default:
                return <Monitor className="h-8 w-8 text-gray-600 dark:text-gray-300" />;
        }
    };

    const getStatusColor = (isActive: boolean) => {
        return isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800';
    };

    const formatLastSeen = (lastSeen: string) => {
        const date = new Date(lastSeen);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Devices</h1>
                <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Register Device
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {devices.map((device) => (
                    <div
                        key={device.id}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {getDeviceIcon(device.type)}
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{device.name}</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm">{device.platform}</p>
                                    {device.version && (
                                        <p className="text-gray-500 dark:text-gray-400 text-xs">Version {device.version}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {device.isActive ? (
                                    <Wifi className="h-4 w-4 text-green-500" />
                                ) : (
                                    <WifiOff className="h-4 w-4 text-gray-400" />
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-300">Status</span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(device.isActive)}`}>
                                    {device.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-300">Last seen</span>
                                <span className="text-sm text-gray-900 dark:text-white">{formatLastSeen(device.lastSeen)}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-300">Registered</span>
                                <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(device.registeredAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex gap-2">
                                <button className="flex-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                                    View Details
                                </button>
                                <button className="flex-1 text-sm text-red-600 hover:text-red-700 transition-colors">
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {devices.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
                    <Monitor className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No devices registered</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">Register your first device to get started</p>
                    <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                        Register Device
                    </button>
                </div>
            )}
        </div>
    );
}
