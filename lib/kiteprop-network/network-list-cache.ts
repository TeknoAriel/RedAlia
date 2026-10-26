import "server-only";

import { isUpstashRedisConfigured, upstashGet, upstashSet } from "@/lib/kv/upstash-string";

export type NetworkListCacheKind = "properties" | "organizations";

export type NetworkListCacheOptions = {
  /** Ignora memoria y Redis; vuelve a paginar la API. */
  forceRefresh?: boolean;
};

type CachedOk = { ok: true; status: number; items: unknown[] };

const MEMORY_TTL_MS = 12 * 60 * 60 * 1000;
const REDIS_TTL_SECONDS = 12 * 60 * 60;
const ITEMS_PER_CHUNK = 20;
const REDIS_PREFIX = "redalia:network:list:v1:";

type LoaderResult = CachedOk | { ok: false; error: string; status: number | null };
type MemoryEntry = { expiresAt: number; value: CachedOk };
const memory = new Map<NetworkListCacheKind, MemoryEntry>();
const inflight = new Map<NetworkListCacheKind, Promise<LoaderResult>>();

function redisMetaKey(kind: NetworkListCacheKind): string {
  return `${REDIS_PREFIX}${kind}:meta`;
}

function redisChunkKey(kind: NetworkListCacheKind, i: number): string {
  return `${REDIS_PREFIX}${kind}:chunk:${i}`;
}

function networkListCacheTtlMs(): number {
  const n = parseInt(process.env.KITEPROP_NETWORK_LIST_CACHE_TTL_SECONDS?.trim() || "", 10);
  if (Number.isFinite(n) && n >= 60) return Math.min(n, 86_400) * 1000;
  return MEMORY_TTL_MS;
}

function networkListCacheTtlSeconds(): number {
  return Math.floor(networkListCacheTtlMs() / 1000);
}

function readMemory(kind: NetworkListCacheKind): CachedOk | null {
  const hit = memory.get(kind);
  if (!hit || Date.now() >= hit.expiresAt) {
    if (hit) memory.delete(kind);
    return null;
  }
  return hit.value;
}

function writeMemory(kind: NetworkListCacheKind, value: CachedOk): void {
  memory.set(kind, { value, expiresAt: Date.now() + networkListCacheTtlMs() });
}

type RedisMeta = {
  version: 1;
  fetchedAtMs: number;
  itemCount: number;
  chunkCount: number;
  status: number;
};

async function readRedis(kind: NetworkListCacheKind): Promise<CachedOk | null> {
  if (!isUpstashRedisConfigured()) return null;
  try {
    const raw = await upstashGet(redisMetaKey(kind));
    if (!raw) return null;
    const meta = JSON.parse(raw) as RedisMeta;
    if (meta?.version !== 1 || !meta.chunkCount || meta.itemCount < 1) return null;
    const chunks = await Promise.all(
      Array.from({ length: meta.chunkCount }, (_, i) => upstashGet(redisChunkKey(kind, i))),
    );
    if (chunks.some((c) => !c)) return null;
    const items: unknown[] = [];
    for (const chunk of chunks) {
      const part = JSON.parse(chunk!) as unknown[];
      if (!Array.isArray(part)) return null;
      items.push(...part);
    }
    if (items.length !== meta.itemCount) return null;
    return { ok: true, status: meta.status || 200, items };
  } catch {
    return null;
  }
}

async function writeRedis(kind: NetworkListCacheKind, value: CachedOk): Promise<void> {
  if (!isUpstashRedisConfigured() || value.items.length === 0) return;
  const ttl = networkListCacheTtlSeconds() || REDIS_TTL_SECONDS;
  const chunks: unknown[][] = [];
  for (let i = 0; i < value.items.length; i += ITEMS_PER_CHUNK) {
    chunks.push(value.items.slice(i, i + ITEMS_PER_CHUNK));
  }
  try {
    for (let i = 0; i < chunks.length; i += 1) {
      const ok = await upstashSet(redisChunkKey(kind, i), JSON.stringify(chunks[i]), ttl);
      if (!ok) return;
    }
    const meta: RedisMeta = {
      version: 1,
      fetchedAtMs: Date.now(),
      itemCount: value.items.length,
      chunkCount: chunks.length,
      status: value.status,
    };
    await upstashSet(redisMetaKey(kind), JSON.stringify(meta), ttl);
  } catch {
    /* cuota / payload: el sitio sigue con memoria de proceso */
  }
}

/**
 * Cache de listas paginadas de red (propiedades / organizaciones).
 * Memoria (mismo lambda) → Redis (12 h) → loader (HTTP a KiteProp).
 * No cachea errores: un fallo no bloquea el próximo intento.
 */
export async function withNetworkListCache(
  kind: NetworkListCacheKind,
  loader: () => Promise<LoaderResult>,
  options?: NetworkListCacheOptions,
): Promise<LoaderResult> {
  if (!options?.forceRefresh) {
    const mem = readMemory(kind);
    if (mem) return mem;
    const redis = await readRedis(kind);
    if (redis) {
      writeMemory(kind, redis);
      return redis;
    }
  }

  const existing = inflight.get(kind);
  if (existing) return existing;

  const pending = (async (): Promise<LoaderResult> => {
    const loaded = await loader();
    if (loaded.ok && loaded.items.length > 0) {
      writeMemory(kind, loaded);
      await writeRedis(kind, loaded);
    }
    return loaded;
  })();

  inflight.set(kind, pending);
  try {
    return await pending;
  } finally {
    inflight.delete(kind);
  }
}
