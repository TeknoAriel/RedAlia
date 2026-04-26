/** Tamaño de página del directorio `/socios` (server). */
export function getSociosPageSize(): number {
  const raw = process.env.REDALIA_SOCIOS_PAGE_SIZE?.trim();
  const n = raw ? parseInt(raw, 10) : NaN;
  if (Number.isFinite(n) && n >= 12 && n <= 80) return n;
  return 40;
}
