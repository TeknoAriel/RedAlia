import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getCronSecretOrNull, isAuthorizedCronRequest } from "@/lib/cron/authorize-cron-request";
import { loadCachedPartnerDirectorySnapshot } from "@/lib/public-data/cached-partner-directory-snapshot";
import { REDALIA_DIRECTORY_CACHE_TAG } from "@/lib/public-data/directory-cache-tag";
import { runPartnerDirectoryIncrementalSync } from "@/lib/public-data/partner-directory-incremental-sync";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Cron de **directorio de socios**: sync incremental por partnerKey.
 * Solo invalida el tag Data Cache y re-warms si hubo altas/bajas o full sync.
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

  try {
    const sync = await runPartnerDirectoryIncrementalSync();
    const mutated =
      sync.status === "full" ||
      sync.status === "applied" && (sync.added > 0 || sync.removed > 0);

    if (mutated) {
      revalidateTag(REDALIA_DIRECTORY_CACHE_TAG, "max");
      await loadCachedPartnerDirectorySnapshot();
    }

    const ok = sync.status !== "aborted";
    return NextResponse.json(
      {
        ok,
        route: "cron/socios",
        startedAt,
        finishedAt: new Date().toISOString(),
        changed: mutated,
        sync,
        message: !ok
          ? `Sync abortado: ${sync.message}`
          : mutated
            ? `Directorio actualizado (+${sync.added}/-${sync.removed}); caché invalidada.`
            : `Sin cambios en socios (${sync.status}); caché caliente conservada.`,
      },
      { status: ok ? 200 : 502 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        route: "cron/socios",
        startedAt,
        finishedAt: new Date().toISOString(),
        error: e instanceof Error ? e.message : "Error en sync de socios",
      },
      { status: 502 },
    );
  }
}
