/**
 * Etiquetas de cobertura geográfica para UI pública.
 * Evita volcar direcciones/calles crudas (hinchan HTML y no aportan al directorio).
 */

const MAX_LABEL_LEN = 48;

/** Descarta ruido típico de `zone` (calle, depto, refs largas). */
export function isUsableCoverageLabel(raw: string): boolean {
  const t = raw.trim();
  if (!t || t.length > MAX_LABEL_LEN) return false;
  if (/^\d+$/.test(t)) return false;
  // Direcciones / refs: muchas comas, “depto”, números de calle densos.
  if (/,.*,/.test(t)) return false;
  if (/\b(depto|dpto|departamento|calle|avenida|av\.|pasaje)\b/i.test(t)) return false;
  if ((t.match(/\d/g) ?? []).length >= 4) return false;
  return true;
}

/**
 * Preferir región/ciudad; zona solo si es corta y limpia.
 */
export function coverageLabelsFromLocationFields(fields: {
  region?: string | null;
  city?: string | null;
  zone?: string | null;
  zoneSecondary?: string | null;
}): string[] {
  const out = new Set<string>();
  for (const label of [fields.region, fields.city]) {
    const t = label?.trim();
    if (t && isUsableCoverageLabel(t)) out.add(t);
  }
  for (const label of [fields.zone, fields.zoneSecondary]) {
    const t = label?.trim();
    if (t && isUsableCoverageLabel(t) && t.length <= 32) out.add(t);
  }
  return [...out].sort((a, b) => a.localeCompare(b, "es"));
}

export function sanitizeCoverageLabels(labels: readonly string[], max = 8): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of labels) {
    const t = raw.trim();
    if (!isUsableCoverageLabel(t)) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= max) break;
  }
  return out.sort((a, b) => a.localeCompare(b, "es"));
}
