# End-to-End Encryption Backend Requirements

## Overview

The frontend has been implemented with comprehensive end-to-end encryption for notes using device-based key management. This document outlines the backend changes required to support the E2E encryption system.

## 🔐 E2E Encryption Architecture

### Core Concepts
- **Device-based encryption**: Each device has its own ECDH key pair
- **Note encryption**: Notes are encrypted with AES-256-GCM using random keys
- **Key sharing**: AES keys are encrypted for each trusted device using ECDH
- **Recovery system**: 12-word recovery keys for account recovery when all devices are lost

### Encryption Flow
1. **Note Creation**: Generate random AES key → Encrypt content → Encrypt AES key for each trusted device
2. **Note Access**: Get encrypted AES key for current device → Decrypt with device private key → Decrypt note content
3. **Device Approval**: Share existing note keys with newly approved device
4. **Account Recovery**: Use recovery keys to restore access when all devices are lost

## 📋 Required Backend Changes

### 1. User Registration Endpoint Updates

**Endpoint**: `POST /api/auth/register`

**Request Changes**:
```typescript
interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    deviceName: string;
    deviceType: string;
    devicePublicKey: string; // NEW: Base64 encoded ECDH public key
}
```

**Response Changes**:
```typescript
interface RegisterResponse {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    device: Device; // NEW: Created device info
}
```

**Backend Requirements**:
- Store `devicePublicKey` in the devices table
- Create first device automatically as trusted (`trusted: true`)
- Generate and store 12 recovery keys encrypted with user password
- Link device to user account

### 2. Device Management Endpoints

#### Device Registration
**Endpoint**: `POST /api/devices`

**Request**:
```typescript
interface DeviceRegistrationRequest {
    deviceName: string;
    deviceType: string;
    password: string; // User's account password for verification
    publicKey: string; // NEW: Base64 encoded ECDH public key
}
```

**Backend Requirements**:
- Verify password against user account
- Store device with `trusted: false` initially
- Store `publicKey` in devices table
- Return device info with untrusted status

#### Device Approval
**Endpoint**: `POST /api/devices/{deviceId}/approve`

**Backend Requirements**:
- Set `trusted: true` for the device
- Return updated device info
- Optionally: Trigger key sharing process

#### Get Trusted Device Keys
**Endpoint**: `GET /api/devices/trusted-keys`

**Response**:
```typescript
interface TrustedDeviceKey {
    deviceId: string;
    publicKey: string;
}

type TrustedDeviceKeysResponse = TrustedDeviceKey[];
```

**Backend Requirements**:
- Return public keys for all trusted devices of current user
- Only include devices where `trusted: true`

#### Device Recovery
**Endpoint**: `POST /api/devices/recover`

**Request**:
```typescript
interface DeviceRecoveryRequest {
    deviceName: string;
    deviceType: string;
    password: string;
    publicKey: string;
    recoveryKeys: string[]; // Array of recovery key words
}
```

**Backend Requirements**:
- Validate recovery keys against stored encrypted recovery keys
- Require at least 8 out of 12 keys to match
- Create new device as trusted
- Revoke all existing devices (security measure)
- Generate new recovery keys

### 3. Device Schema Updates

**Devices Table**:
```sql
CREATE TABLE devices (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    device_name VARCHAR NOT NULL,
    device_type VARCHAR NOT NULL,
    public_key TEXT, -- NEW: Base64 encoded ECDH public key
    trusted BOOLEAN DEFAULT FALSE, -- NEW: Trust status
    platform VARCHAR,
    version VARCHAR,
    last_used TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 4. Note Encryption Support

#### Note Schema Updates
**Notes Table**:
```sql
ALTER TABLE notes ADD COLUMN encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE notes ADD COLUMN encrypted_content TEXT; -- Base64 encoded encrypted content
ALTER TABLE notes ADD COLUMN content_iv VARCHAR(24); -- Base64 encoded IV for AES-GCM
```

#### Note Device Keys Table (NEW)
```sql
CREATE TABLE note_device_keys (
    id VARCHAR PRIMARY KEY,
    note_id VARCHAR NOT NULL,
    device_id VARCHAR NOT NULL,
    encrypted_key TEXT NOT NULL, -- AES key encrypted with device's public key
    created_at TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    UNIQUE(note_id, device_id)
);
```

#### Note Creation/Update Endpoints
**Request Changes**:
```typescript
interface CreateNoteRequest {
    title: string;
    content?: string; // Plain text (optional for backward compatibility)
    encrypted?: boolean; // NEW: Indicates if note is encrypted
    encryptedContent?: string; // NEW: Base64 encoded encrypted content
    contentIV?: string; // NEW: Base64 encoded IV
    deviceKeys?: Array<{ // NEW: Encrypted keys for each device
        deviceId: string;
        encryptedKey: string;
    }>;
    type: string;
    personId?: string;
    groupId?: string;
    tags?: string[];
}
```

#### Note Device Key Management
**Endpoint**: `POST /api/notes/{noteId}/device-keys`
```typescript
interface ShareNoteKeysRequest {
    deviceKeys: Array<{
        deviceId: string;
        encryptedKey: string; // AES key encrypted for this device
    }>;
}
```

**Endpoint**: `GET /api/notes/{noteId}/device-keys/{deviceId}`
```typescript
interface DeviceKeyResponse {
    encryptedKey: string;
}
```

### 5. User Recovery System

#### Recovery Keys Storage
**Users Table Updates**:
```sql
ALTER TABLE users ADD COLUMN recovery_keys_encrypted TEXT; -- Encrypted recovery keys
ALTER TABLE users ADD COLUMN recovery_salt VARCHAR(32); -- Salt for recovery key encryption
```

#### Recovery Endpoints
**Endpoint**: `POST /api/auth/validate-recovery`
```typescript
interface ValidateRecoveryRequest {
    email: string;
    recoveryKeys: string[];
}

interface ValidateRecoveryResponse {
    valid: boolean;
    recoveryToken?: string; // Temporary token for device recovery
}
```

## 🔒 Security Considerations

### Key Storage
- **Device public keys**: Stored in plain text (public by nature)
- **Device private keys**: NEVER stored on server (client-side only)
- **Recovery keys**: Encrypted with user password using PBKDF2
- **Note AES keys**: Encrypted separately for each trusted device

### Access Control
- Users can only access their own devices and notes
- Untrusted devices cannot decrypt existing notes
- Device approval requires existing trusted device
- Recovery process revokes all existing devices

### Encryption Standards
- **ECDH**: P-256 curve for key exchange
- **AES**: 256-bit GCM mode for note content
- **PBKDF2**: 100,000 iterations for key derivation
- **Recovery keys**: 12 words, require 8+ for recovery

## 🔄 Migration Strategy

### Phase 1: Add New Columns
1. Add new columns to existing tables
2. Default `encrypted: false` for existing notes
3. Add device trust management

### Phase 2: Implement Endpoints
1. Update registration endpoint
2. Add device management endpoints
3. Implement note encryption support

### Phase 3: Enable Encryption
1. New notes can be encrypted
2. Existing notes remain unencrypted (backward compatible)
3. Optional: Provide migration tool for existing notes

## 📱 Frontend Implementation Status

### ✅ Completed Features
- **Device key generation**: ECDH P-256 key pairs with Web Crypto API
- **Registration flow**: Generates device keys + recovery keys during signup
- **Device approval**: Password-protected approval with key sharing
- **Recovery system**: 12-word recovery keys with validation
- **Note encryption**: AES-256-GCM encryption service
- **UI components**: Complete device management interface

### 🔧 Frontend Services
- `authService`: Registration with recovery keys
- `devicesService`: Device management and key sharing
- `cryptoService`: Encryption/decryption operations
- `notesEncryptionService`: High-level note encryption API

### 📋 UI Components
- `RecoveryKeysModal`: Shows recovery keys during registration
- `DeviceApprovalModal`: Password prompt for device approval
- `DeviceRecoveryModal`: Recovery key input interface
- `RegisterDeviceModal`: New device registration

## 🎯 Testing Requirements

### Test Cases Needed
1. **Registration**: Verify device creation and recovery key generation
2. **Device approval**: Test key sharing between devices
3. **Note encryption**: Verify AES encryption/decryption
4. **Recovery flow**: Test account recovery with recovery keys
5. **Error handling**: Invalid passwords, malformed keys, etc.

### Security Testing
1. **Key isolation**: Verify devices can't access other users' keys
2. **Recovery validation**: Test minimum key requirements (8/12)
3. **Untrusted device access**: Verify encryption restrictions
4. **Key rotation**: Test device revocation scenarios

## 📞 API Examples

### Device Registration Flow
```bash
# 1. Register new device
POST /api/devices
{
    "deviceName": "MacBook Pro",
    "deviceType": "laptop",
    "password": "user_password",
    "publicKey": "base64_encoded_public_key"
}

# 2. From trusted device, get untrusted devices
GET /api/devices
# Returns devices with trusted: false

# 3. Approve device
POST /api/devices/{deviceId}/approve
# Sets trusted: true

# 4. Share note keys with newly approved device
POST /api/notes/{noteId}/device-keys
{
    "deviceKeys": [
        {
            "deviceId": "new_device_id",
            "encryptedKey": "aes_key_encrypted_for_new_device"
        }
    ]
}
```

### Note Encryption Flow
```bash
# 1. Create encrypted note
POST /api/notes
{
    "title": "Meeting Notes",
    "encrypted": true,
    "encryptedContent": "base64_encrypted_content",
    "contentIV": "base64_iv",
    "deviceKeys": [
        {
            "deviceId": "device1",
            "encryptedKey": "aes_key_for_device1"
        },
        {
            "deviceId": "device2",
            "encryptedKey": "aes_key_for_device2"
        }
    ]
}

# 2. Get encrypted note
GET /api/notes/{noteId}
# Returns encrypted content + device keys

# 3. Get device-specific key
GET /api/notes/{noteId}/device-keys/{deviceId}
# Returns { "encryptedKey": "..." }
```

This implementation provides a robust, secure, and user-friendly end-to-end encryption system for the notes application. The frontend is fully implemented and ready for integration with these backend changes.
