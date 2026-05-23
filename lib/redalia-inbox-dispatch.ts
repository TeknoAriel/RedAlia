import "server-only";

import { siteConfig } from "@/lib/site-config";

export type RedaliaInboxKind = "contact" | "join" | "socios_contact";

export type RedaliaInboxPayload = {
  kind: RedaliaInboxKind;
  subject: string;
  textBody: string;
  replyTo?: string | null;
  meta?: Record<string, unknown>;
};

export type RedaliaInboxDispatchResult =
  | { ok: true; via: "webhook" | "email" | "noop" }
  | { ok: false; error: string };

function resolveInboxEmail(): string {
  return (
    process.env.REDALIA_LEADS_EMAIL?.trim() ||
    process.env.REDALIA_CONTACT_EMAIL?.trim() ||
    siteConfig.contact.email
  );
}

function resolveFromAddress(): string {
  return (
    process.env.REDALIA_LEADS_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    `Redalia <${siteConfig.contact.email}>`
  );
}

async function sendViaWebhook(envelope: Record<string, unknown>): Promise<RedaliaInboxDispatchResult> {
  const webhook = process.env.LEADS_WEBHOOK_URL?.trim();
  if (!webhook) return { ok: false, error: "webhook no configurado" };

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
    return { ok: false, error: e instanceof Error ? e.message : "Error de red al webhook" };
  }
}

async function sendViaWeb3Forms(payload: RedaliaInboxPayload): Promise<RedaliaInboxDispatchResult> {
  const accessKey = process.env.WEB3FORMS_ACCESS_KEY?.trim();
  if (!accessKey) return { ok: false, error: "WEB3FORMS_ACCESS_KEY no configurada" };

  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: accessKey,
        subject: payload.subject,
        from_name: "Redalia Web",
        email: resolveInboxEmail(),
        replyto: payload.replyTo?.trim() || undefined,
        message: payload.textBody,
      }),
    });
    const data = (await res.json()) as { success?: boolean; message?: string };
    if (!res.ok || !data.success) {
      return { ok: false, error: data.message ?? `Web3Forms respondió ${res.status}` };
    }
    return { ok: true, via: "email" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de red con Web3Forms" };
  }
}

async function sendViaFormSubmit(payload: RedaliaInboxPayload): Promise<RedaliaInboxDispatchResult> {
  const to = resolveInboxEmail();
  const endpoint = `https://formsubmit.co/ajax/${encodeURIComponent(to)}`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: siteConfig.url,
        Referer: `${siteConfig.url.replace(/\/$/, "")}/contacto`,
      },
      body: JSON.stringify({
        _subject: payload.subject,
        _template: "table",
        _captcha: "false",
        message: payload.textBody,
        replyto: payload.replyTo?.trim() || undefined,
        from_name: "Redalia Web",
      }),
    });
    const data = (await res.json()) as { success?: string | boolean; message?: string };
    const ok = data.success === true || data.success === "true";
    if (!res.ok || !ok) {
      return { ok: false, error: data.message ?? `FormSubmit respondió ${res.status}` };
    }
    return { ok: true, via: "email" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de red con FormSubmit" };
  }
}

async function sendViaResend(payload: RedaliaInboxPayload): Promise<RedaliaInboxDispatchResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY no configurada" };

  const to = resolveInboxEmail();
  const from = resolveFromAddress();
  const body: Record<string, unknown> = {
    from,
    to: [to],
    subject: payload.subject,
    text: payload.textBody,
  };
  if (payload.replyTo?.trim()) {
    body.reply_to = payload.replyTo.trim();
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      const snippet = text.trim().slice(0, 280);
      return { ok: false, error: snippet || `Resend respondió ${res.status}` };
    }
    return { ok: true, via: "email" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de red al enviar correo" };
  }
}

/**
 * Formularios institucionales (Únete, Contacto, socios): bandeja Redalia por correo.
 * No usa KiteProp — las consultas de propiedad van por `/api/consultas` → Messages.
 */
export async function dispatchRedaliaInbox(payload: RedaliaInboxPayload): Promise<RedaliaInboxDispatchResult> {
  const envelope = {
    ...payload,
    to: resolveInboxEmail(),
    submitted_at: new Date().toISOString(),
    site: siteConfig.url,
  };

  const webhook = process.env.LEADS_WEBHOOK_URL?.trim();
  if (webhook) {
    return sendViaWebhook(envelope);
  }

  const web3Result = await sendViaWeb3Forms(payload);
  if (web3Result.ok) return web3Result;

  const emailResult = await sendViaResend(payload);
  if (emailResult.ok) return emailResult;

  const formSubmitResult = await sendViaFormSubmit(payload);
  if (formSubmitResult.ok) return formSubmitResult;

  if (process.env.NODE_ENV === "development") {
    console.info("[redalia inbox noop]", envelope);
    return { ok: true, via: "noop" };
  }

  return {
    ok: false,
    error:
      "No hay canal de recepción configurado. Definí LEADS_WEBHOOK_URL, WEB3FORMS_ACCESS_KEY, RESEND_API_KEY o activá FormSubmit en contacto@redalia.cl.",
  };
}
