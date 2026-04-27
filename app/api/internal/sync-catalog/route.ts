import { NextResponse } from "next/server";
import { loadCatalogSnapshotUncached } from "@/lib/catalog-ingest/load-catalog-snapshot";
import { isRedaliaHealthAuthorized } from "@/lib/diagnostics/redalia-health-auth";
import { getPartnerDirectoryBuildOptions } from "@/lib/get-properties";
import { buildPropertyListingSnapshot } from "@/lib/properties/read-model";
import { writePersistedPropertyListingSnapshot } from "@/lib/properties/property-listing-snapshot-persist";
import { buildPublicDirectorySnapshot } from "@/lib/public-data/from-properties-feed";
import { writePersistedPartnerDirectorySnapshot } from "@/lib/public-data/partner-directory-snapshot-persist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  if (!isRedaliaHealthAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const startedAtMs = Date.now();
  const result = await loadCatalogSnapshotUncached();
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        startedAtMs,
        finishedAtMs: Date.now(),
        durationMs: Date.now() - startedAtMs,
      },
      { status: 503 },
    );
  }

  const propertySnapshot = buildPropertyListingSnapshot(result.properties);
  const partnerSnapshot = buildPublicDirectorySnapshot(result.properties, {
    featuredMax: 8,
    ...getPartnerDirectoryBuildOptions(result),
  });

  await Promise.all([
    writePersistedPropertyListingSnapshot(propertySnapshot),
    writePersistedPartnerDirectorySnapshot(partnerSnapshot),
  ]);

  const finishedAtMs = Date.now();
  return NextResponse.json({
    ok: true,
    startedAtMs,
    finishedAtMs,
    durationMs: finishedAtMs - startedAtMs,
    totalProperties: propertySnapshot.totalItems,
    totalPartners: partnerSnapshot.entries.length,
    warnings: [],
    errors: [],
  });
}
