/**
 * Endpoints internos de salud: query `?secret=<REDALIA_HEALTH_SECRET>`.
 * Sin secret válido: responder 401 (requisito Sprint 0.1).
 */
export function isRedaliaHealthAuthorized(request: Request): boolean {
  const expected = process.env.REDALIA_HEALTH_SECRET?.trim();
  if (!expected) return false;
  const url = new URL(request.url);
  const provided = url.searchParams.get("secret")?.trim() ?? "";
  return provided.length > 0 && provided === expected;
}

export function isRedaliaSyncAuthorized(request: Request): boolean {
  const url = new URL(request.url);
  const provided = url.searchParams.get("secret")?.trim() ?? "";
  const syncExpected = process.env.REDALIA_SYNC_SECRET?.trim();
  const healthExpected = process.env.REDALIA_HEALTH_SECRET?.trim();
  if (syncExpected && provided === syncExpected) return true;
  if (healthExpected && provided === healthExpected) return true;

  // Compatibilidad con Vercel Cron (Authorization: Bearer CRON_SECRET).
  const cronHeader = request.headers.get("authorization")?.trim();
  const cronExpected = process.env.CRON_SECRET?.trim();
  if (cronExpected && cronHeader === `Bearer ${cronExpected}`) return true;
  return false;
}
