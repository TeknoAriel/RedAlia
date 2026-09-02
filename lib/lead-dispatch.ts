import { buildLeadMailtoUrl } from "@/lib/lead-mailto-fallback";
import { dispatchRedaliaInbox } from "@/lib/redalia-inbox-dispatch";

/**
 * Postulaciones y contacto institucional → bandeja Redalia (correo / webhook).
 * Las consultas sobre una propiedad van por `/api/consultas` → KiteProp Messages.
 */

export type LeadKind = "contact" | "join";

export type LeadPayload = {
  kind: LeadKind;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  empresa?: string;
  cargo?: string;
  ciudad?: string;
  mensaje?: string;
  plan?: string;
};

function trim(s: unknown, max = 8000): string {
  if (s === undefined || s === null) return "";
  const t = String(s).trim();
  return t.length > max ? t.slice(0, max) : t;
}

function formatLeadTextBody(p: LeadPayload): string {
  const lines = [
    `Origen: ${p.kind === "join" ? "Postulación / Únete" : "Formulario de contacto"}`,
    `Nombre: ${p.nombre} ${p.apellido}`,
    `Email: ${p.email}`,
    p.telefono ? `Teléfono: ${p.telefono}` : null,
    p.empresa ? `Empresa / corredora: ${p.empresa}` : null,
    p.cargo ? `Cargo: ${p.cargo}` : null,
    p.ciudad ? `Ciudad: ${p.ciudad}` : null,
    p.plan ? `Plan de interés: ${p.plan}` : null,
    p.mensaje ? `\nMensaje:\n${p.mensaje}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

function leadSubject(p: LeadPayload): string {
  if (p.kind === "join") {
    const org = p.empresa?.trim() || "corredora";
    return `[Redalia] Postulación de socio — ${org}`;
  }
  return `[Redalia] Contacto — ${p.nombre} ${p.apellido}`.trim();
}

export type DispatchResult =
  | { ok: true; via: "webhook" | "email" | "noop" | "github" }
  | { ok: true; via: "mailto"; mailtoUrl: string }
  | { ok: false; error: string };

export async function dispatchLead(payload: LeadPayload): Promise<DispatchResult> {
  const result = await dispatchRedaliaInbox({
    kind: payload.kind,
    subject: leadSubject(payload),
    textBody: formatLeadTextBody(payload),
    replyTo: payload.email,
    meta: { kind: payload.kind },
  });
  if (result.ok) return result;

  if (process.env.NODE_ENV === "production") {
    return { ok: true, via: "mailto", mailtoUrl: buildLeadMailtoUrl(payload) };
  }

  return result;
}

export function parseLeadFromJson(body: unknown, kind: LeadKind): LeadPayload | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Cuerpo inválido" };
  }
  const o = body as Record<string, unknown>;
  const nombre = trim(o.nombre);
  const apellido = trim(o.apellido);
  const email = trim(o.email, 320);
  const telefono = trim(o.telefono, 80) || undefined;
  const empresa = trim(o.empresa, 200) || undefined;
  const cargo = trim(o.cargo, 120) || undefined;
  const ciudad = trim(o.ciudad, 120) || undefined;
  const mensaje = trim(o.mensaje, 8000) || undefined;
  const plan = trim(o.plan, 80) || undefined;

  if (!nombre || !apellido) return { error: "Nombre y apellido son obligatorios" };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Email inválido" };
  }

  if (kind === "join") {
    if (!trim(o.empresa)) return { error: "Empresa o corredora es obligatoria" };
    if (!trim(o.ciudad)) return { error: "Ciudad es obligatoria" };
    if (!telefono) return { error: "Teléfono es obligatorio" };
  }

  if (kind === "contact") {
    if (!mensaje) return { error: "Mensaje es obligatorio" };
  }

  return {
    kind,
    nombre,
    apellido,
    email,
    telefono,
    empresa,
    cargo,
    ciudad,
    mensaje,
    plan,
  };
}
