"use client";

import { useState } from "react";

type LeadKind = "contact" | "join";

type LeadFormProps = {
  kind: LeadKind;
  submitLabel: string;
  children: React.ReactNode;
};

export function LeadForm({ kind, submitLabel, children }: LeadFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const raw: Record<string, string> = {};
    fd.forEach((value, key) => {
      raw[key] = typeof value === "string" ? value : "";
    });

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, ...raw }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !data.ok) {
        setErrorMessage(data.error ?? "No se pudo enviar. Intentá de nuevo.");
        setStatus("error");
        return;
      }

      setStatus("sent");
      form.reset();
    } catch {
      setErrorMessage("Error de conexión. Revisá tu red e intentá de nuevo.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div
        className="rounded-2xl border border-brand-gold/30 bg-brand-navy-soft/50 px-6 py-10 text-center"
        role="status"
      >
        <p className="text-lg font-semibold text-brand-navy">Gracias por tu mensaje</p>
        <p className="mt-2 text-sm text-muted">
          Lo recibimos correctamente. Nuestro equipo lo revisará y te contactará a la brevedad por el medio que
          dejaste indicado.
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {children}
      {status === "error" && errorMessage && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {errorMessage}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-full bg-brand-navy px-6 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-brand-navy-mid disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === "loading" ? "Enviando…" : submitLabel}
      </button>
    </form>
  );
}

export function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  rows,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
}) {
  const base =
    "w-full rounded-lg border border-brand-navy/15 px-3 py-2.5 text-brand-navy placeholder:text-muted focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold";
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-brand-navy">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {rows ? (
        <textarea name={name} required={required} placeholder={placeholder} rows={rows} className={base} />
      ) : (
        <input name={name} type={type} required={required} placeholder={placeholder} className={base} />
      )}
    </label>
  );
}
