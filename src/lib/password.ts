import { createHash, randomBytes, pbkdf2Sync } from "crypto";

const ITERATIONS = 10000;
const KEY_LENGTH = 64;
const SALT_LENGTH = 32;
const DIGEST = "sha512";

/**
 * Hash a password using PBKDF2 (built-in Node.js crypto, no external deps).
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const verifyHash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return hash === verifyHash;
}
