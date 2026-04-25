"use client";

import { useMemo, useState } from "react";
import { PartnerContactLinks } from "@/components/socios/PartnerContactLinks";

type RequesterProfile = {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  empresa: string;
  ciudad: string;
};

type Props = {
  partnerKey: string;
  partnerName: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  whatsapp: string | null;
  webUrl: string | null;
  className?: string;
};

const PROFILE_KEY = "redalia:contact-profile:v1";
const ACCESS_LOG_KEY = "redalia:partner-access-log:v1";
const BLOCKED_UNTIL_KEY = "redalia:partner-access-blocked-until:v1";

const WINDOW_MS = 60_000;
const LIMIT_UNIQUE_PARTNERS = 4;
const BLOCK_MS = 24 * 60 * 60 * 1000;
const BLOCK_TEXT =
  "Por políticas de privacidad no podrás seguir consultando la información de los socios. Volvé a intentarlo dentro de 24 hs.";

type AccessEvent = { ts: number; partnerKey: string };

function nowMs(): number {
  return Date.now();
}

function readProfile(): RequesterProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RequesterProfile;
    if (!parsed?.nombre || !parsed?.apellido || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveProfile(profile: RequesterProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function readAccessLog(): AccessEvent[] {
  try {
    const raw = localStorage.getItem(ACCESS_LOG_KEY);
    const arr = raw ? (JSON.parse(raw) as AccessEvent[]) : [];
    if (!Array.isArray(arr)) return [];
    const minTs = nowMs() - WINDOW_MS;
    return arr.filter((e) => typeof e?.ts === "number" && e.ts >= minTs && typeof e?.partnerKey === "string");
  } catch {
    return [];
  }
}

function writeAccessLog(events: AccessEvent[]): void {
  localStorage.setItem(ACCESS_LOG_KEY, JSON.stringify(events));
}

function getBlockedUntil(): number {
  const raw = localStorage.getItem(BLOCKED_UNTIL_KEY);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

function setBlockedUntil(ts: number): void {
  localStorage.setItem(BLOCKED_UNTIL_KEY, String(ts));
}

function currentContactFields(args: {
  email: string | null;
  phone: string | null;
  mobile: string | null;
  whatsapp: string | null;
  webUrl: string | null;
}): string[] {
  const out: string[] = [];
  if (args.email) out.push("email");
  if (args.phone || args.mobile) out.push("telefono");
  if (args.whatsapp || args.mobile || args.phone) out.push("whatsapp");
  if (args.webUrl) out.push("web");
  return out;
}

export function PartnerContactPrivacyGate({
  partnerKey,
  partnerName,
  email,
  phone,
  mobile,
  whatsapp,
  webUrl,
  className = "",
}: Props) {
  const [revealed, setRevealed] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedMsg, setBlockedMsg] = useState<string | null>(null);
  const [form, setForm] = useState<RequesterProfile>({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    empresa: "",
    ciudad: "",
  });

  const hasAnyContact = useMemo(
    () => Boolean(email || phone || mobile || whatsapp || webUrl),
    [email, phone, mobile, whatsapp, webUrl],
  );

  function consumeRateLimit(): { ok: true } | { ok: false; message: string } {
    const blockedUntil = getBlockedUntil();
    if (blockedUntil > nowMs()) return { ok: false, message: BLOCK_TEXT };

    const events = readAccessLog();
    const withCurrent = [...events, { ts: nowMs(), partnerKey }];
    const uniq = new Set(withCurrent.map((e) => e.partnerKey));
    if (uniq.size > LIMIT_UNIQUE_PARTNERS) {
      setBlockedUntil(nowMs() + BLOCK_MS);
      writeAccessLog([]);
      return { ok: false, message: BLOCK_TEXT };
    }

    writeAccessLog(withCurrent);
    return { ok: true };
  }

  async function notifyPartner(profile: RequesterProfile) {
    const consultedFields = currentContactFields({ email, phone, mobile, whatsapp, webUrl });
    await fetch("/api/socios/contact-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partnerKey,
        partnerName,
        consultedFields,
        requester: profile,
      }),
    });
  }

  function unlockIfAllowed(profile: RequesterProfile): boolean {
    const gate = consumeRateLimit();
    if (!gate.ok) {
      setBlockedMsg(gate.message);
      setRevealed(false);
      return false;
    }
    setBlockedMsg(null);
    setRevealed(true);
    void notifyPartner(profile);
    return true;
  }

  function handleQuickUnlock() {
    setError(null);
    const profile = readProfile();
    if (!profile) {
      setOpenForm(true);
      return;
    }
    unlockIfAllowed(profile);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!form.nombre.trim() || !form.apellido.trim() || !form.email.trim()) {
        setError("Completá nombre, apellido y email.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        setError("Ingresá un email válido.");
        return;
      }
      const profile: RequesterProfile = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        empresa: form.empresa.trim(),
        ciudad: form.ciudad.trim(),
      };
      saveProfile(profile);
      const ok = unlockIfAllowed(profile);
      if (ok) setOpenForm(false);
    } finally {
      setLoading(false);
    }
  }

  if (!hasAnyContact) return null;

  return (
    <div className={className}>
      {revealed ? (
        <PartnerContactLinks
          email={email}
          phone={phone}
          mobile={mobile}
          whatsapp={whatsapp}
          webUrl={webUrl}
          className=""
        />
      ) : (
        <div className="rounded-xl border border-brand-navy/15 bg-brand-navy-soft/35 px-3 py-3 text-left">
          <p className="text-xs leading-relaxed text-muted">
            Para ver teléfono, WhatsApp, mail o web de este socio, necesitás iniciar sesión o cargar tus datos.
          </p>
          <button
            type="button"
            onClick={handleQuickUnlock}
            className="mt-3 inline-flex rounded-full bg-brand-navy px-4 py-2 text-xs font-semibold text-white hover:bg-brand-navy-mid"
          >
            Ver datos de contacto
          </button>
          {blockedMsg && <p className="mt-3 text-xs font-medium text-red-700">{blockedMsg}</p>}
        </div>
      )}

      {openForm && !revealed && (
        <div className="mt-3 rounded-xl border border-brand-navy/15 bg-white p-3">
          <p className="text-xs font-semibold text-brand-navy">Identificación para consultar contacto</p>
          <form onSubmit={handleSubmit} className="mt-3 grid gap-2 sm:grid-cols-2">
            <input
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className="rounded-lg border border-brand-navy/15 px-3 py-2 text-xs"
              placeholder="Nombre"
            />
            <input
              value={form.apellido}
              onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))}
              className="rounded-lg border border-brand-navy/15 px-3 py-2 text-xs"
              placeholder="Apellido"
            />
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="rounded-lg border border-brand-navy/15 px-3 py-2 text-xs sm:col-span-2"
              placeholder="Email"
              type="email"
            />
            <input
              value={form.telefono}
              onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              className="rounded-lg border border-brand-navy/15 px-3 py-2 text-xs"
              placeholder="Teléfono (opcional)"
            />
            <input
              value={form.empresa}
              onChange={(e) => setForm((f) => ({ ...f, empresa: e.target.value }))}
              className="rounded-lg border border-brand-navy/15 px-3 py-2 text-xs"
              placeholder="Empresa (opcional)"
            />
            <input
              value={form.ciudad}
              onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value }))}
              className="rounded-lg border border-brand-navy/15 px-3 py-2 text-xs sm:col-span-2"
              placeholder="Ciudad (opcional)"
            />
            {error && <p className="text-xs text-red-700 sm:col-span-2">{error}</p>}
            <div className="flex gap-2 sm:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex rounded-full bg-brand-navy px-4 py-2 text-xs font-semibold text-white hover:bg-brand-navy-mid disabled:opacity-60"
              >
                {loading ? "Validando..." : "Continuar"}
              </button>
              <button
                type="button"
                onClick={() => setOpenForm(false)}
                className="inline-flex rounded-full border border-brand-navy/20 px-4 py-2 text-xs font-semibold text-brand-navy hover:bg-brand-navy-soft"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

