import { NextResponse } from "next/server";
import { getPartnerDirectoryBuildOptions, getProperties } from "@/lib/get-properties";
import { extractAdvertiserIdHints, extractAdvertiserObject } from "@/lib/kiteprop-network/extract-advertiser";
import { getNetworkOrganizations } from "@/lib/kiteprop-network/get-network-organizations";
import { getNetworkProperties } from "@/lib/kiteprop-network/get-network-properties";
import { mapUnknownNetworkAdvertiserToPublicDraft } from "@/lib/kiteprop-network/map-network-advertiser-to-public-draft";
import { mapUnknownNetworkOrganizationToPublicDraft } from "@/lib/kiteprop-network/map-network-org-to-public-draft";
import { isKitepropNetworkAuditEnabled } from "@/lib/kiteprop-network/network-env";
import { resolveNetworkRequestContext } from "@/lib/kiteprop-network/network-request-context";
import { extractOrganizationLinkHints } from "@/lib/kiteprop-network/property-org-link-hint";
import { resolveSocioFromNetworkProperty } from "@/lib/kiteprop-network/redalia-socio-network-model";
import { summarizeChildObjectsKeys, summarizeObjectKeys } from "@/lib/kiteprop-network/shape-audit";
import { buildPublicDirectorySnapshot } from "@/lib/public-data";

export const runtime = "nodejs";

const NESTED_ON_PROPERTY = [
  "advertiser",
  "announcer",
  "publisher",
  "organization",
  "agency",
  "user",
  "listing",
] as const;

/**
 * Auditoría server-only: red AINA / KiteProp. Sin secretos ni valores de PII en la respuesta.
 * Incluye resumen de shape anidado (anunciante / organización) y prueba de resolución de socio.
 */
export async function GET() {
  if (!isKitepropNetworkAuditEnabled()) {
    return new NextResponse(null, { status: 404 });
  }

  const authProbe = await resolveNetworkRequestContext();
  const authSummary = authProbe.ok
    ? { ok: true as const, bearerConfigured: Boolean(authProbe.bearer), extraHeaderNames: Object.keys(authProbe.extraHeaders) }
    : { ok: false as const, error: authProbe.error };

  const [orgs, props] = await Promise.all([getNetworkOrganizations(), getNetworkProperties()]);
  const catalog = await getProperties();

  const firstOrg = orgs.ok && orgs.items[0] ? orgs.items[0] : null;
  const firstProp = props.ok && props.items[0] ? props.items[0] : null;

  const orgDraft = firstOrg ? mapUnknownNetworkOrganizationToPublicDraft(firstOrg) : null;
  const linkHints = firstProp ? extractOrganizationLinkHints(firstProp) : { hints: [], keysTouched: [] };
  const advObj = firstProp ? extractAdvertiserObject(firstProp) : null;
  const advHints = firstProp ? extractAdvertiserIdHints(advObj, firstProp) : { hints: [], keysTouched: [] };
  const advDraft = advObj ? mapUnknownNetworkAdvertiserToPublicDraft(advObj) : null;
  const nestedOnFirstProperty = firstProp ? summarizeChildObjectsKeys(firstProp, NESTED_ON_PROPERTY) : {};
  const socioResolution = firstProp ? resolveSocioFromNetworkProperty(firstProp) : null;

  let advertiserScan: {
    scannedProperties: number;
    firstWithAdvertiserIndex: number | null;
    advertiserKeyNames: string[];
  } | null = null;

  let socioResolutionStats: {
    scanned: number;
    advertiser: number;
    organization_only: number;
    unmapped: number;
  } | null = null;

  if (props.ok && props.items.length > 0) {
    const max = Math.min(props.items.length, 30);
    let firstIdx: number | null = null;
    let keyNames: string[] = [];
    let advCount = 0;
    let orgOnlyCount = 0;
    let unmappedCount = 0;
    const statsCap = Math.min(props.items.length, 80);
    for (let i = 0; i < statsCap; i++) {
      const r = resolveSocioFromNetworkProperty(props.items[i]);
      if (r.kind === "advertiser") advCount += 1;
      else if (r.kind === "organization_only") orgOnlyCount += 1;
      else unmappedCount += 1;
    }
    socioResolutionStats = {
      scanned: statsCap,
      advertiser: advCount,
      organization_only: orgOnlyCount,
      unmapped: unmappedCount,
    };
    for (let i = 0; i < max; i++) {
      const adv = extractAdvertiserObject(props.items[i]);
      if (adv && typeof adv === "object" && !Array.isArray(adv)) {
        if (firstIdx === null) firstIdx = i;
        if (keyNames.length === 0) keyNames = summarizeObjectKeys(adv);
      }
    }
    advertiserScan = {
      scannedProperties: max,
      firstWithAdvertiserIndex: firstIdx,
      advertiserKeyNames: keyNames,
    };
  }

  const orgMapStats = orgs.ok
    ? {
        total: orgs.items.length,
        httpStatus: orgs.status,
        mappedDraftSample: orgDraft
          ? {
              partnerKey: orgDraft.partnerKey,
              displayName: orgDraft.displayName,
              scope: orgDraft.scope,
            }
          : null,
        firstOrganizationKeyNames: firstOrg ? summarizeObjectKeys(firstOrg) : [],
      }
    : { ok: false as const, error: orgs.error, status: orgs.status };

  const propStats = props.ok
    ? {
        total: props.items.length,
        httpStatus: props.status,
        firstPropertyKeyNames: firstProp ? summarizeObjectKeys(firstProp) : [],
        nestedOnFirstProperty,
        organizationLinkHints: linkHints,
        advertiserObjectKeyNames: advObj ? summarizeObjectKeys(advObj) : [],
        advertiserIdHints: advHints,
        mappedAdvertiserDraftSample: advDraft
          ? { partnerKey: advDraft.partnerKey, displayName: advDraft.displayName, scope: advDraft.scope }
          : null,
        socioResolutionSample:
          socioResolution && socioResolution.kind !== "unmapped"
            ? {
                kind: socioResolution.kind,
                partnerKey: socioResolution.draft.partnerKey,
                displayName: socioResolution.draft.displayName,
                organizationPartnerKey:
                  socioResolution.kind === "advertiser" && socioResolution.organizationContext
                    ? socioResolution.organizationContext.partnerKey
                    : null,
              }
            : socioResolution,
        advertiserScan,
        socioResolutionStats,
      }
    : { ok: false as const, error: props.error, status: props.status };

  const directorySnapshot = catalog.ok
    ? buildPublicDirectorySnapshot(catalog.properties, {
        featuredMax: 8,
        ...getPartnerDirectoryBuildOptions(catalog),
      })
    : null;

  const catalogStats = catalog.ok
    ? {
        ok: true as const,
        source: catalog.source,
        totalProperties: catalog.properties.length,
        ingestMeta: catalog.ingestMeta ?? null,
        imageCoverage: {
          withImage: catalog.properties.filter((p) => (p.images?.length ?? 0) > 0).length,
          withoutImage: catalog.properties.filter((p) => (p.images?.length ?? 0) === 0).length,
        },
        directory: directorySnapshot
          ? {
              totalEntries: directorySnapshot.entries.length,
              featuredEntries: directorySnapshot.featured.length,
              withLogo: directorySnapshot.entries.filter((d) => Boolean(d.logoUrl)).length,
              withoutLogo: directorySnapshot.entries.filter((d) => !d.logoUrl).length,
            }
          : null,
      }
    : { ok: false as const };

  return NextResponse.json({
    ok: orgs.ok && props.ok,
    auth: authSummary,
    organizations: orgMapStats,
    properties: propStats,
    catalog: catalogStats,
    socioModelNote:
      "Resolución canónica Socio Redalia (red): priorizar anunciante → kpnet:advertiser:{id}; organización como contexto o fallback kpnet:org:{id}. Ver lib/kiteprop-network/redalia-socio-network-model.ts y docs/kiteprop-network-aina.md § relación.",
    note:
      "Sin valores de campos sensibles. Tras desplegar con env real, volcar este JSON en docs/kiteprop-network-aina.md " +
      "sección «Auditoría real» o adjuntarlo al ticket. Paths: KITEPROP_NETWORK_ORGANIZATIONS_PATH / PROPERTIES_PATH o defaults.",
  });
}
