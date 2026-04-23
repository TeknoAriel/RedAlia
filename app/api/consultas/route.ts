import { NextResponse } from "next/server";
import { dispatchConsulta, parseConsultaFromJson } from "@/lib/consulta-dispatch";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const parsed = parseConsultaFromJson(json);
  if ("error" in parsed) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const result = await dispatchConsulta(parsed);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, upstreamStatus: result.upstreamStatus ?? null },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    via: result.via,
    message: "Consulta recibida y reenviada correctamente.",
  });
}

