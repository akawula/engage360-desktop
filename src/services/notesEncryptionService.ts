import { cryptoService } from '../lib/crypto';
import { devicesService } from './devicesService';
import { authService } from './authService';
import type { Note, EncryptedNote } from '../types';

/**
 * Service for handling note encryption and decryption
 */
class NotesEncryptionService {
    /**
     * Encrypt a note for all trusted devices
     */
    async encryptNote(note: Note, password: string): Promise<EncryptedNote> {
        if (!cryptoService.isAvailable()) {
            throw new Error('Encryption not available in this browser');
        }

        // Generate AES key for this note
        const aesKey = await cryptoService.generateNoteEncryptionKey();

        // Encrypt the note content
        const encryptionResult = await cryptoService.encryptNoteContent(note.content, aesKey);

        // Get all trusted device public keys
        const trustedKeysResponse = await devicesService.getTrustedDeviceKeys();
        if (!trustedKeysResponse.success || !trustedKeysResponse.data) {
            throw new Error('Could not get trusted device keys');
        }

        // Encrypt the AES key for each trusted device
        const deviceKeys = await Promise.all(
            trustedKeysResponse.data.map(async (device) => ({
                deviceId: device.deviceId,
                encryptedKey: await cryptoService.encryptKeyForDevice(aesKey, device.publicKey)
            }))
        );

        return {
            ...note,
            encrypted: true,
            encryptedContent: encryptionResult.encryptedData,
            contentIV: encryptionResult.iv,
            deviceKeys,
            content: undefined // Remove plaintext content
        };
    }

    /**
     * Decrypt a note using the current device's private key
     */
    async decryptNote(encryptedNote: EncryptedNote, password: string): Promise<Note> {
        if (!cryptoService.isAvailable()) {
            throw new Error('Decryption not available in this browser');
        }

        // Get current device
        const currentDeviceResponse = await devicesService.getCurrentDevice();
        if (!currentDeviceResponse.success || !currentDeviceResponse.data) {
            throw new Error('Could not identify current device');
        }

        const currentDeviceId = currentDeviceResponse.data.id;

        // Find the encrypted key for this device
        const deviceKey = encryptedNote.deviceKeys.find(dk => dk.deviceId === currentDeviceId);
        if (!deviceKey) {
            throw new Error('No encryption key available for this device');
        }

        // Get this device's encrypted private key
        const encryptedPrivateKey = authService.getEncryptedPrivateKey();
        if (!encryptedPrivateKey) {
            throw new Error('Device private key not found. Please re-register this device.');
        }

        // Decrypt the AES key
        const aesKey = await cryptoService.decryptKeyForDevice(
            deviceKey.encryptedKey,
            encryptedPrivateKey,
            password
        );

        // Decrypt the note content
        const decryptedContent = await cryptoService.decryptNoteContent(
            {
                encryptedData: encryptedNote.encryptedContent,
                iv: encryptedNote.contentIV
            },
            aesKey
        );

        return {
            ...encryptedNote,
            content: decryptedContent,
            encrypted: undefined,
            encryptedContent: undefined,
            contentIV: undefined,
            deviceKeys: undefined
        };
    }

    /**
     * Check if a note is encrypted
     */
    isNoteEncrypted(note: Note | EncryptedNote): note is EncryptedNote {
        return !!(note as EncryptedNote).encrypted && !!(note as EncryptedNote).encryptedContent;
    }

    /**
     * Re-encrypt a note for newly trusted devices
     * This should be called when a new device is approved
     */
    async reEncryptForNewDevice(noteId: string, password: string): Promise<void> {
        // This would typically:
        // 1. Fetch the note
        // 2. Decrypt it with current device
        // 3. Get all trusted devices
        // 4. Re-encrypt for all devices including new ones
        // 5. Update the note on the server

        // Implementation would depend on your note storage service
        console.log(`Re-encrypting note ${noteId} for newly trusted devices`);
    }

    /**
     * Check if user can decrypt notes (has device keys and password)
     */
    canDecryptNotes(): boolean {
        return authService.hasDeviceKeys() && cryptoService.isAvailable();
    }
}

export const notesEncryptionService = new NotesEncryptionService();
export default notesEncryptionService;
