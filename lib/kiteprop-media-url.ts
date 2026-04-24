/**
 * La API y el feed a veces devuelven logos como `/storage/...` o `//cdn...`.
 * En `<img src>` el navegador las resuelve contra el sitio de Redalia → 404.
 * Opcional: `KITEPROP_PUBLIC_ORIGIN` (sin barra final), p. ej. `https://www.kiteprop.com`.
 */
export function absolutizeKitepropMediaUrl(url: string | null | undefined): string | null {
  const raw = url?.trim();
  if (!raw) return null;
  if (/^https:\/\//i.test(raw)) return raw;
  if (/^http:\/\//i.test(raw)) return `https://${raw.slice(7)}`;
  if (raw.startsWith("//")) return `https:${raw}`;
  const origin =
    (typeof process !== "undefined" && process.env.KITEPROP_PUBLIC_ORIGIN?.trim()) ||
    "https://www.kiteprop.com";
  const base = origin.replace(/\/+$/, "");
  if (raw.startsWith("/")) return `${base}${raw}`;
  return `${base}/${raw}`;
}
