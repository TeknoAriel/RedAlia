#!/usr/bin/env node

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

function safeError(error) {
  return error instanceof Error ? error.message : String(error);
}

async function withTimeout(label, promise, ms = 35000) {
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

async function main() {
  process.env.KITEPROP_PROPERTIES_SOURCE = sanitizeEnvValue(process.env.KITEPROP_PROPERTIES_SOURCE || "");
  process.env.REDALIA_PARTNER_DIRECTORY_SOURCE = sanitizeEnvValue(
    process.env.REDALIA_PARTNER_DIRECTORY_SOURCE || "",
  );

  const { loadCatalogSnapshotUncached } = await import("../lib/catalog-ingest/load-catalog-snapshot.ts");
  const { getProperties } = await import("../lib/get-properties.ts");
  const { buildPublicDirectorySnapshot } = await import("../lib/public-data/from-properties-feed.ts");
  const { resolvePublicPartnerDirectoryDrafts } = await import("../lib/public-data/partner-directory-resolve.ts");
  const { loadNetworkPartnerDirectoryDraftsOnly } = await import(
    "../lib/kiteprop-network/load-network-partner-directory-drafts.ts"
  );

  let propertiesCount = 0;
  let partnersCount = 0;
  let propertiesSourceOk = false;
  let partnersSourceOk = false;
  const errorsSanitized = [];

  try {
    const result = await withTimeout("loadCatalogSnapshotUncached", loadCatalogSnapshotUncached());
    if (result.ok) {
      propertiesCount = result.properties.length;
      propertiesSourceOk = result.properties.length > 0;
      const built = buildPublicDirectorySnapshot(result.properties, {
        featuredMax: 8,
        extraDirectoryDrafts: result.partnerDirectoryExtraDrafts ?? null,
        networkAdvertiserDrafts: result.partnerDirectoryNetworkAdvertiserDrafts ?? null,
      });
      partnersCount = built.entries.length;
      partnersSourceOk = built.entries.length > 0;
    } else {
      errorsSanitized.push(`loadCatalogSnapshotUncached:${result.error}`);
    }
  } catch (error) {
    errorsSanitized.push(`loadCatalogSnapshotUncached:${safeError(error)}`);
  }

  if (!propertiesSourceOk) {
    try {
      const fromGetProperties = await withTimeout("getProperties", getProperties());
      if (fromGetProperties.ok) {
        propertiesCount = Math.max(propertiesCount, fromGetProperties.properties.length);
        propertiesSourceOk = propertiesCount > 0;
      } else {
        errorsSanitized.push(`getProperties:${fromGetProperties.error}`);
      }
    } catch (error) {
      errorsSanitized.push(`getProperties:${safeError(error)}`);
    }
  }

  if (!partnersSourceOk && propertiesCount > 0) {
    try {
      const result = await withEnv(
        { REDALIA_PARTNER_DIRECTORY_SOURCE: "feed" },
        async () => withTimeout("loadCatalogSnapshotUncached:feed", loadCatalogSnapshotUncached()),
      );
      if (result.ok) {
        const drafts = resolvePublicPartnerDirectoryDrafts({
          properties: result.properties,
          extraDirectoryDrafts: result.partnerDirectoryExtraDrafts ?? null,
          networkAdvertiserDrafts: result.partnerDirectoryNetworkAdvertiserDrafts ?? null,
        });
        partnersCount = Math.max(partnersCount, drafts.length);
        partnersSourceOk = partnersCount > 0;
      }
    } catch (error) {
      errorsSanitized.push(`partner-directory-resolve:${safeError(error)}`);
    }
  }

  if (!partnersSourceOk) {
    try {
      const networkDrafts = await withTimeout(
        "loadNetworkPartnerDirectoryDraftsOnly",
        loadNetworkPartnerDirectoryDraftsOnly(),
      );
      if (networkDrafts.ok) {
        partnersCount = Math.max(partnersCount, networkDrafts.drafts.length);
        partnersSourceOk = partnersCount > 0;
      } else {
        errorsSanitized.push(`loadNetworkPartnerDirectoryDraftsOnly:${networkDrafts.error}`);
      }
    } catch (error) {
      errorsSanitized.push(`loadNetworkPartnerDirectoryDraftsOnly:${safeError(error)}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        propertiesSourceOk,
        propertiesCount,
        partnersSourceOk,
        partnersCount,
        errorsSanitized,
        envPresence: {
          KITEPROP_PROPERTIES_URL: Boolean((process.env.KITEPROP_PROPERTIES_URL || "").trim()),
          KITEPROP_API_BASE_URL: Boolean((process.env.KITEPROP_API_BASE_URL || "").trim()),
          KITEPROP_API_KEY: Boolean((process.env.KITEPROP_API_KEY || "").trim()),
          REDALIA_SYNC_SECRET: Boolean((process.env.REDALIA_SYNC_SECRET || "").trim()),
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        propertiesSourceOk: false,
        propertiesCount: 0,
        partnersSourceOk: false,
        partnersCount: 0,
        errorsSanitized: [safeError(error)],
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
