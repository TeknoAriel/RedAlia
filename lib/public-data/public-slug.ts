import { nameSlug } from "@/lib/agencies";
import type { PublicPartnerScope } from "@/lib/public-data/types";

/** Huella URL-safe de la clave interna (única por socio en el feed). */
export function fingerprintPartnerKey(partnerKey: string): string {
  return partnerKey
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Slug estable: nombre normalizado + tipo + huella de `partnerKey` (evita colisiones de homónimos).
 * No expone el JSON crudo; solo segmentos seguros para URL.
 */
export function buildPublicSlugForEntry(input: {
  displayName: string;
  scope: PublicPartnerScope;
  partnerKey: string;
}): string {
  const base = nameSlug(input.displayName).slice(0, 56) || "participante";
  const scope =
    input.scope === "agency"
      ? "inmobiliaria"
      : input.scope === "advertiser"
        ? "anunciante"
        : input.scope === "agent"
          ? "agente"
          : "subagente";
  const fp = fingerprintPartnerKey(input.partnerKey);
  let out = `${base}-${scope}-${fp}`.replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (out.length > 140) out = out.slice(0, 140).replace(/-+$/g, "");
  return out;
}
