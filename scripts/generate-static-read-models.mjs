#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "public", "read-models");
const partnersFile = path.join(outDir, "partner_directory_summary.json");
const propertiesFile = path.join(outDir, "property_listing_summary.json");
const metaFile = path.join(outDir, "catalog_meta.json");

function sha(input) {
  return createHash("sha256").update(input).digest("hex");
}

function normalizeToken(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function loadBuilders() {
  const modIngest = await import("../lib/catalog-ingest/load-catalog-snapshot.ts");
  const modFeed = await import("../lib/public-data/from-properties-feed.ts");
  const modListing = await import("../lib/properties/read-model.ts");
  const modNetworkDrafts = await import("../lib/kiteprop-network/load-network-partner-directory-drafts.ts");
  return {
    loadCatalogSnapshotUncached: modIngest.loadCatalogSnapshotUncached,
    buildPublicDirectorySnapshot: modFeed.buildPublicDirectorySnapshot,
    buildPropertyListingSnapshot: modListing.buildPropertyListingSnapshot,
    loadNetworkPartnerDirectoryDraftsOnly: modNetworkDrafts.loadNetworkPartnerDirectoryDraftsOnly,
  };
}

function sanitizeEnvValue(value) {
  return String(value ?? "")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .trim();
}

function withEnv(overrides, fn) {
  const prev = new Map();
  for (const [k, v] of Object.entries(overrides)) {
    prev.set(k, process.env[k]);
    process.env[k] = v;
  }
  return Promise.resolve(fn()).finally(() => {
    for (const [k, prevValue] of prev.entries()) {
      if (prevValue == null) {
        delete process.env[k];
      } else {
        process.env[k] = prevValue;
      }
    }
  });
}

function toSanitizedError(error) {
  return error instanceof Error ? error.message : String(error);
}

async function withTimeout(label, promise, ms = 45000) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label}:timeout`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function networkDraftToPartnerItem(draft, index) {
  const safeKey = String(draft.partnerKey || `network:partner:${index}`);
  return {
    id: safeKey,
    slug: safeKey.replace(/[^a-zA-Z0-9_-]+/g, "-").toLowerCase(),
    name: String(draft.displayName || `Socio ${index + 1}`).trim(),
    logoUrl: draft.logoUrl ?? null,
    propertyCount: Math.max(0, Number(draft.propertyCount || 0)),
    locationLabel: draft.coverageLabels?.[0] ?? null,
    coverageLabel: draft.coverageLabels?.slice(0, 3).join(" · ") || null,
  };
}

function partnerSort(a, b) {
  const ac = Number(a.propertyCount || 0);
  const bc = Number(b.propertyCount || 0);
  if (ac > 0 && bc === 0) return -1;
  if (ac === 0 && bc > 0) return 1;
  if (bc !== ac) return bc - ac;
  const an = normalizeToken(a.name);
  const bn = normalizeToken(b.name);
  if (an !== bn) return an.localeCompare(bn, "es");
  const as = normalizeToken(a.slug);
  const bs = normalizeToken(b.slug);
  if (as !== bs) return as.localeCompare(bs, "es");
  return String(a.id).localeCompare(String(b.id), "es");
}

async function writeAtomicJson(filePath, value) {
  const tmp = `${filePath}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(value), "utf8");
  await rename(tmp, filePath);
}

async function existsJson(filePath) {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function run() {
  await mkdir(outDir, { recursive: true });
  const previousMeta = await existsJson(metaFile);

  const {
    loadCatalogSnapshotUncached,
    buildPublicDirectorySnapshot,
    buildPropertyListingSnapshot,
    loadNetworkPartnerDirectoryDraftsOnly,
  } = await loadBuilders();

  process.env.KITEPROP_PROPERTIES_SOURCE = sanitizeEnvValue(process.env.KITEPROP_PROPERTIES_SOURCE || "");
  process.env.REDALIA_PARTNER_DIRECTORY_SOURCE = sanitizeEnvValue(
    process.env.REDALIA_PARTNER_DIRECTORY_SOURCE || "",
  );

  const attempts = [
    {
      name: "env_current",
      propertyMode: process.env.KITEPROP_PROPERTIES_SOURCE || "",
      partnerMode: process.env.REDALIA_PARTNER_DIRECTORY_SOURCE || "",
      timeoutMs: 60000,
    },
    { name: "json_network", propertyMode: "json", partnerMode: "network", timeoutMs: 90000 },
    { name: "json_feed", propertyMode: "json", partnerMode: "feed", timeoutMs: 60000 },
    { name: "network_network", propertyMode: "network", partnerMode: "network", timeoutMs: 240000 },
  ];

  let loaded = null;
  let bestProperties = null;
  let bestPartners = [];
  const errors = [];

  for (const attempt of attempts) {
    try {
      const result = await withEnv(
        {
          KITEPROP_PROPERTIES_SOURCE: attempt.propertyMode,
          REDALIA_PARTNER_DIRECTORY_SOURCE: attempt.partnerMode,
          KITEPROP_NETWORK_PROPERTIES_MAX_PAGES: "120",
          KITEPROP_NETWORK_ORGANIZATIONS_MAX_PAGES: "80",
        },
        async () =>
          withTimeout(
            `loadCatalogSnapshotUncached:${attempt.name}`,
            loadCatalogSnapshotUncached(),
            attempt.timeoutMs,
          ),
      );
      if (!result.ok) {
        errors.push(`${attempt.name}: ${result.error}`);
        continue;
      }
      const built = buildPublicDirectorySnapshot(result.properties, {
        featuredMax: 8,
        extraDirectoryDrafts: result.partnerDirectoryExtraDrafts ?? null,
        networkAdvertiserDrafts: result.partnerDirectoryNetworkAdvertiserDrafts ?? null,
      });
      if (!bestProperties || result.properties.length > bestProperties.properties.length) {
        bestProperties = { ...result, attemptName: attempt.name };
      }
      if (built.entries.length > bestPartners.length) {
        bestPartners = built.entries;
      }
      errors.push(
        `${attempt.name}: properties=${result.properties.length}, partners=${built.entries.length}`,
      );
    } catch (error) {
      errors.push(`${attempt.name}: ${toSanitizedError(error)}`);
    }
  }

  if (bestProperties?.properties?.length >= 1000 && bestPartners.length >= 380) {
    loaded = bestProperties;
  }

  if (!loaded || !bestProperties) {
    throw new Error(`No se pudo cargar snapshot base válido. ${errors.join(" | ")}`);
  }

  const now = new Date().toISOString();
  const syncId = randomUUID();
  const partnerSnapshot = {
    entries: bestPartners,
    featured: bestPartners.slice(0, 8),
    stats: {
      totalListings: bestProperties.properties.length,
      directoryCount: bestPartners.length,
      geographicDistinctCount: 0,
      geographicPresenceLabels: [],
    },
  };
  const listingSnapshot = buildPropertyListingSnapshot(loaded.properties);

  let partners = partnerSnapshot.entries
    .map((entry) => ({
      id: entry.partnerKey,
      slug: entry.publicSlug,
      name: entry.displayName,
      logoUrl: entry.logoUrl ?? null,
      propertyCount: Number(entry.propertyCount || 0),
      locationLabel: entry.coverageLabels?.[0] ?? null,
      coverageLabel: entry.coverageLabels?.slice(0, 3).join(" · ") || null,
    }))
    .sort(partnerSort);

  if (partners.length < 380) {
    const networkDrafts = await withEnv(
      {
        REDALIA_PARTNER_DIRECTORY_SOURCE: "network",
      },
      async () =>
        withTimeout(
          "loadNetworkPartnerDirectoryDraftsOnly:network_fallback",
          loadNetworkPartnerDirectoryDraftsOnly(),
        ),
    );
    if (networkDrafts.ok && networkDrafts.drafts.length > 0) {
      partners = networkDrafts.drafts.map(networkDraftToPartnerItem).sort(partnerSort);
    }
  }

  const partnerSlugByKey = new Map(partners.map((p) => [p.id, p.slug]));
  const properties = listingSnapshot.items.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    operation: item.operation,
    type: item.propertyTypeLabel || item.propertyTypeKey,
    price: item.priceNumeric ?? item.priceDisplay ?? null,
    currency: item.currency,
    commune: item.city ?? item.zone ?? null,
    region: item.region,
    bedrooms: item.bedrooms,
    bathrooms: item.bathrooms,
    surface: item.surfaceM2 ?? item.coveredM2 ?? item.terrainM2 ?? null,
    mainImageUrl: item.mainImageUrl ?? null,
    partnerName: item.partnerName ?? null,
    partnerSlug: (item.partnerKey && partnerSlugByKey.get(item.partnerKey)) || null,
    updatedAt: item.lastUpdateMs ? new Date(item.lastUpdateMs).toISOString() : null,
  }));

  const partnersOrderHash = sha(partners.map((p) => p.slug).join("|"));
  const propertiesHash = sha(properties.map((p) => `${p.id}:${p.updatedAt ?? ""}`).join("|"));

  const totalPartners = partners.length;
  const totalProperties = properties.length;
  const activePartners = partners.filter((x) => x.propertyCount > 0).length;
  const partnersWithLogo = partners.filter((x) => Boolean(x.logoUrl)).length;

  if (totalPartners < 380) throw new Error(`Validación fallida: totalPartners=${totalPartners} (<380).`);
  if (totalProperties < 1000) throw new Error(`Validación fallida: totalProperties=${totalProperties} (<1000).`);
  if (partners.length === 0) throw new Error("Validación fallida: partner_directory_summary vacío.");
  if (properties.length === 0) throw new Error("Validación fallida: property_listing_summary vacío.");
  if (partners.some((partner) => !partner.id || !partner.slug || !partner.name)) {
    throw new Error("Validación fallida: partner_directory_summary contiene socios inválidos.");
  }
  if (properties.some((property) => !property.id || !property.slug || !property.title)) {
    throw new Error("Validación fallida: property_listing_summary contiene propiedades inválidas.");
  }

  const partnerSummary = {
    items: partners,
    total: totalPartners,
    pageSize: 40,
    partnersOrderHash,
    generatedAt: now,
    syncId,
  };
  const propertySummary = {
    items: properties,
    total: totalProperties,
    pageSize: 30,
    propertiesHash,
    generatedAt: now,
    syncId,
  };
  const meta = {
    syncId,
    generatedAt: now,
    totalPartners,
    totalProperties,
    activePartners,
    emptyPartners: totalPartners - activePartners,
    partnersWithLogo,
    partnersWithoutLogo: totalPartners - partnersWithLogo,
    partnersOrderHash,
    propertiesHash,
    source: {
      partners: "network CIR/KiteProp",
      properties: "JSON/KiteProp",
    },
    storage: "static_repo_snapshot",
    status: "ok",
  };

  await writeAtomicJson(partnersFile, partnerSummary);
  await writeAtomicJson(propertiesFile, propertySummary);
  await writeAtomicJson(metaFile, meta);

  console.log(
    JSON.stringify(
      {
        ok: true,
        syncId,
        generatedAt: now,
        totalPartners,
        totalProperties,
        activePartners,
        partnersOrderHash,
        propertiesHash,
        previousSyncId: previousMeta?.syncId ?? null,
      },
      null,
      2,
    ),
  );
}

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
