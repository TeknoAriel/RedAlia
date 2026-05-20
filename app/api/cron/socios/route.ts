import { NextResponse, after } from "next/server";
import { getCronSecretOrNull, isAuthorizedCronRequest } from "@/lib/cron/authorize-cron-request";
import { runPartnerDirectoryIncrementalSync } from "@/lib/public-data/partner-directory-incremental-sync";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Cron de **directorio de socios** (independiente del catálogo de propiedades).
 * Responde de inmediato y ejecuta sync incremental en background (evita 504 en Vercel).
 */
export async function GET(request: Request) {
  const secret = getCronSecretOrNull();
  if (!secret) {
    return NextResponse.json(
      {
        ok: false,
        error: "misconfigured",
        message: "Definí CRON_SECRET o REDALIA_SYNC_SECRET en el entorno.",
      },
      { status: 503 },
    );
  }

  if (!isAuthorizedCronRequest(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();

  after(async () => {
    try {
      await runPartnerDirectoryIncrementalSync();
    } catch {
      /* noop: próxima corrida reintenta */
    }
  });

  return NextResponse.json({
    ok: true,
    route: "cron/socios",
    startedAt,
    scheduled: true,
    message:
      "Sync incremental de socios programada en background (ids + umbral de bajas). Requiere catálogo precalentado.",
  });
}
