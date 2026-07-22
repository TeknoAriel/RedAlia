import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { catalogSnapshotFingerprint } from "@/lib/catalog-ingest/catalog-fingerprint";
import type { CatalogSnapshotSuccess } from "@/lib/catalog-ingest/catalog-result";
import { isUpstashRedisConfigured, upstashGet, upstashSet } from "@/lib/kv/upstash-string";
import type { NormalizedProperty } from "@/types/property";
import type { PublicPartnerDirectoryRowDraft } from "@/lib/public-data/types";

/**
 * Cache persistente del catálogo público (mirror del último ingest exitoso).
 *
 * Upstash free/pay-as-you-go limita requests a ~10 MB: el snapshot completo (~15–20 MB)
 * se guarda en **chunks** (`v2`) para no fallar en silencio.
 */

const REDIS_LEGACY_KEY = "redalia:catalog:snapshot:v1";
const REDIS_META_KEY = "redalia:catalog:snapshot:meta:v2";
const REDIS_CHUNK_PREFIX = "redalia:catalog:snapshot:v2:chunk:";
const REDIS_ORG_DRAFTS_KEY = "redalia:catalog:snapshot:v2:org-drafts";
const REDIS_ADV_DRAFTS_KEY = "redalia:catalog:snapshot:v2:adv-drafts";
/** Props por chunk: deja cada SET bajo el límite de 10 MB del plan Upstash. */
const PROPS_PER_CHUNK = 60;
const TTL_SECONDS = 60 * 60 * 12;

export type PersistedCatalogSnapshotV1 = {
  version: 1;
  generatedAtMs: number;
  propertyCount: number;
  fingerprint?: string;
  snapshot: CatalogSnapshotSuccess;
};

/** Meta liviana: sin drafts (van en claves aparte para no hinchar ~200 KB+). */
export type PersistedCatalogMetaV1 = {
  version: 1 | 2;
  generatedAtMs: number;
  propertyCount: number;
  fingerprint: string;
  chunkCount?: number;
  source?: CatalogSnapshotSuccess["source"];
  /** @deprecated solo snapshots viejos; preferir claves org/adv-drafts. */
  partnerDirectoryExtraDrafts?: PublicPartnerDirectoryRowDraft[];
  /** @deprecated solo snapshots viejos. */
  partnerDirectoryNetworkAdvertiserDrafts?: PublicPartnerDirectoryRowDraft[];
};

function chunkKey(i: number): string {
  return `${REDIS_CHUNK_PREFIX}${i}`;
}

function devSnapshotPath(): string {
  return path.join(process.cwd(), ".redalia-cache", "catalog-snapshot.json");
}

async function readDevFile(): Promise<PersistedCatalogSnapshotV1 | null> {
  if (process.env.NODE_ENV === "production") return null;
  try {
    const raw = await readFile(devSnapshotPath(), "utf8");
    const parsed = JSON.parse(raw) as PersistedCatalogSnapshotV1;
    if (parsed?.version !== 1 || !parsed.snapshot?.ok) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeDevFile(payload: PersistedCatalogSnapshotV1): Promise<void> {
  if (process.env.NODE_ENV === "production") return;
  try {
    const dir = path.dirname(devSnapshotPath());
    await mkdir(dir, { recursive: true });
    await writeFile(devSnapshotPath(), JSON.stringify(payload), "utf8");
  } catch {
    /* noop */
  }
}

function chunkProperties(properties: NormalizedProperty[]): NormalizedProperty[][] {
  const chunks: NormalizedProperty[][] = [];
  for (let i = 0; i < properties.length; i += PROPS_PER_CHUNK) {
    chunks.push(properties.slice(i, i + PROPS_PER_CHUNK));
  }
  return chunks.length ? chunks : [[]];
}

async function readChunkedFromRedis(): Promise<PersistedCatalogSnapshotV1 | null> {
  const metaRaw = await upstashGet(REDIS_META_KEY);
  if (!metaRaw) return null;
  const meta = JSON.parse(metaRaw) as PersistedCatalogMetaV1;
  if (!meta?.fingerprint || !meta.propertyCount || !meta.chunkCount || meta.chunkCount < 1) {
    return null;
  }

  const [chunkRaws, orgRaw, advRaw] = await Promise.all([
    Promise.all(Array.from({ length: meta.chunkCount }, (_, i) => upstashGet(chunkKey(i)))),
    upstashGet(REDIS_ORG_DRAFTS_KEY),
    upstashGet(REDIS_ADV_DRAFTS_KEY),
  ]);
  if (chunkRaws.some((c) => !c)) return null;

  const properties: NormalizedProperty[] = [];
  for (const raw of chunkRaws) {
    const part = JSON.parse(raw!) as NormalizedProperty[];
    if (!Array.isArray(part)) return null;
    properties.push(...part);
  }

  if (properties.length !== meta.propertyCount) return null;

  let orgDrafts = meta.partnerDirectoryExtraDrafts;
  let advDrafts = meta.partnerDirectoryNetworkAdvertiserDrafts;
  if (orgRaw) {
    try {
      const parsed = JSON.parse(orgRaw) as PublicPartnerDirectoryRowDraft[];
      if (Array.isArray(parsed)) orgDrafts = parsed;
    } catch {
      /* keep meta fallback */
    }
  }
  if (advRaw) {
    try {
      const parsed = JSON.parse(advRaw) as PublicPartnerDirectoryRowDraft[];
      if (Array.isArray(parsed)) advDrafts = parsed;
    } catch {
      /* keep meta fallback */
    }
  }

  const snapshot: CatalogSnapshotSuccess = {
    ok: true,
    properties,
    source: meta.source ?? "remote",
    partnerDirectoryExtraDrafts: orgDrafts,
    partnerDirectoryNetworkAdvertiserDrafts: advDrafts,
  };

  return {
    version: 1,
    generatedAtMs: meta.generatedAtMs,
    propertyCount: meta.propertyCount,
    fingerprint: meta.fingerprint,
    snapshot,
  };
}

async function readLegacyFromRedis(): Promise<PersistedCatalogSnapshotV1 | null> {
  try {
    const raw = await upstashGet(REDIS_LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedCatalogSnapshotV1;
    if (parsed?.version !== 1 || !parsed.snapshot?.ok) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function readPersistedCatalogSnapshot(): Promise<PersistedCatalogSnapshotV1 | null> {
  if (isUpstashRedisConfigured()) {
    try {
      const chunked = await readChunkedFromRedis();
      if (chunked) return chunked;
      return await readLegacyFromRedis();
    } catch {
      return null;
    }
  }
  return readDevFile();
}

export async function readPersistedCatalogMeta(): Promise<PersistedCatalogMetaV1 | null> {
  if (isUpstashRedisConfigured()) {
    try {
      const raw = await upstashGet(REDIS_META_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedCatalogMetaV1;
        if (parsed?.fingerprint && parsed.propertyCount > 0) return parsed;
      }
      // meta v1 legacy (sin chunks)
      const legacyMeta = await upstashGet("redalia:catalog:snapshot:meta:v1");
      if (legacyMeta) {
        const parsed = JSON.parse(legacyMeta) as PersistedCatalogMetaV1;
        if (parsed?.fingerprint && parsed.propertyCount > 0) return parsed;
      }
    } catch {
      /* fallback */
    }
  }
  const full = await readPersistedCatalogSnapshot();
  if (!full?.snapshot.ok) return null;
  const fingerprint = full.fingerprint || catalogSnapshotFingerprint(full.snapshot);
  return {
    version: 2,
    generatedAtMs: full.generatedAtMs,
    propertyCount: full.propertyCount,
    fingerprint,
    chunkCount: Math.ceil(full.propertyCount / PROPS_PER_CHUNK) || 1,
    source: full.snapshot.source,
  };
}

export type WritePersistedCatalogResult = {
  ok: boolean;
  chunkCount: number;
  bytesApprox: number;
  error?: string;
};

export async function writePersistedCatalogSnapshot(
  snapshot: CatalogSnapshotSuccess,
): Promise<WritePersistedCatalogResult> {
  if (!snapshot.ok || snapshot.properties.length === 0) {
    return { ok: false, chunkCount: 0, bytesApprox: 0, error: "empty_snapshot" };
  }

  const fingerprint = catalogSnapshotFingerprint(snapshot);
  const chunks = chunkProperties(snapshot.properties);
  const generatedAtMs = Date.now();
  const meta: PersistedCatalogMetaV1 = {
    version: 2,
    generatedAtMs,
    propertyCount: snapshot.properties.length,
    fingerprint,
    chunkCount: chunks.length,
    source: snapshot.source,
  };

  const payloadForDev: PersistedCatalogSnapshotV1 = {
    version: 1,
    generatedAtMs,
    propertyCount: snapshot.properties.length,
    fingerprint,
    snapshot,
  };

  let bytesApprox = Buffer.byteLength(JSON.stringify(meta), "utf8");

  if (isUpstashRedisConfigured()) {
    try {
      for (let i = 0; i < chunks.length; i++) {
        const body = JSON.stringify(chunks[i]);
        bytesApprox += Buffer.byteLength(body, "utf8");
        const ok = await upstashSet(chunkKey(i), body, TTL_SECONDS);
        if (!ok) {
          return {
            ok: false,
            chunkCount: chunks.length,
            bytesApprox,
            error: `chunk_write_failed:${i}`,
          };
        }
      }
      const orgDrafts = snapshot.partnerDirectoryExtraDrafts ?? [];
      const advDrafts = snapshot.partnerDirectoryNetworkAdvertiserDrafts ?? [];
      const orgBody = JSON.stringify(orgDrafts);
      const advBody = JSON.stringify(advDrafts);
      bytesApprox += Buffer.byteLength(orgBody, "utf8") + Buffer.byteLength(advBody, "utf8");
      const orgOk = await upstashSet(REDIS_ORG_DRAFTS_KEY, orgBody, TTL_SECONDS);
      const advOk = await upstashSet(REDIS_ADV_DRAFTS_KEY, advBody, TTL_SECONDS);
      if (!orgOk || !advOk) {
        return { ok: false, chunkCount: chunks.length, bytesApprox, error: "drafts_write_failed" };
      }
      const metaOk = await upstashSet(REDIS_META_KEY, JSON.stringify(meta), TTL_SECONDS);
      if (!metaOk) {
        return { ok: false, chunkCount: chunks.length, bytesApprox, error: "meta_write_failed" };
      }
    } catch (e) {
      return {
        ok: false,
        chunkCount: chunks.length,
        bytesApprox,
        error: e instanceof Error ? e.message : "redis_write_error",
      };
    }
  }

  await writeDevFile(payloadForDev);
  return { ok: true, chunkCount: chunks.length, bytesApprox };
}

/** Renueva TTL del snapshot chunked (o legacy) sin reescribir el catálogo. */
export async function touchPersistedCatalogSnapshotTtl(): Promise<boolean> {
  if (!isUpstashRedisConfigured()) return false;
  try {
    const metaRaw = await upstashGet(REDIS_META_KEY);
    if (metaRaw) {
      const meta = JSON.parse(metaRaw) as PersistedCatalogMetaV1;
      const n = meta.chunkCount ?? 0;
      if (n > 0) {
        const chunkRaws = await Promise.all(
          Array.from({ length: n }, (_, i) => upstashGet(chunkKey(i))),
        );
        if (chunkRaws.some((c) => !c)) return false;
        await upstashSet(REDIS_META_KEY, metaRaw, TTL_SECONDS);
        await Promise.all([
          ...chunkRaws.map((raw, i) => upstashSet(chunkKey(i), raw!, TTL_SECONDS)),
          (async () => {
            const org = await upstashGet(REDIS_ORG_DRAFTS_KEY);
            if (org) await upstashSet(REDIS_ORG_DRAFTS_KEY, org, TTL_SECONDS);
            const adv = await upstashGet(REDIS_ADV_DRAFTS_KEY);
            if (adv) await upstashSet(REDIS_ADV_DRAFTS_KEY, adv, TTL_SECONDS);
          })(),
        ]);
        return true;
      }
    }
    const legacy = await upstashGet(REDIS_LEGACY_KEY);
    if (!legacy) return false;
    await upstashSet(REDIS_LEGACY_KEY, legacy, TTL_SECONDS);
    return true;
  } catch {
    return false;
  }
}

/** true si hay snapshot usable en Redis (chunks o legacy). */
export async function hasPersistedCatalogSnapshot(): Promise<boolean> {
  const snap = await readPersistedCatalogSnapshot();
  return Boolean(snap?.snapshot.ok && snap.snapshot.properties.length > 0);
}

export function getPersistedCatalogSnapshotTtlSeconds(): number {
  return TTL_SECONDS;
}
