"use client";

import { useState } from "react";
import { Field } from "@/components/forms/LeadForm";
import { siteConfig } from "@/lib/site-config";

export type PropertyConsultFormProps = {
  propertyId: number;
  propertyCode: string;
  propertyTitle: string;
  assignedUserId: number | null;
  organizationId: number | null;
  assignedUserName: string | null;
  organizationName: string | null;
  pagePath: string;
};

export function PropertyConsultForm({
  propertyId,
  propertyCode,
  propertyTitle,
  assignedUserId,
  organizationId,
  assignedUserName,
  organizationName,
  pagePath,
}: PropertyConsultFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pageUrl = `${siteConfig.url.replace(/\/$/, "")}${pagePath.startsWith("/") ? pagePath : `/${pagePath}`}`;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();

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
          leadIntentId: "redalia_property_ficha",
          name,
          email,
          phone: phone || null,
          message,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !data.ok) {
        setErrorMessage(data.error ?? "No se pudo enviar la consulta. Intenta de nuevo.");
        setStatus("error");
        return;
      }

      setStatus("sent");
      form.reset();
    } catch {
      setErrorMessage("Error de conexión. Revisa tu red e intenta de nuevo.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div
        className="rounded-2xl border border-brand-gold/30 bg-brand-navy-soft/50 px-4 py-6 text-center"
        role="status"
      >
        <p className="text-sm font-semibold text-brand-navy">Consulta enviada</p>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Tu mensaje fue registrado en KiteProp y será atendido por la inmobiliaria y el asesor asignado a esta
          publicación.
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Field label="Nombre" name="name" required placeholder="Tu nombre" />
      <Field label="Email" name="email" type="email" required placeholder="tu@email.com" />
      <Field label="Teléfono" name="phone" type="tel" placeholder="+56 9 …" />
      <Field
        label="Mensaje"
        name="message"
        rows={4}
        required
        placeholder="Cuéntanos qué te interesa de esta propiedad…"
      />
      {status === "error" && errorMessage && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800" role="alert">
          {errorMessage}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="flex w-full items-center justify-center rounded-full bg-brand-navy px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-navy-mid disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Enviando…" : "Consultar por esta propiedad"}
      </button>
      <p className="text-center text-[11px] leading-snug text-muted">
        La consulta se envía a KiteProp con el ID de esta publicación
        {assignedUserName ? ` · asesor: ${assignedUserName}` : ""}
        {organizationName ? ` · ${organizationName}` : ""}.
      </p>
    </form>
  );
}
