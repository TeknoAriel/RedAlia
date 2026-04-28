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
  return {
    loadCatalogSnapshotUncached: modIngest.loadCatalogSnapshotUncached,
    buildPublicDirectorySnapshot: modFeed.buildPublicDirectorySnapshot,
    buildPropertyListingSnapshot: modListing.buildPropertyListingSnapshot,
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

  const { loadCatalogSnapshotUncached, buildPublicDirectorySnapshot, buildPropertyListingSnapshot } =
    await loadBuilders();
  const loaded = await loadCatalogSnapshotUncached();
  if (!loaded.ok) {
    throw new Error(`No se pudo cargar snapshot base: ${loaded.error}`);
  }

  const now = new Date().toISOString();
  const syncId = randomUUID();
  const partnerSnapshot = buildPublicDirectorySnapshot(loaded.properties, { featuredMax: 8 });
  const listingSnapshot = buildPropertyListingSnapshot(loaded.properties);

  const partners = partnerSnapshot.entries
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

  const partnerSlugByKey = new Map(partners.map((p) => [p.partnerKey, p.slug]));
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
