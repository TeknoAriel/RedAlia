/** Genera enlace wa.me a partir de texto con dígitos (Chile u otros países si el número ya incluye código). */
export function whatsappHrefFromRaw(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  const digits = s.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}`;
}

export function telHref(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;
  const compact = phone.replace(/[^\d+]/g, "");
  return compact ? `tel:${compact}` : null;
}
