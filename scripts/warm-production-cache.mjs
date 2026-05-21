#!/usr/bin/env node
/**
 * Precalienta catálogo y socios en producción (orden: catalog → socios).
 * Requiere CRON_SECRET o REDALIA_SYNC_SECRET en el entorno.
 *
 *   set -a && source .env.production.local && set +a
 *   node scripts/warm-production-cache.mjs
 *   BASE_URL=https://www.redalia.cl node scripts/warm-production-cache.mjs
 */

const BASE = (process.env.BASE_URL || process.env.DEPLOY_READINESS_URL || "https://www.redalia.cl").replace(
  /\/$/,
  "",
);
const SECRET = (process.env.CRON_SECRET || process.env.REDALIA_SYNC_SECRET || "").trim();

if (!SECRET) {
  console.error("Falta CRON_SECRET o REDALIA_SYNC_SECRET en el entorno.");
  process.exit(1);
}

async function hit(path) {
  const url = `${BASE}${path}`;
  const started = Date.now();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${SECRET}` },
    signal: AbortSignal.timeout(120_000),
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 200);
  }
  return { url, status: res.status, ms: Date.now() - started, body };
}

async function main() {
  console.log(`Base: ${BASE}`);
  const catalog = await hit("/api/cron/catalog");
  console.log("catalog", catalog.status, `${catalog.ms}ms`, JSON.stringify(catalog.body));
  if (catalog.status !== 200) process.exit(1);

  console.log("Esperando 90s para que el catálogo termine en background…");
  await new Promise((r) => setTimeout(r, 90_000));

  const socios = await hit("/api/cron/socios");
  console.log("socios", socios.status, `${socios.ms}ms`, JSON.stringify(socios.body));
  if (socios.status !== 200) process.exit(1);

  console.log("Esperando 120s para sync de socios en background…");
  await new Promise((r) => setTimeout(r, 120_000));

  for (const path of ["/socios", "/propiedades"]) {
    const page = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(300_000) });
    console.log("page", path, page.status);
  }

  console.log("Precalentamiento solicitado OK.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
