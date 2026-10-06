#!/usr/bin/env node
/**
 * Dispara sync de catálogo y socios en producción (escritura Redis).
 * El tráfico web solo lee cache; este script (o los crons Vercel) es quien carga datos.
 *
 *   set -a && source .env.production.local && set +a
 *   node scripts/warm-production-cache.mjs
 *   BASE_URL=https://www.redalia.cl FORCE=1 node scripts/warm-production-cache.mjs
 */
import { setTimeout as delay } from "node:timers/promises";

const BASE = (process.env.BASE_URL || process.env.DEPLOY_READINESS_URL || "https://www.redalia.cl").replace(
  /\/$/,
  "",
);
const SECRET = (process.env.CRON_SECRET || process.env.REDALIA_SYNC_SECRET || "").trim();
const FORCE = process.env.FORCE === "1" || process.env.FORCE === "true";
/** Alineado a maxDuration=300 de las rutas cron. */
const CRON_TIMEOUT_MS = Number(process.env.WARM_CRON_TIMEOUT_MS || 300_000);

if (!SECRET) {
  console.error("Falta CRON_SECRET o REDALIA_SYNC_SECRET en el entorno.");
  process.exit(1);
}

async function hit(path) {
  const url = `${BASE}${path}`;
  const started = Date.now();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${SECRET}` },
    signal: AbortSignal.timeout(CRON_TIMEOUT_MS),
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 200) };
  }
  return { url, status: res.status, ms: Date.now() - started, body };
}

function catalogOk(body) {
  if (!body || typeof body !== "object") return false;
  if (body.ok === true) return true;
  // Upstash en cuota: el ingest pudo OK pero persist falló; el sitio usa Data Cache JSON.
  if (
    body.propertyCount > 0 &&
    typeof body.error === "string" &&
    /chunk_write_failed|plan limits|Upstash/i.test(body.error)
  ) {
    console.warn("Aviso: catálogo ingerido pero Redis no persistió (cuota Upstash). Fallback Data Cache activo.");
    return true;
  }
  return false;
}

async function main() {
  console.log(`Base: ${BASE}`);
  const catalogPath = FORCE ? "/api/cron/catalog?force=1" : "/api/cron/catalog";
  const catalog = await hit(catalogPath);
  console.log("catalog", catalog.status, `${catalog.ms}ms`, JSON.stringify(catalog.body));
  if (catalog.status !== 200 || !catalogOk(catalog.body)) {
    console.error("Cron catalog no dejó cache usable.");
    process.exit(1);
  }

  // Pequeña pausa entre jobs para no solapar CPU/Redis en Hobby.
  await delay(3_000);

  const socios = await hit("/api/cron/socios");
  console.log("socios", socios.status, `${socios.ms}ms`, JSON.stringify(socios.body));
  if (socios.status !== 200 || socios.body?.ok !== true) {
    console.error("Cron socios falló.");
    process.exit(1);
  }

  for (const path of ["/socios", "/propiedades", "/"]) {
    const page = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(60_000) });
    console.log("page", path, page.status);
    if (page.status !== 200) process.exit(1);
  }

  console.log("Sync + smoke OK (cache caliente; tráfico no ingesta).");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
