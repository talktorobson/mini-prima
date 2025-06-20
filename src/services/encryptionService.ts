/**
 * Encryption Service for Legal Message Confidentiality
 * 
 * Provides AES-256-GCM encryption for sensitive legal communications
 * to ensure attorney-client privilege and data protection compliance.
 */

// Simple encryption key derivation from environment
const getEncryptionKey = async (): Promise<CryptoKey> => {
  // In production, this should be managed by a proper key management service
  const keyMaterial = process.env.VITE_MESSAGE_ENCRYPTION_KEY || 'fallback-key-for-development-only-not-secure';
  
  const encoder = new TextEncoder();
  const keyData = await crypto.subtle.digest('SHA-256', encoder.encode(keyMaterial));
  
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypts message content using AES-256-GCM
 */
export const encryptMessage = async (plaintext: string): Promise<string> => {
  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Generate random IV (12 bytes for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the data
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Return base64 encoded result
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt message content');
  }
};

/**
 * Decrypts message content using AES-256-GCM
 */
export const decryptMessage = async (encryptedText: string): Promise<string> => {
  try {
    // Handle unencrypted legacy messages
    if (!encryptedText || typeof encryptedText !== 'string') {
      return encryptedText || '';
    }
    
    // Check if message appears to be encrypted (base64 format)
    if (!encryptedText.match(/^[A-Za-z0-9+/]+=*$/)) {
      // Likely plain text (legacy message)
      return encryptedText;
    }
    
    const key = await getEncryptionKey();
    
    // Decode base64
    const combined = new Uint8Array(
      atob(encryptedText)
        .split('')
        .map(char => char.charCodeAt(0))
    );
    
    // Extract IV (first 12 bytes) and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encrypted
    );
    
    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed for message:', error);
    
    // If decryption fails, it might be a legacy plain text message
    // Return the original text but log the issue
    console.warn('Returning original text as fallback for message:', encryptedText?.substring(0, 50) + '...');
    return encryptedText || '';
  }
};

/**
 * Utility to check if a message appears to be encrypted
 */
export const isEncrypted = (text: string): boolean => {
  if (!text || typeof text !== 'string') return false;
  
  // Check if it's a valid base64 string (likely encrypted)
  return text.match(/^[A-Za-z0-9+/]+=*$/) !== null && text.length > 16;
};

/**
 * Batch decrypt multiple messages for efficient loading
 */
export const decryptMessages = async (messages: Array<{ id: string; content: string }>): Promise<Array<{ id: string; content: string }>> => {
  try {
    const decryptedMessages = await Promise.all(
      messages.map(async (msg) => ({
        id: msg.id,
        content: await decryptMessage(msg.content)
      }))
    );
    
    return decryptedMessages;
  } catch (error) {
    console.error('Batch decryption failed:', error);
    
    // Return original messages as fallback
    return messages;
  }
};

/**
 * Development utility to migrate existing plain text messages to encrypted format
 */
export const migrateMessageToEncrypted = async (plaintext: string): Promise<string> => {
  if (isEncrypted(plaintext)) {
    // Already encrypted
    return plaintext;
  }
  
  // Encrypt the plain text message
  return await encryptMessage(plaintext);
};