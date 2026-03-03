import { generateKeyPair, exportPublicKey, importPublicKey } from './keyManager';
import { deriveSharedKey, encrypt, decrypt } from './encryption';

// Generate a random AES-256 group key (extractable so we can export/share it)
export async function generateGroupKey() {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Export group key to base64 string
export async function exportGroupKey(key) {
  const raw = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

// Import group key from base64 string
export async function importGroupKey(b64) {
  const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'raw', raw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt the group key for a specific member using pairwise ECDH
// Returns { iv, ciphertext } that only that member can decrypt
export async function encryptGroupKeyForMember(groupKey, myPrivateKey, memberPublicKey) {
  const groupKeyB64 = await exportGroupKey(groupKey);
  const pairwiseKey = await deriveSharedKey(myPrivateKey, memberPublicKey);
  return encrypt(pairwiseKey, groupKeyB64);
}

// Decrypt the group key received from the creator
export async function decryptGroupKeyFromCreator(encryptedPayload, myPrivateKey, creatorPublicKey) {
  const pairwiseKey = await deriveSharedKey(myPrivateKey, creatorPublicKey);
  const groupKeyB64 = await decrypt(pairwiseKey, encryptedPayload.iv, encryptedPayload.ciphertext);
  return importGroupKey(groupKeyB64);
}
