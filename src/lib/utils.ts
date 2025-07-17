/**
 * Formats an avatar source to handle both URLs and base64 data
 * @param avatar - The avatar string (URL or base64)
 * @returns Formatted avatar source or null if invalid
 */
export function formatAvatarSrc(avatar?: string | null): string | null {
    if (!avatar || avatar.trim() === '') {
        return null;
    }

    // Check if it's already a complete URL (http/https)
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
        return avatar;
    }

    // Check if it's a data URL (base64)
    if (avatar.startsWith('data:')) {
        return avatar;
    }

    // Check if it's base64 without data URL prefix
    if (isBase64(avatar)) {
        // Assume it's a JPEG if no format is specified
        return `data:image/jpeg;base64,${avatar}`;
    }

    // If it looks like a relative URL or file path, treat it as URL
    if (avatar.startsWith('/') || avatar.includes('.')) {
        return avatar;
    }

    // Default: treat as URL
    return avatar;
}

/**
 * Checks if a string is valid base64
 * @param str - String to check
 * @returns True if valid base64
 */
function isBase64(str: string): boolean {
    try {
        // Basic base64 pattern check
        const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Pattern.test(str)) {
            return false;
        }

        // Check if length is valid for base64 (multiple of 4)
        if (str.length % 4 !== 0) {
            return false;
        }

        // Try to decode to verify it's valid base64 (browser only)
        if (typeof window !== 'undefined' && typeof atob === 'function') {
            atob(str);
        }

        return true;
    } catch {
        return false;
    }
}
