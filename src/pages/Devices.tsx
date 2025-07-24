import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Monitor, Smartphone, Tablet, Laptop, Wifi, WifiOff, Calendar, Shield, ShieldCheck, Trash2, MoreVertical } from 'lucide-react';
import { devicesService } from '../services/devicesService';
import { useNotification } from '../contexts/NotificationContext';
import RegisterDeviceModal from '../components/RegisterDeviceModal';
import DeviceApprovalModal from '../components/DeviceApprovalModal';

export default function Devices() {
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useNotification();
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [deviceToApprove, setDeviceToApprove] = useState<any>(null);
    const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close action menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActionMenuOpen(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const { data: devices = [], isLoading, error } = useQuery({
        queryKey: ['devices'],
        queryFn: async () => {
            const response = await devicesService.getDevices();
            if (response.success) {
                return response.data;
            }
            throw new Error(response.error?.message || 'Failed to fetch devices');
        },
    });

    const approveMutation = useMutation({
        mutationFn: async (data: { deviceId: string; password: string }) => {
            // Use the enhanced approval method that shares encryption keys
            return devicesService.approveDeviceWithKeySharing(data.deviceId, data.password);
        },
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['devices'] });
            if (response.success) {
                showSuccess('Device Approved', 'The device can now access your encrypted data.');
            }
        },
        onError: (error) => {
            showError('Approval Failed', error instanceof Error ? error.message : 'Failed to approve device');
        },
    });

    const revokeMutation = useMutation({
        mutationFn: (deviceId: string) => devicesService.revokeDevice(deviceId),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['devices'] });
            if (response.success) {
                showSuccess('Device Revoked', 'Device access has been revoked and all sessions terminated.');
            }
        },
        onError: (error) => {
            showError('Revocation Failed', error instanceof Error ? error.message : 'Failed to revoke device');
        },
    });

    const handleApproveDevice = (deviceId: string) => {
        const device = devices.find(d => d.id === deviceId);
        if (device) {
            setDeviceToApprove(device);
            setShowApprovalModal(true);
        }
        setActionMenuOpen(null);
    };

    const handleApprovalConfirm = (password: string) => {
        if (deviceToApprove) {
            approveMutation.mutate({
                deviceId: deviceToApprove.id,
                password
            });
        }
    };

    const handleApprovalClose = () => {
        setShowApprovalModal(false);
        setDeviceToApprove(null);
    };

    const handleRevokeDevice = (deviceId: string, deviceName: string) => {
        if (window.confirm(`Are you sure you want to revoke access for "${deviceName}"? This action cannot be undone and will terminate all sessions for this device.`)) {
            revokeMutation.mutate(deviceId);
        }
        setActionMenuOpen(null);
    };

    const getDeviceIcon = (type?: string) => {
        switch (type) {
            case 'desktop':
                return <Monitor className="h-8 w-8 text-blue-600" />;
            case 'mobile':
                return <Smartphone className="h-8 w-8 text-green-600" />;
            case 'tablet':
                return <Tablet className="h-8 w-8 text-purple-600" />;
            case 'laptop':
                return <Laptop className="h-8 w-8 text-indigo-600" />;
            default:
                return <Monitor className="h-8 w-8 text-dark-700 dark:text-dark-400" />;
        }
    };

    const getStatusColor = (isActive?: boolean, trusted?: boolean) => {
        if (!trusted) {
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
        }
        return isActive
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-dark-200 text-dark-900 dark:bg-dark-950/20 dark:text-dark-500';
    };

    const formatLastSeen = (lastSeen?: string) => {
        if (!lastSeen) return 'Never';

        const date = new Date(lastSeen);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return date.toLocaleDateString();
    };

    const getDeviceStatus = (device: any) => {
        if (!device.trusted) return { text: 'Pending Approval', color: getStatusColor(false, false) };
        if (device.isActive) return { text: 'Active', color: getStatusColor(true, true) };
        return { text: 'Inactive', color: getStatusColor(false, true) };
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-dark-300 dark:bg-dark-800 rounded w-32 mb-6"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-dark-300 dark:bg-dark-800 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-dark-950 dark:text-white">Devices</h1>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400">
                        Failed to load devices: {error instanceof Error ? error.message : 'Unknown error'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-dark-950 dark:text-white">Devices</h1>
                <button
                    onClick={() => setShowRegisterModal(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Register Device
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {devices.map((device) => {
                    const status = getDeviceStatus(device);
                    return (
                        <div
                            key={device.id}
                            className="bg-white dark:bg-dark-900 rounded-lg shadow-sm border border-dark-300 dark:border-dark-800 p-6 hover:shadow-md transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {getDeviceIcon(device.type)}
                                    <div>
                                        <h3 className="font-semibold text-dark-950 dark:text-white">{device.deviceName}</h3>
                                        <p className="text-dark-700 dark:text-dark-400 text-sm">{device.platform}</p>
                                        {device.version && (
                                            <p className="text-dark-600 dark:text-dark-500 text-xs">Version {device.version}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {device.trusted ? (
                                        device.isActive ? (
                                            <Wifi className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <WifiOff className="h-4 w-4 text-dark-500" />
                                        )
                                    ) : (
                                        <Shield className="h-4 w-4 text-yellow-500" />
                                    )}
                                    <div className="relative" ref={menuRef}>
                                        <button
                                            onClick={() => setActionMenuOpen(actionMenuOpen === device.id ? null : device.id)}
                                            className="p-1 hover:bg-dark-200 dark:hover:bg-dark-800 rounded"
                                        >
                                            <MoreVertical className="h-4 w-4 text-dark-500" />
                                        </button>
                                        {actionMenuOpen === device.id && (
                                            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-dark-800 border border-dark-300 dark:border-dark-700 rounded-lg shadow-lg py-1 z-10 min-w-[150px]">
                                                {!device.trusted && (
                                                    <button
                                                        onClick={() => handleApproveDevice(device.id)}
                                                        disabled={approveMutation.isPending}
                                                        className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-dark-100 dark:hover:bg-dark-700 flex items-center gap-2 disabled:opacity-50"
                                                    >
                                                        <ShieldCheck className="h-4 w-4" />
                                                        {approveMutation.isPending ? 'Approving...' : 'Approve Device'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleRevokeDevice(device.id, device.deviceName)}
                                                    disabled={revokeMutation.isPending}
                                                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-dark-100 dark:hover:bg-dark-700 flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    {revokeMutation.isPending ? 'Revoking...' : 'Revoke Access'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-dark-700 dark:text-dark-400">Status</span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                                        {status.text}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-dark-700 dark:text-dark-400">Last seen</span>
                                    <span className="text-sm text-dark-950 dark:text-white">{formatLastSeen(device.lastUsed)}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-dark-700 dark:text-dark-400">Registered</span>
                                    <div className="flex items-center gap-1 text-sm text-dark-950 dark:text-white">
                                        <Calendar className="h-3 w-3" />
                                        <span>{new Date(device.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {!device.trusted && (
                                    <div className="pt-2 border-t border-dark-200 dark:border-dark-800">
                                        <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400">
                                            <Shield className="h-3 w-3" />
                                            <span>Pending approval from trusted device</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {devices.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-dark-900 rounded-lg shadow transition-colors">
                    <Monitor className="h-12 w-12 text-dark-500 dark:text-dark-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-dark-950 dark:text-white mb-2">No devices registered</h3>
                    <p className="text-dark-700 dark:text-dark-400 mb-4">Register your first device to get started</p>
                    <button
                        onClick={() => setShowRegisterModal(true)}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Register Device
                    </button>
                </div>
            )}

            <RegisterDeviceModal
                isOpen={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
            />

            <DeviceApprovalModal
                isOpen={showApprovalModal}
                deviceName={deviceToApprove?.name || deviceToApprove?.deviceName || 'Unknown Device'}
                deviceType={deviceToApprove?.type || deviceToApprove?.deviceType || 'unknown'}
                onApprove={handleApprovalConfirm}
                onCancel={handleApprovalClose}
                isLoading={approveMutation.isPending}
            />
        </div>
    );
}
