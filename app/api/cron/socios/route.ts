import { NextResponse } from "next/server";
import { getCronSecretOrNull, isAuthorizedCronRequest } from "@/lib/cron/authorize-cron-request";
import { runPartnerDirectoryIncrementalSync } from "@/lib/public-data/partner-directory-incremental-sync";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Cron de **directorio de socios** (independiente del catálogo de propiedades).
 * Sincronización incremental por ids: altas/bajas acotadas; si hay >50 bajas o >2%,
 * difiere por posible corte de red y reintenta en la próxima corrida (48 h en vercel.json).
 *
 * Requiere snapshot de catálogo ya precalentado por `GET /api/cron/catalog`.
 */
export async function GET(request: Request) {
  const secret = getCronSecretOrNull();
  if (!secret) {
    return NextResponse.json(
      {
        ok: false,
        error: "misconfigured",
        message: "Definí CRON_SECRET en el entorno para habilitar el cron de socios.",
      },
      { status: 503 },
    );
  }

  if (!isAuthorizedCronRequest(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const sync = await runPartnerDirectoryIncrementalSync();
    return NextResponse.json({
      ok: sync.status !== "aborted",
      route: "cron/socios",
      finishedAt: new Date().toISOString(),
      sync,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "sync_failed";
    return NextResponse.json({ ok: false, route: "cron/socios", error: message }, { status: 500 });
  }
}
