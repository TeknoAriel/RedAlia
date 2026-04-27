import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getCurrentReadModelMeta,
  getPartnerDirectoryPage,
  getPropertyListingPage,
  getPublicReadModelPolicy,
  getStorageStatus,
} from "@/lib/catalog-read-model/read-model-store";
import { isRedaliaHealthAuthorized } from "@/lib/diagnostics/redalia-health-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function GET(request: Request) {
  if (!isRedaliaHealthAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const t0 = Date.now();
  const [storage, meta, socios1, socios2, props1, props2] = await Promise.all([
    getStorageStatus(),
    getCurrentReadModelMeta(),
    getPartnerDirectoryPage(1, 40),
    getPartnerDirectoryPage(2, 40),
    getPropertyListingPage(1, 30),
    getPropertyListingPage(2, 30),
  ]);

  return NextResponse.json({
    ok: true,
    storage,
    currentSyncId: meta?.syncId ?? null,
    lastSyncAt: meta ? new Date(meta.finishedAtMs).toISOString() : null,
    sociosPage1Hash: sha(socios1.entries.map((x) => x.publicSlug).join("|")),
    sociosPage2Hash: sha(socios2.entries.map((x) => x.publicSlug).join("|")),
    propiedadesPage1Hash: sha(props1.items.map((x) => x.id).join("|")),
    propiedadesPage2Hash: sha(props2.items.map((x) => x.id).join("|")),
    sociosCount: socios1.totalItems,
    propiedadesCount: props1.totalItems,
    liveRebuildUsed: false,
    publicLiveRebuildAllowed: getPublicReadModelPolicy().PUBLIC_LIVE_REBUILD_ALLOWED,
    readMs: Date.now() - t0,
  });
}
