import { NextResponse } from "next/server";
import { dispatchLead } from "@/lib/lead-dispatch";

export const runtime = "nodejs";

type Body = {
  partnerKey?: unknown;
  partnerName?: unknown;
  consultedFields?: unknown;
  requester?: {
    nombre?: unknown;
    apellido?: unknown;
    email?: unknown;
    telefono?: unknown;
    empresa?: unknown;
    ciudad?: unknown;
  };
};

function asText(v: unknown, max = 240): string {
  if (v === undefined || v === null) return "";
  const t = String(v).trim();
  return t.length > max ? t.slice(0, max) : t;
}

function cleanFields(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    const t = asText(item, 60);
    if (!t) continue;
    out.push(t);
  }
  return out.slice(0, 8);
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const nombre = asText(body?.requester?.nombre, 80);
  const apellido = asText(body?.requester?.apellido, 80);
  const email = asText(body?.requester?.email, 320);
  const telefono = asText(body?.requester?.telefono, 80);
  const empresa = asText(body?.requester?.empresa, 120);
  const ciudad = asText(body?.requester?.ciudad, 120);
  const partnerName = asText(body?.partnerName, 180);
  const partnerKey = asText(body?.partnerKey, 180);
  const consulted = cleanFields(body?.consultedFields);

  if (!nombre || !apellido || !email) {
    return NextResponse.json(
      { ok: false, error: "Nombre, apellido y email son obligatorios" },
      { status: 400 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 });
  }
  if (!partnerName || !partnerKey) {
    return NextResponse.json({ ok: false, error: "Socio inválido" }, { status: 400 });
  }

  const fieldsText = consulted.length ? consulted.join(", ") : "contacto general";
  const msg = `${nombre} ${apellido} está interesado en contactarte y consultó tus datos desde Redalia.
Socio: ${partnerName} (${partnerKey}).
Canales consultados: ${fieldsText}.
Email: ${email}${telefono ? ` · Teléfono: ${telefono}` : ""}${empresa ? ` · Empresa: ${empresa}` : ""}${ciudad ? ` · Ciudad: ${ciudad}` : ""}.`;

  const result = await dispatchLead({
    kind: "contact",
    nombre,
    apellido,
    email,
    telefono: telefono || undefined,
    empresa: empresa || undefined,
    ciudad: ciudad || undefined,
    mensaje: msg,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true, via: result.via });
}

