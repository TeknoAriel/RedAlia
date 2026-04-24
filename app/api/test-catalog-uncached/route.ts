import { NextResponse } from "next/server";
import { loadCatalogSnapshotUncached } from "@/lib/catalog-ingest/load-catalog-snapshot";
import { isKitepropNetworkAuditEnabled } from "@/lib/kiteprop-network/network-env";
import { buildPublicDirectorySnapshot } from "@/lib/public-data";

export const runtime = "nodejs";

export async function GET() {
  if (!isKitepropNetworkAuditEnabled()) {
    return new NextResponse(null, { status: 404 });
  }

  const result = await loadCatalogSnapshotUncached();
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  const directory = buildPublicDirectorySnapshot(result.properties, {
    featuredMax: 8,
    extraDirectoryDrafts: result.partnerDirectoryExtraDrafts ?? null,
    networkAdvertiserDrafts: result.partnerDirectoryNetworkAdvertiserDrafts ?? null,
  });

  return NextResponse.json({
    ok: true,
    source: result.source,
    totalProperties: result.properties.length,
    withImages: result.properties.filter((p) => (p.images?.length ?? 0) > 0).length,
    directoryEntries: directory.entries.length,
    directoryWithLogo: directory.entries.filter((d) => Boolean(d.logoUrl)).length,
    ingestMeta: result.ingestMeta ?? null,
  });
}
