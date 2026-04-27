#!/usr/bin/env node

/**
 * Dispara sync de read models de catálogo/socios.
 *
 * Uso:
 *   REDALIA_HEALTH_SECRET=... node scripts/sync-catalog.mjs
 *   node scripts/sync-catalog.mjs https://www.redalia.cl
 */

const base = (process.argv[2] || process.env.REDALIA_SYNC_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const secret = (process.env.REDALIA_HEALTH_SECRET || "").trim();

if (!secret) {
  console.error("Falta REDALIA_HEALTH_SECRET para ejecutar sync protegido.");
  process.exit(1);
}

const url = `${base}/api/internal/sync-catalog?secret=${encodeURIComponent(secret)}`;
const startedAt = Date.now();
const res = await fetch(url);
const body = await res.json().catch(() => null);
const elapsedMs = Date.now() - startedAt;

console.log(
  JSON.stringify(
    {
      ok: res.ok,
      status: res.status,
      elapsedMs,
      url: `${base}/api/internal/sync-catalog`,
      response: body,
    },
    null,
    2,
  ),
);

if (!res.ok) process.exit(1);
