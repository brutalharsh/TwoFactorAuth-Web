/**
 * Web Crypto API utilities for encrypting/decrypting TOTP secrets
 */

// Derive an encryption key from the user's password
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Generate a random salt for key derivation
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

// Generate a random IV for AES-GCM
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

// Encrypt a TOTP secret
export async function encryptSecret(
  secret: string,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);

  return crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    data
  );
}

// Decrypt a TOTP secret
export async function decryptSecret(
  encryptedData: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<string> {
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    encryptedData
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
}

// Convert ArrayBuffer to base64 string for storage
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 string back to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Store the encryption key securely in the browser
export async function storeEncryptionKey(userId: string, key: CryptoKey): Promise<void> {
  // Export the key to store it
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  const keyString = arrayBufferToBase64(exportedKey);

  // Store in sessionStorage (cleared when browser closes)
  // For better security, you might want to use IndexedDB with additional protection
  sessionStorage.setItem(`enc_key_${userId}`, keyString);
}

// Retrieve the encryption key from storage
export async function getEncryptionKey(userId: string): Promise<CryptoKey | null> {
  const keyString = sessionStorage.getItem(`enc_key_${userId}`);
  if (!keyString) return null;

  const keyBuffer = base64ToArrayBuffer(keyString);
  return crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Clear the encryption key from storage
export function clearEncryptionKey(userId: string): void {
  sessionStorage.removeItem(`enc_key_${userId}`);
}

// Helper to encrypt a secret with all necessary parameters
export async function encryptTOTPSecret(
  secret: string,
  password: string,
  userId: string
): Promise<{ encryptedSecret: string; iv: string; salt: string }> {
  const salt = generateSalt();
  const iv = generateIV();
  const key = await deriveKey(password, salt);

  // Store the key for this session
  await storeEncryptionKey(userId, key);

  const encryptedData = await encryptSecret(secret, key, iv);

  return {
    encryptedSecret: arrayBufferToBase64(encryptedData),
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt)
  };
}

// Helper to decrypt a secret with stored parameters
export async function decryptTOTPSecret(
  encryptedSecret: string,
  iv: string,
  userId: string
): Promise<string | null> {
  try {
    // Try to get the key from session storage first
    const key = await getEncryptionKey(userId);

    if (!key) {
      // If no key in session, we'll need to prompt for password
      // This will be handled by the component
      return null;
    }

    const encryptedData = base64ToArrayBuffer(encryptedSecret);
    const ivArray = new Uint8Array(base64ToArrayBuffer(iv));

    return await decryptSecret(encryptedData, key, ivArray);
  } catch (error) {
    console.error('Failed to decrypt secret:', error);
    return null;
  }
}