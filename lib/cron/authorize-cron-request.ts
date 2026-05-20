import { timingSafeEqual } from "node:crypto";

/** `CRON_SECRET` es el nombre documentado; `REDALIA_SYNC_SECRET` alias en proyectos Vercel legacy. */
export function getCronSecretOrNull(): string | null {
  const secret =
    process.env.CRON_SECRET?.trim() || process.env.REDALIA_SYNC_SECRET?.trim();
  return secret || null;
}

export function isAuthorizedCronRequest(authHeader: string | null, secret: string): boolean {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7).trim();
  if (!token || !secret) return false;
  try {
    const a = Buffer.from(token, "utf8");
    const b = Buffer.from(secret, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
