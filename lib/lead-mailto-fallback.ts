import { siteConfig } from "@/lib/site-config";
import type { LeadPayload } from "@/lib/lead-dispatch";

export function buildLeadMailtoUrl(payload: LeadPayload): string {
  const subject =
    payload.kind === "join"
      ? `[Redalia] Postulación — ${payload.empresa ?? "socio"}`
      : `[Redalia] Contacto — ${payload.nombre} ${payload.apellido}`.trim();

  const lines = [
    `Nombre: ${payload.nombre} ${payload.apellido}`,
    `Email: ${payload.email}`,
    payload.telefono ? `Teléfono: ${payload.telefono}` : null,
    payload.empresa ? `Empresa: ${payload.empresa}` : null,
    payload.cargo ? `Cargo: ${payload.cargo}` : null,
    payload.ciudad ? `Ciudad: ${payload.ciudad}` : null,
    payload.mensaje ? `\n${payload.mensaje}` : null,
  ].filter(Boolean);

  const params = new URLSearchParams({
    subject,
    body: lines.join("\n"),
  });

  return `mailto:${siteConfig.contact.email}?${params.toString()}`;
}
