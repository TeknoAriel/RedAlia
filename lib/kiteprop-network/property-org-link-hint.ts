import "server-only";

/**
 * Devuelve identificadores candidatos de organización/publicador en un objeto propiedad **desconocido**.
 * Sirve para auditoría (ligar propiedad ↔ inmobiliaria) sin exponer el payload completo.
 */
export function extractOrganizationLinkHints(raw: unknown): {
  hints: string[];
  keysTouched: string[];
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { hints: [], keysTouched: [] };
  }
  const o = raw as Record<string, unknown>;
  const keysTouched: string[] = [];
  const hints: string[] = [];

  const tryScalar = (key: string) => {
    const v = o[key];
    keysTouched.push(key);
    if (typeof v === "number" && Number.isFinite(v)) hints.push(String(v));
    else if (typeof v === "string" && v.trim()) hints.push(v.trim());
  };

  const scalarKeys = [
    "organization_id",
    "organizationId",
    "agency_id",
    "agencyId",
    "publisher_id",
    "publisherId",
    "owner_organization_id",
    "ownerOrganizationId",
  ] as const;
  for (const k of scalarKeys) {
    tryScalar(k);
  }

  const nested = ["organization", "agency", "publisher", "owner_organization"] as const;
  for (const nk of nested) {
    const v = o[nk];
    keysTouched.push(nk);
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const sub = v as Record<string, unknown>;
      const id = sub.id ?? sub.organization_id ?? sub.organizationId;
      if (typeof id === "number" && Number.isFinite(id)) hints.push(String(id));
      else if (typeof id === "string" && id.trim()) hints.push(id.trim());
    }
  }

  return { hints: [...new Set(hints)], keysTouched };
}
