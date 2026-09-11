"use client";

import { useMemo, useState } from "react";
import { Field } from "@/components/forms/LeadForm";
import { PartnerContactLinks } from "@/components/socios/PartnerContactLinks";
import { whatsappHrefFromRaw } from "@/lib/contact-links";
import { siteConfig } from "@/lib/site-config";

export type PropertyContactRevealProps = {
  propertyId: number;
  propertyCode: string;
  propertyTitle: string;
  assignedUserId: number | null;
  organizationId: number | null;
  assignedUserName: string | null;
  organizationName: string | null;
  pagePath: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  whatsapp: string | null;
  webUrl: string | null;
  className?: string;
};

/**
 * Gate crítico de ficha: oculta teléfono/WhatsApp hasta que el interesado
 * complete el formulario → lead a KiteProp → se revelan los contactos.
 */
export function PropertyContactReveal({
  propertyId,
  propertyCode,
  propertyTitle,
  assignedUserId,
  organizationId,
  assignedUserName,
  organizationName,
  pagePath,
  email,
  phone,
  mobile,
  whatsapp,
  webUrl,
  className = "",
}: PropertyContactRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasPhoneOrWa = useMemo(
    () => Boolean(phone || mobile || whatsapp),
    [phone, mobile, whatsapp],
  );
  const waHref = whatsappHrefFromRaw(whatsapp ?? mobile ?? phone);

  if (!hasPhoneOrWa && !webUrl && !email) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    const emailValue = String(fd.get("email") ?? "").trim();
    const phoneValue = String(fd.get("phone") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();
    const pageUrl = `${siteConfig.url.replace(/\/$/, "")}${pagePath.startsWith("/") ? pagePath : `/${pagePath}`}`;

    try {
      const res = await fetch("/api/consultas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId,
          property_code: propertyCode,
          property_title: propertyTitle,
          assigned_user_id: assignedUserId,
          user_id: assignedUserId,
          organization_id: organizationId,
          assigned_user_name: assignedUserName,
          organization_name: organizationName,
          site: siteConfig.url,
          page_url: pageUrl,
          leadIntentId: "redalia_property_contact_reveal",
          name,
          email: emailValue,
          phone: phoneValue || null,
          message:
            message ||
            `Solicito ver el teléfono / WhatsApp de contacto de la propiedad ${propertyCode}.`,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !data.ok) {
        setErrorMessage(data.error ?? "No se pudo registrar tu consulta. Intenta de nuevo.");
        setStatus("error");
        return;
      }

      setRevealed(true);
      setOpenForm(false);
      setStatus("idle");
      form.reset();

      if (waHref) {
        window.open(waHref, "_blank", "noopener,noreferrer");
      }
    } catch {
      setErrorMessage("Error de conexión. Revisa tu red e intenta de nuevo.");
      setStatus("error");
    }
  }

  if (revealed) {
    return (
      <div className={className}>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-brand-gold-deep">
          Contacto revelado
        </p>
        <PartnerContactLinks
          email={email}
          phone={phone}
          mobile={mobile}
          whatsapp={whatsapp}
          webUrl={webUrl}
          hideEmail
        />
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex rounded-full bg-brand-navy px-4 py-2 text-xs font-semibold text-white hover:bg-brand-navy-mid"
          >
            Abrir WhatsApp
          </a>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="rounded-xl border border-brand-navy/15 bg-brand-navy-soft/35 px-3 py-3 text-left">
        <p className="text-xs leading-relaxed text-muted">
          Para ver el teléfono o escribir por WhatsApp al agente / empresa, completá tus datos. Así
          registramos tu consulta en KiteProp y no se pierde el contacto.
        </p>
        <button
          type="button"
          onClick={() => setOpenForm(true)}
          className="mt-3 inline-flex rounded-full bg-brand-navy px-4 py-2 text-xs font-semibold text-white hover:bg-brand-navy-mid"
        >
          Ver teléfono / WhatsApp
        </button>
      </div>

      {openForm && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-xl border border-brand-navy/15 bg-white p-3">
          <p className="text-xs font-semibold text-brand-navy">Tus datos para revelar el contacto</p>
          <Field label="Nombre" name="name" required placeholder="Tu nombre" />
          <Field label="Email" name="email" type="email" required placeholder="tu@email.com" />
          <Field label="Teléfono" name="phone" type="tel" placeholder="+56 9 …" />
          <Field
            label="Mensaje"
            name="message"
            rows={3}
            placeholder="Opcional: contanos qué te interesa…"
          />
          {status === "error" && errorMessage && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800" role="alert">
              {errorMessage}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex rounded-full bg-brand-navy px-4 py-2 text-xs font-semibold text-white hover:bg-brand-navy-mid disabled:opacity-60"
            >
              {status === "loading" ? "Enviando…" : "Enviar y ver contacto"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenForm(false);
                setErrorMessage(null);
                setStatus("idle");
              }}
              className="inline-flex rounded-full border border-brand-navy/20 px-4 py-2 text-xs font-semibold text-brand-navy hover:bg-brand-navy-soft"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
