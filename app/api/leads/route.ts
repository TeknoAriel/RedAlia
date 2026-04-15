import { NextResponse } from "next/server";
import { dispatchLead, parseLeadFromJson, type LeadKind } from "@/lib/lead-dispatch";

export const runtime = "nodejs";

function isLeadKind(v: unknown): v is LeadKind {
  return v === "contact" || v === "join";
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  if (!json || typeof json !== "object") {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido" }, { status: 400 });
  }

  const kindRaw = (json as Record<string, unknown>).kind;
  if (!isLeadKind(kindRaw)) {
    return NextResponse.json({ ok: false, error: "kind debe ser contact o join" }, { status: 400 });
  }

  const parsed = parseLeadFromJson(json, kindRaw);
  if ("error" in parsed) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const result = await dispatchLead(parsed);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    via: result.via,
    message: "Recibido correctamente.",
  });
}
