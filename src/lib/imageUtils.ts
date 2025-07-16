/**
 * Utility functions for handling image files and base64 conversion
 */

export interface ImageValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Validates an image file for avatar upload
 */
export function validateImageFile(file: File): ImageValidationResult {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        return {
            isValid: false,
            error: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)'
        };
    }

    // Check file size (max 5MB)
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
        return {
            isValid: false,
            error: 'Image file size must be less than 5MB'
        };
    }

    return { isValid: true };
}

/**
 * Converts a File object to a base64 data URL
 */
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to convert file to base64'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Error reading file'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Resizes an image to a square format (100x100 by default) with proper cropping
 */
export function resizeImage(file: File, size: number = 100): Promise<string> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Set canvas to square dimensions
            canvas.width = size;
            canvas.height = size;

            // Calculate crop dimensions to maintain aspect ratio and fill the square
            const { width: imgWidth, height: imgHeight } = img;
            let sourceX = 0;
            let sourceY = 0;
            let sourceWidth = imgWidth;
            let sourceHeight = imgHeight;

            // Crop to square by using the smaller dimension as the crop size
            if (imgWidth > imgHeight) {
                // Landscape: crop horizontally from center
                sourceWidth = imgHeight;
                sourceX = (imgWidth - imgHeight) / 2;
            } else if (imgHeight > imgWidth) {
                // Portrait: crop vertically from center
                sourceHeight = imgWidth;
                sourceY = (imgHeight - imgWidth) / 2;
            }

            // Draw the cropped and resized image
            ctx?.drawImage(
                img,
                sourceX, sourceY, sourceWidth, sourceHeight, // Source crop area
                0, 0, size, size // Destination area (full canvas)
            );

            // Convert to base64
            const base64 = canvas.toDataURL('image/jpeg', 0.8);
            resolve(base64);
        };

        img.onerror = () => {
            reject(new Error('Error loading image'));
        };

        // Convert file to object URL for the image
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Creates a preview URL from various avatar sources
 */
export function getAvatarPreviewUrl(avatarSource: string | File | null): string | null {
    if (!avatarSource) {
        return null;
    }

    if (typeof avatarSource === 'string') {
        // If it's already a string (base64 or URL), return as is
        return avatarSource;
    }

    if (avatarSource instanceof File) {
        // Create object URL for file preview
        return URL.createObjectURL(avatarSource);
    }

    return null;
}

/**
 * Cleans up object URLs to prevent memory leaks
 */
export function revokeAvatarPreviewUrl(url: string | null): void {
    if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
}
