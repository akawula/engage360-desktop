import { useState } from 'react';
import { Copy, Download, Check, AlertTriangle } from 'lucide-react';

interface RecoveryKeysModalProps {
    isOpen: boolean;
    recoveryKeys: string[];
    onConfirm: () => void;
    onClose: () => void;
}

export default function RecoveryKeysModal({ isOpen, recoveryKeys, onConfirm, onClose }: RecoveryKeysModalProps) {
    const [copied, setCopied] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    if (!isOpen) return null;

    const handleCopy = async () => {
        try {
            const keysText = recoveryKeys.join('\n');
            await navigator.clipboard.writeText(keysText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy recovery keys:', error);
        }
    };

    const handleDownload = () => {
        const keysText = recoveryKeys.join('\n');
        const blob = new Blob([keysText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'engage360-recovery-keys.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleConfirm = () => {
        if (confirmed) {
            onConfirm();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-dark-300 dark:border-dark-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                            <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-dark-950 dark:text-white">
                                Save Your Recovery Keys
                            </h2>
                            <p className="text-sm text-dark-700 dark:text-dark-500">
                                These keys are required to recover your account if you lose all devices
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-red-700 dark:text-red-300">
                                <p className="font-medium mb-1">⚠️ Critical Security Information</p>
                                <ul className="space-y-1 text-xs">
                                    <li>• Store these keys in a secure location (password manager, safe, etc.)</li>
                                    <li>• You need at least 8 out of 12 keys to recover your account</li>
                                    <li>• If you lose all devices AND these keys, your data cannot be recovered</li>
                                    <li>• Never share these keys with anyone</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-dark-100 dark:bg-dark-950/50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-dark-800 dark:text-dark-400">
                                Recovery Keys (12 total)
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    {copied ? 'Copied!' : 'Copy All'}
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-1 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                >
                                    <Download className="h-3 w-3" />
                                    Download
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                            {recoveryKeys.map((key, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 p-2 bg-white dark:bg-dark-900 border border-dark-300 dark:border-dark-800 rounded"
                                >
                                    <span className="text-xs text-dark-600 dark:text-dark-500 w-6">
                                        {index + 1}.
                                    </span>
                                    <span className="text-dark-950 dark:text-white flex-1">
                                        {key}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                        <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                            How to use recovery keys:
                        </h4>
                        <ol className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                            <li>1. If you lose access to all devices, go to the login page</li>
                            <li>2. Click "Recover Account with Recovery Keys"</li>
                            <li>3. Enter at least 8 of these 12 recovery keys</li>
                            <li>4. Create a new device password to secure your new device</li>
                        </ol>
                    </div>

                    <label className="flex items-center gap-3 p-4 bg-dark-100 dark:bg-dark-950/50 rounded-lg cursor-pointer">
                        <input
                            type="checkbox"
                            checked={confirmed}
                            onChange={(e) => setConfirmed(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-dark-400 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-dark-800 dark:text-dark-400">
                            I have safely stored these recovery keys and understand that losing them along with all my devices will result in permanent data loss.
                        </span>
                    </label>
                </div>

                <div className="flex gap-3 p-6 border-t border-dark-300 dark:border-dark-800">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-dark-800 dark:text-dark-400 border border-dark-400 dark:border-dark-700 bg-white dark:bg-dark-800 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
                    >
                        Cancel Registration
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!confirmed}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        I've Saved My Keys - Continue
                    </button>
                </div>
            </div>
        </div>
    );
}
