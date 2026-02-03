import "server-only";
import crypto from "crypto";
import { z } from "zod";
import { env } from "@/env.config";

const sessionPayloadSchema = z.object({
  userId: z.string(),
  expiresAt: z.number(),
});

export type SessionPayload = z.infer<typeof sessionPayloadSchema>;

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getSecretKey(): Buffer {
  return Buffer.from(env.SESSION_SECRET, "hex");
}

export function encryptSession(payload: SessionPayload): string {
  const key = getSecretKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(payload);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Format: base64(iv + ciphertext + authTag)
  // This format is compatible with Web Crypto API for edge runtime
  const combined = Buffer.concat([iv, encrypted, authTag]);
  return combined.toString("base64");
}

export function decryptSession(token: string): SessionPayload | null {
  try {
    const key = getSecretKey();
    const combined = Buffer.from(token, "base64");

    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      return null;
    }

    const iv = combined.subarray(0, IV_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH, -AUTH_TAG_LENGTH);
    const authTag = combined.subarray(-AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    const parsed = JSON.parse(decrypted.toString("utf8"));
    const payload = sessionPayloadSchema.parse(parsed);

    // Check expiration
    if (payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
