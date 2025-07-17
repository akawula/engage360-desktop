import { useState } from 'react';
import { Upload, User, Link, X } from 'lucide-react';
import { validateImageFile, resizeImage } from '../lib/imageUtils';
import { formatAvatarSrc } from '../lib/utils';

interface AvatarInputProps {
    value?: string | null;
    onChange: (avatar: string | null) => void;
    size?: 'sm' | 'md' | 'lg';
    label?: string;
    placeholder?: string;
    className?: string;
}

export default function AvatarInput({
    value,
    onChange,
    size = 'md',
    label = 'Avatar',
    placeholder = 'Enter image URL',
    className = ''
}: AvatarInputProps) {
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const [inputMethod, setInputMethod] = useState<'upload' | 'url'>('upload');
    const [urlInput, setUrlInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const sizeClasses = {
        sm: 'w-12 h-12',
        md: 'w-16 h-16',
        lg: 'w-24 h-24'
    };

    const iconSizes = {
        sm: 'h-6 w-6',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    /**
     * Convert URL to base64 by fetching and processing the image
     */
    const convertUrlToBase64 = async (url: string): Promise<string> => {
        try {
            // Fetch the image with proper headers
            const response = await fetch(url, {
                mode: 'cors',
                headers: {
                    'Accept': 'image/*'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
            }

            // Get the image as blob
            const blob = await response.blob();

            // Validate it's an image
            if (!blob.type.startsWith('image/')) {
                throw new Error('URL does not point to a valid image');
            }

            // Check file size (10MB limit)
            if (blob.size > 10 * 1024 * 1024) {
                throw new Error('Image is too large (max 10MB)');
            }

            // Convert blob to File for processing
            const file = new File([blob], 'avatar', { type: blob.type });

            // Validate the file
            const validation = validateImageFile(file);
            if (!validation.isValid) {
                throw new Error(validation.error || 'Invalid image');
            }

            // Resize and convert to base64
            const resizeConfig = size === 'sm' ? 64 : size === 'md' ? 100 : 150;
            const base64 = await resizeImage(file, resizeConfig);

            return base64;
        } catch (error) {
            console.error('Error converting URL to base64:', error);

            // Provide more specific error messages
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                throw new Error('Could not access image (CORS or network issue)');
            }

            throw error;
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAvatarError(null);
        setIsLoading(true);

        // Validate the file
        const validation = validateImageFile(file);
        if (!validation.isValid) {
            setAvatarError(validation.error || 'Invalid file');
            setIsLoading(false);
            return;
        }

        try {
            // Resize and convert to base64
            const resizeConfig = size === 'sm' ? 64 : size === 'md' ? 100 : 150;
            const base64Avatar = await resizeImage(file, resizeConfig);
            onChange(base64Avatar);
        } catch (error) {
            console.error('Error processing image:', error);
            setAvatarError('Failed to process image');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUrlInput(e.target.value);
        setAvatarError(null);
    };

    const handleUrlSubmit = async () => {
        if (!urlInput.trim()) {
            setAvatarError('Please enter a valid URL');
            return;
        }

        setAvatarError(null);
        setIsLoading(true);

        try {
            // Basic URL validation
            new URL(urlInput);

            // Convert URL to base64
            const base64 = await convertUrlToBase64(urlInput);
            onChange(base64);
            setUrlInput(''); // Clear the input after successful conversion
        } catch (error) {
            console.error('Error processing URL:', error);
            if (error instanceof TypeError) {
                setAvatarError('Please enter a valid URL');
            } else {
                setAvatarError(error instanceof Error ? error.message : 'Failed to load image from URL');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleUrlKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleUrlSubmit();
        }
    };

    const handleClear = () => {
        onChange(null);
        setUrlInput('');
        setAvatarError(null);
    };

    const avatarSrc = formatAvatarSrc(value);

    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {label}
            </label>

            <div className="flex items-start gap-4">
                {/* Avatar Preview */}
                <div className="flex-shrink-0">
                    {avatarSrc ? (
                        <div className="relative">
                            <img
                                src={avatarSrc}
                                alt="Avatar preview"
                                className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gray-300 dark:border-gray-600`}
                            />
                            <button
                                onClick={handleClear}
                                className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                                title="Remove avatar"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ) : (
                        <div className={`${sizeClasses[size]} rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600`}>
                            <User className={`${iconSizes[size]} text-primary-600 dark:text-primary-400`} />
                        </div>
                    )}
                </div>

                {/* Input Methods */}
                <div className="flex-1">
                    {/* Method Selection */}
                    <div className="flex gap-2 mb-3">
                        <button
                            type="button"
                            onClick={() => setInputMethod('upload')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${inputMethod === 'upload'
                                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            <Upload className="h-4 w-4" />
                            Upload
                        </button>
                        <button
                            type="button"
                            onClick={() => setInputMethod('url')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${inputMethod === 'url'
                                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            <Link className="h-4 w-4" />
                            URL
                        </button>
                    </div>

                    {/* Upload Method */}
                    {inputMethod === 'upload' && (
                        <div>
                            <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <Upload className="h-4 w-4" />
                                <span className="text-sm">
                                    {isLoading ? 'Processing...' : 'Choose Image'}
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    disabled={isLoading}
                                    className="hidden"
                                />
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Max 10MB. Supports JPG, PNG, GIF, WebP
                            </p>
                        </div>
                    )}

                    {/* URL Method */}
                    {inputMethod === 'url' && (
                        <div>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={urlInput}
                                    onChange={handleUrlChange}
                                    onKeyPress={handleUrlKeyPress}
                                    placeholder={placeholder}
                                    disabled={isLoading}
                                    className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={handleUrlSubmit}
                                    disabled={!urlInput.trim() || isLoading}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                                >
                                    {isLoading ? 'Loading...' : 'Add'}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Enter a direct link to an image (will be converted to base64)
                            </p>
                        </div>
                    )}

                    {/* Error Message */}
                    {avatarError && (
                        <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                            {avatarError}
                        </p>
                    )}

                    {/* Current Avatar Info */}
                    {avatarSrc && (
                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p className="text-green-700 dark:text-green-300 text-xs">
                                {value?.startsWith('data:') ? 'Image converted to base64' : 'Image set'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
