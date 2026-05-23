import type { ConsultaPayload } from "@/lib/consulta-dispatch-types";

function parseNameParts(fullName: string): { first_name: string; last_name: string | null } {
  const safe = fullName.trim();
  if (!safe) return { first_name: "Contacto", last_name: null };
  const parts = safe.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first_name: safe, last_name: null };
  return { first_name: parts[0]!, last_name: parts.slice(1).join(" ") || null };
}

function appendContextMessage(p: ConsultaPayload): string {
  const context = [
    p.property_code ? `Código: ${p.property_code}` : null,
    p.property_title ? `Propiedad: ${p.property_title}` : null,
    `property_id (KP): ${p.property_id}`,
    p.page_url ? `Página: ${p.page_url}` : null,
    p.organization_name ? `Inmobiliaria: ${p.organization_name}` : null,
    p.assigned_user_name ? `Asesor: ${p.assigned_user_name}` : null,
  ].filter(Boolean);
  const base = p.message.trim();
  if (!context.length) return base;
  return `${base}\n\n${context.join(" · ")}`;
}

/** Fallback cuando `/messages` falla: contacto CRM asignado al asesor con contexto de la propiedad. */
export function buildKitepropContactFallbackBody(p: ConsultaPayload): Record<string, unknown> {
  const { first_name, last_name } = parseNameParts(p.name);
  const body: Record<string, unknown> = {
    first_name,
    last_name,
    email: p.email,
    phone: p.phone,
    source: "redalia_web",
    summary: appendContextMessage(p),
  };

  const assignedId = p.assigned_user_id ?? p.user_id;
  if (assignedId != null && assignedId > 0) {
    body.assigned_user_id = assignedId;
  }

  return body;
}

export function isKitepropMessagesServerError(error: string, upstreamStatus?: number): boolean {
  if (upstreamStatus != null && upstreamStatus >= 500) return true;
  const e = error.toLowerCase();
  return e.includes("sqlstate") || e.includes("integrity constraint") || e.includes("respondió 5");
}
