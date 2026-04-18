import "server-only";

/** TTL conservador bajo JWT típicos de 60 min (sin asumir refresh). */
const DEFAULT_TTL_MS = 50 * 60 * 1000;

let cached: { token: string; expiresAt: number } | null = null;

export function readCachedLoginBearer(): string | null {
  if (!cached) return null;
  if (Date.now() >= cached.expiresAt) {
    cached = null;
    return null;
  }
  return cached.token;
}

export function writeCachedLoginBearer(token: string, ttlMs: number = DEFAULT_TTL_MS): void {
  cached = { token, expiresAt: Date.now() + ttlMs };
}

export function clearCachedLoginBearer(): void {
  cached = null;
}
