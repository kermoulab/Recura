/**
 * Password hashing (server side).
 *
 * Uses the SAME Argon2id parameters as the existing client-side code in
 * src/utils/security.ts (iterations=3, memory=65536KiB, parallelism=1,
 * hashLength=32, 16-byte salt) so that:
 *   - admin hashes created by the installer verify with the existing
 *     verifyArgon2idPassword() client routine, and
 *   - the installer can verify the SEED admin hash from scripts/seed_admin.sql.
 */

import { argon2id, argon2Verify } from 'hash-wasm';

export const ARGON2 = Object.freeze({
  iterations: 3,
  memorySize: 65536,
  parallelism: 1,
  hashLength: 32,
  saltLength: 16,
});

function randomSalt(bytes) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return buf;
}

export async function hashPassword(password) {
  return argon2id({
    password,
    salt: randomSalt(ARGON2.saltLength),
    iterations: ARGON2.iterations,
    memorySize: ARGON2.memorySize,
    parallelism: ARGON2.parallelism,
    hashLength: ARGON2.hashLength,
    outputType: 'encoded',
  });
}

export async function verifyPassword(password, encodedHash) {
  if (!password || !encodedHash) return false;
  if (!String(encodedHash).startsWith('$argon2id$')) return false;
  try {
    return argon2Verify({ password, hash: encodedHash });
  } catch {
    return false;
  }
}

/** Validates installer-provided password policy (mirrors client rules). */
export function validatePasswordPolicy(password) {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > 128) return 'Password must be at most 128 characters.';
  if (/[\u0000-\u001f\u007f]/.test(password)) return 'Password contains invalid control characters.';
  return null;
}
