import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isUpstashRedisConfigured, upstashGet, upstashSet } from "@/lib/kv/upstash-string";
import type { CatalogSnapshotSuccess } from "@/lib/catalog-ingest/catalog-result";

/**
 * Cache persistente del catálogo público (mirror del último ingest exitoso).
 *
 * Reglas de diseño:
 * - **No es source of truth**: la fuente sigue siendo el feed JSON / red. Esto solo guarda el
 *   último resultado válido para servir respuestas rápidas en lambdas cold (donde
 *   `unstable_cache` está vacío).
 * - **Solo persiste éxitos** con `ok: true` y al menos una propiedad. Errores y resultados
 *   vacíos no sobrescriben el snapshot guardado.
 * - **TTL** generoso (12 h) y bump manual de la clave si cambia el shape (igual que
 *   `CATALOG_UNSTABLE_CACHE_KEY`).
 *
 * Storage:
 * - Producción: Upstash Redis REST si `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`
 *   están configurados.
 * - Desarrollo: archivo JSON bajo `.redalia-cache/catalog-snapshot.json` (mismo patrón que
 *   `partner-directory-snapshot-persist.ts`).
 */

const REDIS_KEY = "redalia:catalog:snapshot:v1";
const TTL_SECONDS = 60 * 60 * 12;

export type PersistedCatalogSnapshotV1 = {
  version: 1;
  generatedAtMs: number;
  propertyCount: number;
  snapshot: CatalogSnapshotSuccess;
};

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
    /* noop: cache best-effort */
  }
}

export async function readPersistedCatalogSnapshot(): Promise<PersistedCatalogSnapshotV1 | null> {
  if (isUpstashRedisConfigured()) {
    try {
      const raw = await upstashGet(REDIS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as PersistedCatalogSnapshotV1;
      if (parsed?.version !== 1 || !parsed.snapshot?.ok) return null;
      return parsed;
    } catch {
      return null;
    }
  }
  return readDevFile();
}

export async function writePersistedCatalogSnapshot(snapshot: CatalogSnapshotSuccess): Promise<void> {
  if (!snapshot.ok || snapshot.properties.length === 0) return;
  const payload: PersistedCatalogSnapshotV1 = {
    version: 1,
    generatedAtMs: Date.now(),
    propertyCount: snapshot.properties.length,
    snapshot,
  };
  const json = JSON.stringify(payload);
  if (isUpstashRedisConfigured()) {
    try {
      await upstashSet(REDIS_KEY, json, TTL_SECONDS);
    } catch {
      /* noop: cache best-effort */
    }
  }
  await writeDevFile(payload);
}

/** TTL del snapshot persistido (segundos). Útil para tests / observabilidad. */
export function getPersistedCatalogSnapshotTtlSeconds(): number {
  return TTL_SECONDS;
}
