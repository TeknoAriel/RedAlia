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
