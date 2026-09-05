import "server-only";
import { type Algorithm, hash, verify } from "@node-rs/argon2";

// Algorithm is an ambient const enum, which isolated modules cannot read. 2 is Argon2id.
const ARGON2ID = 2 as Algorithm;

/**
 * Argon2id with the OWASP baseline: 19 MiB memory, 2 passes, 1 lane.
 * The encoded hash carries its own salt and parameters.
 */
export const ARGON2_PARAMS = {
  algorithm: ARGON2ID,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const;

const ENCODED_PARAMS = `m=${ARGON2_PARAMS.memoryCost},t=${ARGON2_PARAMS.timeCost},p=${ARGON2_PARAMS.parallelism}`;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain.normalize("NFKC"), ARGON2_PARAMS);
}

/** Never throws on a malformed stored hash; a bad hash simply does not verify. */
export async function verifyPassword(stored: string, plain: string): Promise<boolean> {
  try {
    return await verify(stored, plain.normalize("NFKC"));
  } catch {
    return false;
  }
}

/** True when a stored hash was made with weaker or different parameters. */
export function needsRehash(stored: string): boolean {
  return !stored.startsWith("$argon2id$v=19$") || !stored.includes(`$${ENCODED_PARAMS}$`);
}

// Verifying against a fixed hash when the account does not exist keeps the
// response time of an unknown login close to that of a wrong password.
let decoy: Promise<string> | undefined;

export async function verifyDecoy(plain: string): Promise<false> {
  decoy ??= hashPassword("decoy-password-for-unknown-accounts");
  await verifyPassword(await decoy, plain);
  return false;
}
