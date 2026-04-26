import type { PublicPartnerScope } from "@/lib/public-data/types";

/** Etiquetas de rol solo para la capa pública (la UI no importa `lib/agencies`). */
export const publicPartnerRoleLabelEs: Record<PublicPartnerScope, string> = {
  agency: "Corredora",
  advertiser: "Anunciante",
  agent: "Oficina / profesional",
  sub_agent: "Subagente",
};

export function publicPartnerListingCtaLabel(scope: PublicPartnerScope): string {
  if (scope === "agency") return "Ver propiedades de esta corredora";
  if (scope === "advertiser") return "Ver propiedades de este anunciante";
  if (scope === "agent") return "Ver propiedades de esta oficina o profesional";
  return "Ver propiedades de este subagente";
}
