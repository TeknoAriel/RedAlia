import "server-only";

/** Solo nombres de claves (nivel 1) de un objeto; sin valores — apto para respuestas de auditoría. */
export function summarizeObjectKeys(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.keys(value as Record<string, unknown>).sort();
}

/** Claves de nivel 1 de `parent[childKey]` si es objeto plano. */
export function summarizeChildObjectKeys(parent: unknown, childKey: string): string[] {
  if (!parent || typeof parent !== "object" || Array.isArray(parent)) return [];
  const v = (parent as Record<string, unknown>)[childKey];
  if (!v || typeof v !== "object" || Array.isArray(v)) return [];
  return summarizeObjectKeys(v);
}

/** Para cada clave en `childKeys`, si `parent[key]` es objeto, devuelve `{ key: sortedKeys }`. */
export function summarizeChildObjectsKeys(
  parent: unknown,
  childKeys: readonly string[],
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  if (!parent || typeof parent !== "object" || Array.isArray(parent)) return out;
  const o = parent as Record<string, unknown>;
  for (const k of childKeys) {
    const keys = summarizeChildObjectKeys(o, k);
    if (keys.length) out[k] = keys;
  }
  return out;
}
