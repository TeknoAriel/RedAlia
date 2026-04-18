import "server-only";

import { publicPartnerListingCtaLabel, publicPartnerRoleLabelEs } from "@/lib/public-data/labels";
import type { PublicPartnerDirectoryRowDraft, PublicPartnerScope } from "@/lib/public-data/types";

function pickString(o: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function pickNumberishId(o: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/**
 * Intenta mapear un objeto **desconocido** de organización de red a `PublicPartnerDirectoryRowDraft`.
 * Claves típicas probadas (sin asumir contrato fijo): id, name, logo, contactos.
 * `partnerKey` prefijado para no colisionar con claves del feed (`kpnet:`).
 */
export function mapUnknownNetworkOrganizationToPublicDraft(raw: unknown): PublicPartnerDirectoryRowDraft | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const id = pickNumberishId(o, ["id", "organization_id", "organizationId", "uuid", "slug"]);
  const name = pickString(o, ["name", "legal_name", "legalName", "display_name", "displayName", "title"]);
  if (!id || !name) return null;

  const scope: PublicPartnerScope = "agency";
  const logoUrl = pickString(o, ["logo_url", "logoUrl", "logo", "image_url", "imageUrl"]);
  const email = pickString(o, ["email", "contact_email", "contactEmail"]);
  const phone = pickString(o, ["phone", "telephone", "phone_number", "phoneNumber"]);
  const mobile = pickString(o, ["mobile", "cellphone", "celular"]);
  const whatsapp = pickString(o, ["whatsapp", "whatsapp_number", "whatsappNumber"]);
  const webUrl = pickString(o, ["web_url", "webUrl", "website", "url"]);

  return {
    partnerKey: `kpnet:org:${id}`,
    scope,
    displayName: name,
    roleLabel: publicPartnerRoleLabelEs[scope],
    listingCtaLabel: publicPartnerListingCtaLabel(scope),
    logoUrl: logoUrl || null,
    propertyCount: 0,
    email: email || null,
    phone: phone || null,
    mobile: mobile || null,
    whatsapp: whatsapp || null,
    webUrl: webUrl || null,
    coverageLabels: [],
  };
}
