import "server-only";

import type { ConsultaPayload } from "@/lib/consulta-dispatch-types";
import { getKitePropApiBaseUrl } from "@/lib/kiteprop/client";
import { resolveProfileXApiKeyOrNull } from "@/lib/kiteprop/env-credentials";
import {
  buildKitepropContactFallbackBody,
  isKitepropMessagesServerError,
} from "@/lib/kiteprop-contact-fallback";
import { buildKitepropMessagesBody } from "@/lib/kiteprop-messages-body";
import { siteConfig } from "@/lib/site-config";

export type { ConsultaPayload } from "@/lib/consulta-dispatch-types";

type DispatchConsultaResult =
  | { ok: true; via: "kiteprop_messages" | "kiteprop_contact_fallback" | "legacy_consulta" }
  | { ok: false; error: string; upstreamStatus?: number };

function trimText(v: unknown, max = 8000): string {
  if (v === undefined || v === null) return "";
  const t = String(v).trim();
  return t.length > max ? t.slice(0, max) : t;
}

function toNumberOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.floor(v);
  if (typeof v === "string" && v.trim()) {
    const n = Number(v.trim());
    if (Number.isFinite(n)) return Math.floor(n);
  }
  return null;
}

function toLegacySource(p: ConsultaPayload): string {
  const chunks = [
    p.site || siteConfig.url,
    p.page_url ? `page:${p.page_url}` : null,
    p.leadIntentId ? `intent:${p.leadIntentId}` : null,
    p.organization_name ? `org:${p.organization_name}` : null,
    p.assigned_user_name ? `assigned:${p.assigned_user_name}` : null,
  ].filter(Boolean);
  return chunks.join(" | ");
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

function pickErrorMessage(data: unknown, status: number): string {
  if (!data || typeof data !== "object") return `KiteProp respondió ${status}`;
  const o = data as Record<string, unknown>;
  const direct = o.errorMessage ?? o.message ?? o.error;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  return `KiteProp respondió ${status}`;
}

function isSuccessEnvelope(data: unknown): boolean {
  if (!data || typeof data !== "object") return true;
  const o = data as Record<string, unknown>;
  if (typeof o.success === "boolean") return o.success;
  return true;
}

async function postJsonWithApiKey(url: string, body: Record<string, unknown>): Promise<DispatchConsultaResult> {
  const apiKey = resolveProfileXApiKeyOrNull();
  if (!apiKey) {
    return { ok: false, error: "Falta credencial KiteProp (KITEPROP_API_KEY o KITEPROP_API_SECRET)" };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed: unknown = null;
    if (text.trim()) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }
    }

    if (!res.ok) {
      return { ok: false, error: pickErrorMessage(parsed, res.status), upstreamStatus: res.status };
    }
    if (parsed && !isSuccessEnvelope(parsed)) {
      return { ok: false, error: pickErrorMessage(parsed, res.status), upstreamStatus: res.status };
    }
    return { ok: true, via: url.includes("/contacts") ? "kiteprop_contact_fallback" : "kiteprop_messages" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de red al conectar con KiteProp" };
  }
}

async function postLegacyConsulta(url: string, p: ConsultaPayload): Promise<DispatchConsultaResult> {
  const legacy: Record<string, unknown> = {
    full_name: p.name,
    email: p.email,
    phone: p.phone,
    body: appendContextMessage(p),
    property_id: p.property_id,
    source: toLegacySource(p),
  };
  if (p.assigned_user_id) legacy.assigned_user_id = p.assigned_user_id;
  if (p.organization_id) legacy.organization_id = p.organization_id;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(legacy),
    });
    const text = await res.text();
    let parsed: unknown = null;
    if (text.trim()) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }
    }
    if (!res.ok || (parsed && !isSuccessEnvelope(parsed))) {
      return { ok: false, error: pickErrorMessage(parsed, res.status), upstreamStatus: res.status };
    }
    return { ok: true, via: "legacy_consulta" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de red al conectar endpoint legacy" };
  }
}

export function parseConsultaFromJson(body: unknown): ConsultaPayload | { error: string } {
  if (!body || typeof body !== "object") return { error: "Cuerpo inválido" };
  const o = body as Record<string, unknown>;
  const name = trimText(o.name, 200);
  const email = trimText(o.email, 320);
  const message = trimText(o.message, 8000);
  const property_id = toNumberOrNull(o.property_id);

  if (!name) return { error: "name es obligatorio" };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "email inválido" };
  if (!message) return { error: "message es obligatorio" };
  if (property_id == null || property_id <= 0) {
    return { error: "property_id es obligatorio para consultas de propiedad" };
  }

  return {
    property_id,
    property_code: trimText(o.property_code, 120) || null,
    property_title: trimText(o.property_title, 240) || null,
    site: trimText(o.site, 180) || null,
    page_url: trimText(o.page_url, 2000) || null,
    leadIntentId: trimText(o.leadIntentId, 120) || null,
    name,
    email,
    phone: trimText(o.phone, 80) || null,
    message,
    assigned_user_id: toNumberOrNull(o.assigned_user_id),
    user_id: toNumberOrNull(o.user_id),
    assigned_user_name: trimText(o.assigned_user_name, 200) || null,
    organization_id: toNumberOrNull(o.organization_id),
    organization_name: trimText(o.organization_name, 200) || null,
  };
}

export async function dispatchConsulta(payload: ConsultaPayload): Promise<DispatchConsultaResult> {
  const legacyUrl = process.env.KITEPROP_API_CONSULTA_URL?.trim();
  if (legacyUrl) {
    return postLegacyConsulta(legacyUrl, payload);
  }

  if (!payload.property_id || payload.property_id <= 0) {
    return { ok: false, error: "property_id es obligatorio para consultas de propiedad" };
  }

  let msgBody: Record<string, unknown>;
  try {
    msgBody = buildKitepropMessagesBody(payload);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Payload inválido" };
  }
  const messagesUrl = `${getKitePropApiBaseUrl()}/messages`;
  const messagesResult = await postJsonWithApiKey(messagesUrl, msgBody);
  if (messagesResult.ok) return messagesResult;

  if (
    isKitepropMessagesServerError(messagesResult.error, messagesResult.upstreamStatus) &&
    (payload.assigned_user_id ?? payload.user_id)
  ) {
    const contactUrl = `${getKitePropApiBaseUrl()}/contacts`;
    const contactBody = buildKitepropContactFallbackBody(payload);
    const contactResult = await postJsonWithApiKey(contactUrl, contactBody);
    if (contactResult.ok) return contactResult;
    return contactResult;
  }

  return messagesResult;
}
