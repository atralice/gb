/**
 * Edge-compatible session decryption using Web Crypto API.
 * Only used in middleware - server-side code uses session.ts.
 *
 * NOTE: This file intentionally uses process.env directly instead of @/env.config
 * because the env config imports server-only code that's not compatible with Edge Runtime.
 */

export type SessionPayload = {
  userId: string;
  expiresAt: number;
};

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getSecretKeyFromEnv(): string {
  // eslint-disable-next-line no-restricted-syntax
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is required");
  }
  return secret;
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importKey(hexSecret: string): Promise<CryptoKey> {
  if (hexSecret.length !== 64) {
    throw new Error(
      `SESSION_SECRET must be exactly 64 hex characters. Got ${hexSecret.length}.`
    );
  }
  const keyBuffer = hexToBuffer(hexSecret);
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const buffer = new Uint8Array(keyBuffer).buffer as ArrayBuffer;
  return crypto.subtle.importKey("raw", buffer, { name: "AES-GCM" }, false, [
    "decrypt",
  ]);
}

export async function decryptSessionEdge(
  token: string
): Promise<SessionPayload | null> {
  try {
    const secret = getSecretKeyFromEnv();
    const combined = base64ToBuffer(token);

    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      return null;
    }

    const iv = combined.slice(0, IV_LENGTH);
    // AES-GCM in Web Crypto expects the auth tag appended to the ciphertext
    const ciphertextWithTag = combined.slice(IV_LENGTH);

    const key = await importKey(secret);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertextWithTag
    );

    const decoded = new TextDecoder().decode(decrypted);
    const payload = JSON.parse(decoded);

    // Validate payload structure
    if (
      typeof payload.userId !== "string" ||
      typeof payload.expiresAt !== "number"
    ) {
      return null;
    }

    // Check expiration
    if (payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
