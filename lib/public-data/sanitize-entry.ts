import type { PublicPartnerDirectoryEntry } from "@/lib/public-data/types";

function trimOrNull(s: string | null | undefined): string | null {
  const t = s?.trim();
  return t && t.length > 0 ? t : null;
}

function isPlausibleEmail(s: string): boolean {
  if (s.length < 5 || s.length > 120) return false;
  const at = s.indexOf("@");
  if (at < 1 || at === s.length - 1) return false;
  return !/\s/.test(s);
}

function isPlausibleWebUrl(s: string): boolean {
  return /^https?:\/\//i.test(s) && s.length > 10;
}

function isPlausiblePhoneLike(s: string): boolean {
  const digits = s.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

/**
 * Ajusta contactos publicables: solo valores razonables; el resto se anula para no mostrar ruido ni datos dudosos.
 * No inventa datos; solo filtra lo que no pasa validación mínima.
 */
export function sanitizePublicPartnerDirectoryEntry(
  entry: PublicPartnerDirectoryEntry,
): PublicPartnerDirectoryEntry {
  const email = trimOrNull(entry.email);
  const webUrl = trimOrNull(entry.webUrl);
  const phone = trimOrNull(entry.phone);
  const mobile = trimOrNull(entry.mobile);
  const whatsapp = trimOrNull(entry.whatsapp);

  return {
    ...entry,
    displayName: entry.displayName,
    email: email && isPlausibleEmail(email) ? email : null,
    webUrl: webUrl && isPlausibleWebUrl(webUrl) ? webUrl : null,
    phone: phone && isPlausiblePhoneLike(phone) ? phone : null,
    mobile: mobile && isPlausiblePhoneLike(mobile) ? mobile : null,
    whatsapp: whatsapp && isPlausiblePhoneLike(whatsapp) ? whatsapp : null,
  };
}
