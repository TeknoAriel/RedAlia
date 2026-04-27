import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getStorageStatus,
  promoteReadModelVersion,
  writeReadModelVersion,
} from "@/lib/catalog-read-model/read-model-store";
import { loadCatalogSnapshotUncached } from "@/lib/catalog-ingest/load-catalog-snapshot";
import { getPartnerDirectoryBuildOptions } from "@/lib/get-properties";
import { buildPropertyListingSnapshot } from "@/lib/properties/read-model";
import { buildPublicDirectorySnapshot } from "@/lib/public-data/from-properties-feed";

export const runtime = "nodejs";

function isAuthorizedCronRequest(authHeader: string | null, secret: string): boolean {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7).trim();
  if (!token || !secret) return false;
  try {
    const a = Buffer.from(token, "utf8");
    const b = Buffer.from(secret, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "misconfigured", message: "Definí CRON_SECRET en el entorno para habilitar el cron." },
      { status: 503 },
    );
  }

  if (!isAuthorizedCronRequest(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const startedAtMs = Date.now();
  const storageStatus = await getStorageStatus();
  if (!storageStatus.available) {
    return NextResponse.json(
      {
        ok: false,
        error: "persistent_storage_missing",
        storage: storageStatus.storage,
      },
      { status: 503 },
    );
  }

  const syncId = randomUUID();
  const source = await loadCatalogSnapshotUncached();
  if (!source.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: source.error,
      },
      { status: 503 },
    );
  }

  const propertySnapshot = buildPropertyListingSnapshot(source.properties);
  const partnerSnapshot = buildPublicDirectorySnapshot(source.properties, {
    featuredMax: 8,
    ...getPartnerDirectoryBuildOptions(source),
  });
  const syncResult = await writeReadModelVersion({
    syncId,
    propertySnapshot,
    partnerSnapshot,
    startedAtMs,
    finishedAtMs: Date.now(),
    status: "ok",
    warnings: [],
    errors: [],
  });
  await promoteReadModelVersion(syncId);

  return NextResponse.json({
    ok: true,
    syncId,
    storage: storageStatus.storage,
    totalProperties: syncResult.totalProperties,
    totalPartners: syncResult.totalPartners,
    partnersOrderHash: syncResult.partnersOrderHash,
    propertiesHash: syncResult.propertiesHash,
    finishedAt: new Date().toISOString(),
  });
}
