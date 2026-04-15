import type { PublicPartnerScope } from "@/lib/public-data/types";

/** Etiquetas de rol solo para la capa pública (la UI no importa `lib/agencies`). */
export const publicPartnerRoleLabelEs: Record<PublicPartnerScope, string> = {
  agency: "Inmobiliaria",
  advertiser: "Anunciante",
};

export function publicPartnerListingCtaLabel(scope: PublicPartnerScope): string {
  if (scope === "agency") return "Ver propiedades de esta inmobiliaria";
  return "Ver propiedades de este anunciante";
}
