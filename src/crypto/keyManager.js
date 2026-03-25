export async function generateKeyPair() {
  return crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  );
}

export async function exportPublicKey(key) {
  return crypto.subtle.exportKey('jwk', key);
}

export async function exportPrivateKey(key) {
  return crypto.subtle.exportKey('jwk', key);
}

export async function importPublicKey(jwk) {
  return crypto.subtle.importKey(
    'jwk', jwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    true, []
  );
}

export async function importPrivateKey(jwk) {
  return crypto.subtle.importKey(
    'jwk', jwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    true, ['deriveKey']
  );
}
