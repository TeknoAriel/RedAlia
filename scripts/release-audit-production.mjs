#!/usr/bin/env node
/**
 * Auditoría pública de producción (sin bloquearse por curl/permisos).
 * - Timeouts + reintentos controlados por endpoint.
 * - Verifica rutas públicas y ruta de auditoría de red.
 * - Busca señales demo/reales en /propiedades y /socios.
 *
 * Uso:
 *   node scripts/release-audit-production.mjs
 *   node scripts/release-audit-production.mjs https://redalia.vercel.app
 */

const BASE = normalizeBase(process.argv[2] || process.env.REDALIA_PRODUCTION_URL || "https://redalia.vercel.app");
const TIMEOUT_MS = 20_000;
const RETRIES = 3;
const RETRY_DELAY_MS = 1200;

const ROUTES = ["/", "/propiedades", "/socios", "/contacto"];

function normalizeBase(raw) {
  const v = String(raw || "").trim();
  const parsed = new URL(v);
  return parsed.origin;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } catch (error) {
    return {
      ok: false,
      status: null,
      text: "",
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

function isRetryable(result) {
  if (result.ok) return false;
  if (result.status === 502 || result.status === 503 || result.status === 504) return true;
  if (result.status == null) return true;
  return false;
}

async function checkUrl(path) {
  const url = `${BASE}${path === "/" ? "" : path}`;
  let last = null;
  for (let i = 0; i < RETRIES; i++) {
    last = await fetchWithTimeout(url);
    if (!isRetryable(last)) break;
    if (i < RETRIES - 1) {
      await sleep(RETRY_DELAY_MS);
    }
  }
  return { url, ...last };
}

function includesAny(text, needles) {
  return needles.some((n) => text.includes(n));
}

function summarizeContent(propsHtml, sociosHtml) {
  const propsHasDemo =
    includesAny(propsHtml, ["Listado referencial", "Publicación ilustrativa", "muestra local", "Corredora Demo Norte"]) ||
    false;
  const propsHasReal =
    includesAny(propsHtml, ["advertiser%3A", "kpnet%3Aorg%3A", "Oportunidades publicadas"]) || false;

  const sociosHasDemo =
    includesAny(sociosHtml, ["Corredora Demo Norte", "muestra local", "Listado referencial"]) || false;
  const sociosHasReal =
    includesAny(sociosHtml, ["advertiser%3A", "kpnet%3Aorg%3A", "Inmobiliarias y anunciantes listados"]) || false;

  return {
    propiedades: {
      demoMarkers: propsHasDemo,
      realMarkers: propsHasReal,
      state: propsHasDemo ? "referencial/demo" : propsHasReal ? "real" : "indeterminado",
    },
    socios: {
      demoMarkers: sociosHasDemo,
      realMarkers: sociosHasReal,
      state: sociosHasDemo ? "demo" : sociosHasReal ? "real" : "indeterminado",
    },
  };
}

async function main() {
  const checks = [];
  for (const route of ROUTES) {
    checks.push(await checkUrl(route));
  }
  const auditRoute = await checkUrl("/api/test-kiteprop-network-audit");

  const failed = checks.filter((c) => !c.ok);
  const content = summarizeContent(checks[1]?.text || "", checks[2]?.text || "");

  let networkAudit = { enabled: false, status: auditRoute.status, summary: null };
  if (auditRoute.ok) {
    try {
      const parsed = JSON.parse(auditRoute.text);
      networkAudit = {
        enabled: true,
        status: auditRoute.status,
        summary: {
          organizations: parsed?.organizations?.total ?? null,
          properties: parsed?.properties?.total ?? null,
          socioResolutionStats: parsed?.properties?.socioResolutionStats ?? null,
        },
      };
    } catch {
      networkAudit = { enabled: true, status: auditRoute.status, summary: "invalid_json" };
    }
  }

  const report = {
    base: BASE,
    readiness: checks.map((c) => ({
      path: c.url.replace(BASE, "") || "/",
      ok: c.ok,
      status: c.status,
      error: c.error || null,
    })),
    networkAudit,
    content,
  };

  console.log(JSON.stringify(report, null, 2));

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
