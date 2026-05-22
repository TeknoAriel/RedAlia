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
    p.page_url ? `Página: ${p.page_url}` : null,
    p.organization_name ? `Inmobiliaria: ${p.organization_name}` : null,
    p.assigned_user_name ? `Asesor: ${p.assigned_user_name}` : null,
    p.leadIntentId ? `Intent: ${p.leadIntentId}` : null,
  ].filter(Boolean);
  if (!context.length) return p.message;
  return `${p.message}\n\n${context.join(" · ")}`;
}

/** Cuerpo para `POST /api/v1/messages` (doc KiteProp Messages). */
export function buildKitepropMessagesBody(p: ConsultaPayload): Record<string, unknown> {
  if (!p.property_id || p.property_id <= 0) {
    throw new Error("property_id es obligatorio para mensajes de propiedad");
  }

  const { first_name, last_name } = parseNameParts(p.name);
  const body: Record<string, unknown> = {
    body: appendContextMessage(p),
    email: p.email,
    property_id: p.property_id,
    first_name,
  };

  if (last_name) body.last_name = last_name;
  if (p.phone) body.phone = p.phone;

  const assignedId = p.assigned_user_id ?? p.user_id;
  if (assignedId != null && assignedId > 0) {
    body.assigned_user_id = assignedId;
    body.user_id = assignedId;
  }

  if (p.organization_id != null && p.organization_id > 0) {
    body.organization_id = p.organization_id;
  }

  return body;
}
