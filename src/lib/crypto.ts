/**
 * End-to-End Encryption Service for Notes
 * Handles encryption/decryption of note content using Web Crypto API
 */

export interface EncryptionResult {
    encryptedData: string;      // Base64 encoded encrypted content
    iv: string;                 // Base64 encoded initialization vector
    keyDerivationSalt?: string; // Base64 encoded salt (for password-based encryption)
}

export interface DecryptionParams {
    encryptedData: string;
    iv: string;
    keyDerivationSalt?: string;
}

export interface NoteEncryptionKeys {
    deviceId: string;
    encryptedKey: string; // AES key encrypted with device's public key
}

class CryptoService {
    private readonly KEY_SIZE = 256; // AES-256
    private readonly IV_SIZE = 12;   // GCM IV size
    private readonly SALT_SIZE = 16; // PBKDF2 salt size
    private readonly ITERATIONS = 100000; // PBKDF2 iterations

    /**
     * Check if Web Crypto API is available
     */
    isAvailable(): boolean {
        return !!(window.crypto && window.crypto.subtle);
    }

    /**
     * Generate a random AES key for encrypting note content
     */
    async generateNoteEncryptionKey(): Promise<CryptoKey> {
        if (!this.isAvailable()) {
            throw new Error('Web Crypto API not available');
        }

        return await window.crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: this.KEY_SIZE
            },
            true, // extractable
            ["encrypt", "decrypt"]
        );
    }

    /**
     * Encrypt note content with AES-GCM
     */
    async encryptNoteContent(content: string, key: CryptoKey): Promise<EncryptionResult> {
        if (!this.isAvailable()) {
            throw new Error('Web Crypto API not available');
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_SIZE));

        const encryptedBuffer = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            data
        );

        return {
            encryptedData: this.arrayBufferToBase64(encryptedBuffer),
            iv: this.arrayBufferToBase64(iv)
        };
    }

    /**
     * Decrypt note content with AES-GCM
     */
    async decryptNoteContent(params: DecryptionParams, key: CryptoKey): Promise<string> {
        if (!this.isAvailable()) {
            throw new Error('Web Crypto API not available');
        }

        const encryptedData = this.base64ToArrayBuffer(params.encryptedData);
        const iv = this.base64ToArrayBuffer(params.iv);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            encryptedData
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    }

    /**
     * Encrypt an AES key with a device's public key (ECDH + AES)
     */
    async encryptKeyForDevice(aesKey: CryptoKey, devicePublicKeyBase64: string): Promise<string> {
        if (!this.isAvailable()) {
            throw new Error('Web Crypto API not available');
        }

        // Import device public key
        const publicKeyBuffer = this.base64ToArrayBuffer(devicePublicKeyBase64);
        const devicePublicKey = await window.crypto.subtle.importKey(
            "spki",
            publicKeyBuffer,
            {
                name: "ECDH",
                namedCurve: "P-256"
            },
            false,
            []
        );

        // Generate ephemeral key pair for ECDH
        const ephemeralKeyPair = await window.crypto.subtle.generateKey(
            {
                name: "ECDH",
                namedCurve: "P-256"
            },
            true,
            ["deriveKey"]
        );

        // Derive shared secret
        const sharedKey = await window.crypto.subtle.deriveKey(
            {
                name: "ECDH",
                public: devicePublicKey
            },
            ephemeralKeyPair.privateKey,
            {
                name: "AES-GCM",
                length: 256
            },
            false,
            ["encrypt"]
        );

        // Export the AES key we want to encrypt
        const aesKeyBuffer = await window.crypto.subtle.exportKey("raw", aesKey);

        // Encrypt the AES key with the shared secret
        const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_SIZE));
        const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            sharedKey,
            aesKeyBuffer
        );

        // Export ephemeral public key
        const ephemeralPublicKeyBuffer = await window.crypto.subtle.exportKey("spki", ephemeralKeyPair.publicKey);

        // Combine ephemeral public key, IV, and encrypted key
        const combined = new Uint8Array(
            ephemeralPublicKeyBuffer.byteLength +
            iv.length +
            encryptedKeyBuffer.byteLength
        );

        combined.set(new Uint8Array(ephemeralPublicKeyBuffer), 0);
        combined.set(iv, ephemeralPublicKeyBuffer.byteLength);
        combined.set(new Uint8Array(encryptedKeyBuffer), ephemeralPublicKeyBuffer.byteLength + iv.length);

        return this.arrayBufferToBase64(combined);
    }

    /**
     * Decrypt an AES key using this device's private key
     */
    async decryptKeyForDevice(encryptedKeyBase64: string, devicePrivateKeyBase64: string, password: string): Promise<CryptoKey> {
        if (!this.isAvailable()) {
            throw new Error('Web Crypto API not available');
        }

        // Decrypt device private key with password first
        const devicePrivateKey = await this.decryptDevicePrivateKey(devicePrivateKeyBase64, password);

        // Parse the combined data
        const combinedBuffer = this.base64ToArrayBuffer(encryptedKeyBase64);
        const combinedArray = new Uint8Array(combinedBuffer);

        // Extract ephemeral public key (first 91 bytes for P-256 SPKI)
        const ephemeralPublicKeyBuffer = combinedArray.slice(0, 91).buffer;
        // Extract IV (next 12 bytes)
        const iv = combinedArray.slice(91, 91 + this.IV_SIZE);
        // Extract encrypted key (remaining bytes)
        const encryptedKeyBuffer = combinedArray.slice(91 + this.IV_SIZE).buffer;

        // Import ephemeral public key
        const ephemeralPublicKey = await window.crypto.subtle.importKey(
            "spki",
            ephemeralPublicKeyBuffer,
            {
                name: "ECDH",
                namedCurve: "P-256"
            },
            false,
            []
        );

        // Derive shared secret
        const sharedKey = await window.crypto.subtle.deriveKey(
            {
                name: "ECDH",
                public: ephemeralPublicKey
            },
            devicePrivateKey,
            {
                name: "AES-GCM",
                length: 256
            },
            false,
            ["decrypt"]
        );

        // Decrypt the AES key
        const decryptedKeyBuffer = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            sharedKey,
            encryptedKeyBuffer
        );

        // Import the decrypted AES key
        return await window.crypto.subtle.importKey(
            "raw",
            decryptedKeyBuffer,
            {
                name: "AES-GCM"
            },
            true,
            ["encrypt", "decrypt"]
        );
    }

    /**
     * Decrypt device private key using password
     */
    private async decryptDevicePrivateKey(encryptedPrivateKeyBase64: string, password: string): Promise<CryptoKey> {
        const combinedBuffer = this.base64ToArrayBuffer(encryptedPrivateKeyBase64);
        const combinedArray = new Uint8Array(combinedBuffer);

        // Extract salt (first 16 bytes)
        const salt = combinedArray.slice(0, this.SALT_SIZE);
        // Extract IV (next 12 bytes)
        const iv = combinedArray.slice(this.SALT_SIZE, this.SALT_SIZE + this.IV_SIZE);
        // Extract encrypted private key (remaining bytes)
        const encryptedPrivateKey = combinedArray.slice(this.SALT_SIZE + this.IV_SIZE).buffer;

        // Derive key from password
        const passwordKey = await window.crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        const decryptionKey = await window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: this.ITERATIONS,
                hash: "SHA-256"
            },
            passwordKey,
            { name: "AES-GCM", length: 256 },
            false,
            ["decrypt"]
        );

        // Decrypt private key
        const decryptedPrivateKeyBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            decryptionKey,
            encryptedPrivateKey
        );

        // Import the decrypted private key
        return await window.crypto.subtle.importKey(
            "pkcs8",
            decryptedPrivateKeyBuffer,
            {
                name: "ECDH",
                namedCurve: "P-256"
            },
            false,
            ["deriveKey"]
        );
    }

    /**
     * Utility: Convert ArrayBuffer to Base64
     */
    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Utility: Convert Base64 to ArrayBuffer
     */
    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Generate a secure random password for key derivation
     */
    generateSecurePassword(length: number = 32): string {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        const array = new Uint8Array(length);
        window.crypto.getRandomValues(array);

        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset[array[i] % charset.length];
        }
        return result;
    }
}

// Export singleton instance
export const cryptoService = new CryptoService();
export default cryptoService;
