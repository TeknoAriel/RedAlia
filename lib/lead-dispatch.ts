import { siteConfig } from "@/lib/site-config";

/**
 * Envío de leads desde formularios web.
 *
 * Prioridad:
 * 1) LEADS_WEBHOOK_URL — POST JSON (Make, Zapier, función serverless propia, etc.)
 * 2) KITEPROP_LEAD_POST_URL + KITEPROP_API_TOKEN — POST a la ruta que indique la documentación de KiteProp
 * 3) Sin configuración: acepta el lead (modo noop) para no bloquear UX en desarrollo
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
};

function trim(s: unknown, max = 8000): string {
  if (s === undefined || s === null) return "";
  const t = String(s).trim();
  return t.length > max ? t.slice(0, max) : t;
}

/** Cuerpo orientado a CRMs tipo KiteProp (ajustar según doc oficial del endpoint elegido). */
export function toKitepropContactShape(p: LeadPayload): Record<string, unknown> {
  return {
    first_name: p.nombre,
    last_name: p.apellido,
    email: p.email,
    phone: p.telefono || null,
    company: p.empresa || null,
    charge: p.cargo || null,
    source: p.kind === "join" ? "redalia_unete" : "redalia_contacto",
    summary: p.mensaje || null,
    address: p.ciudad ? `Ciudad: ${p.ciudad}` : null,
  };
}

export type DispatchResult =
  | { ok: true; via: "webhook" | "kiteprop" | "noop" }
  | { ok: false; error: string };

export async function dispatchLead(payload: LeadPayload): Promise<DispatchResult> {
  const envelope = {
    ...payload,
    submitted_at: new Date().toISOString(),
    site: siteConfig.url,
  };

  const webhook = process.env.LEADS_WEBHOOK_URL?.trim();
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(envelope),
      });
      if (!res.ok) {
        return { ok: false, error: `Webhook respondió ${res.status}` };
      }
      return { ok: true, via: "webhook" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error de red";
      return { ok: false, error: msg };
    }
  }

  const kpUrl = process.env.KITEPROP_LEAD_POST_URL?.trim();
  const kpToken = process.env.KITEPROP_API_TOKEN?.trim();
  if (kpUrl && kpToken) {
    try {
      const body = toKitepropContactShape(payload);
      const res = await fetch(kpUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${kpToken}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        return {
          ok: false,
          error: text ? text.slice(0, 280) : `KiteProp respondió ${res.status}`,
        };
      }
      return { ok: true, via: "kiteprop" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error de red";
      return { ok: false, error: msg };
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[lead dispatch noop]", envelope);
  }
  return { ok: true, via: "noop" };
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
  };
}
