import "server-only";

import { kitepropGetJson } from "@/lib/kiteprop/client";

const ALLOWED_LIMITS = new Set([15, 30, 50]);

/**
 * `GET /properties` según documentación pública — autenticación **Bearer** (`KITEPROP_ACCESS_TOKEN` o `KITEPROP_API_SECRET`).
 * El catálogo público del sitio sigue usando el JSON de difusión (`KITEPROP_PROPERTIES_URL`); esto es solo capa de descubrimiento / futura convergencia.
 *
 * @see docs/kiteprop-data-model.md
 */
export function getKitePropPropertiesApiPage(query?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const page = Math.max(1, query?.page ?? 1);
  const rawLimit = query?.limit ?? 15;
  const limit = ALLOWED_LIMITS.has(rawLimit) ? rawLimit : 15;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (query?.status?.trim()) {
    qs.set("status", query.status.trim());
  }
  return kitepropGetJson<unknown>(`/properties?${qs.toString()}`, { auth: "bearer" });
}
