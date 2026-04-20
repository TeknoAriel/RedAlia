#!/usr/bin/env node
/**
 * Comprueba que un deploy sea "usable": rutas públicas responden 2xx.
 * Sin secretos. Uso:
 *   DEPLOY_READINESS_URL=https://tu-dominio.vercel.app node scripts/deploy-readiness.mjs
 *   node scripts/deploy-readiness.mjs https://tu-dominio.vercel.app
 *
 * Reintentos (cold start / CDN):
 *   DEPLOY_READINESS_ATTEMPTS (default 5), DEPLOY_READINESS_RETRY_MS (default 3500)
 *   Reintenta solo 502, 503, 504 y errores de red (sin body HTTP). No reintenta 429.
 *
 * Casos especiales (no indican bug del código del repo):
 *   - Todas las rutas HTTP 401: típico Deployment Protection en preview → exit 0.
 *   - Todas las rutas HTTP 429: rate limit / cuota de plataforma (p. ej. Vercel Hobby) → exit 0
 *     con mensaje explícito (no confundir con fallo de build). Ver docs en .github/DEPLOYMENT.md.
 *
 * Sale con código 1 si alguna petición falla (HTTP no OK distinto de los casos anteriores, timeout, red).
 */

const TIMEOUT_MS = 25_000;
const PATHS = ["/", "/propiedades", "/socios", "/contacto"];

function readinessAttempts() {
  const n = parseInt(process.env.DEPLOY_READINESS_ATTEMPTS || "5", 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 15) : 5;
}

function readinessRetryMs() {
  const n = parseInt(process.env.DEPLOY_READINESS_RETRY_MS || "3500", 10);
  return Number.isFinite(n) && n >= 200 ? Math.min(n, 60_000) : 3500;
}

function normalizeBase(raw) {
  const u = String(raw || "").trim();
  if (!u) return null;
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

async function checkUrlOnce(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { Accept: "text/html,application/json;q=0.9,*/*;q=0.8" },
    });
    if (!res.ok) {
      return { ok: false, status: res.status, url };
    }
    return { ok: true, status: res.status, url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, status: null, url, error: msg };
  } finally {
    clearTimeout(t);
  }
}

function isTransientFailure(r) {
  if (r.ok) return false;
  if (r.status === 502 || r.status === 503 || r.status === 504) return true;
  if (r.status == null && r.error) return true;
  return false;
}

async function checkUrl(url) {
  const max = readinessAttempts();
  const delay = readinessRetryMs();
  let last = await checkUrlOnce(url);
  for (let i = 1; i < max && isTransientFailure(last); i++) {
    process.stderr.write(` (reintento ${i}/${max - 1} en ${delay}ms) `);
    await new Promise((r) => setTimeout(r, delay));
    last = await checkUrlOnce(url);
  }
  return last;
}

async function main() {
  const base = normalizeBase(process.env.DEPLOY_READINESS_URL || process.argv[2]);
  if (!base) {
    console.error(
      "Definí la URL base: DEPLOY_READINESS_URL=https://… o pasá el primer argumento.",
    );
    process.exit(1);
  }

  const results = [];
  for (const path of PATHS) {
    const pathPart = path === "/" ? "/" : path;
    const url = `${base}${pathPart === "/" ? "" : pathPart}`;
    process.stderr.write(`GET ${url} … `);
    const r = await checkUrl(url);
    results.push(r);
    if (r.ok) {
      console.error(`OK (${r.status})`);
    } else {
      console.error(`FAIL${r.status != null ? ` HTTP ${r.status}` : ""}${r.error ? `: ${r.error}` : ""}`);
    }
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    const all401 =
      failed.length === results.length &&
      failed.every((r) => r.status === 401);
    if (all401) {
      console.error(
        `\nDeploy readiness: todas las rutas respondieron HTTP 401 (típico de **Vercel Deployment Protection** en preview: el sitio no es público sin cookie/token). No indica fallo del código en GitHub.`,
      );
      console.error(
        `Opciones: desactivar protección en previews, o usar bypass de Vercel en el workflow. El job termina OK para no bloquear PRs.`,
      );
      process.exit(0);
    }

    const all429 =
      failed.length === results.length &&
      failed.every((r) => r.status === 429);
    if (all429) {
      console.error(
        `\n*** Deploy readiness: CUOTA / RATE LIMIT (HTTP 429 en todas las rutas) ***`,
      );
      console.error(
        `Esto suele ser **límite del plan** (p. ej. Vercel Hobby: deployments/día u otro rate limit), no un error de rutas de la app.`,
      );
      console.error(
        `Revisá en Vercel → Team/Account → **Usage** / **Billing** y la doc oficial de límites del plan. Los números cambian con el tiempo (algunos mails históricos citaban ~25/día; la doc pública de Hobby hoy indica **100 deployments/día** — confirmá en tu panel).`,
      );
      console.error(
        `Este script termina **exit 0** a propósito para no bloquear CI como “fallo de código”. Cuando baje la presión o subas de plan, el smoke volverá a validar 2xx.`,
      );
      if (process.env.DEPLOY_READINESS_JSON_SUMMARY === "1") {
        console.log(
          JSON.stringify({
            ok: true,
            skippedReason: "vercel_rate_limit_or_quota",
            httpStatus: 429,
            base,
            hint:
              "Cuota o rate limit del hosting; verificar Usage en Vercel y límites del plan (Hobby vs Pro).",
          }),
        );
      }
      process.exit(0);
    }

    if (failed.some((r) => r.status === 429) && !all429) {
      console.error(
        `\nNota: al menos una ruta respondió **429** (rate limit / cuota). Revisá **Usage** en Vercel además de los otros códigos arriba.`,
      );
    }

    console.error(`\nDeploy readiness: ${failed.length}/${results.length} fallos.`);
    if (process.env.DEPLOY_READINESS_JSON_SUMMARY === "1") {
      const any429 = failed.some((r) => r.status === 429);
      console.log(
        JSON.stringify({
          ok: false,
          base,
          hint429: any429
            ? "Alguna respuesta 429: posible cuota/rate limit Vercel (ver .github/DEPLOYMENT.md § límites Hobby)."
            : undefined,
          failed: failed.map((r) => ({
            url: r.url,
            status: r.status,
            error: r.error,
          })),
        }),
      );
    }
    process.exit(1);
  }
  console.error(`\nDeploy readiness: ${results.length} rutas OK (${base}).`);
  if (process.env.DEPLOY_READINESS_JSON_SUMMARY === "1") {
    const summary = {
      ok: true,
      base,
      paths: PATHS,
      results: results.map((r) => ({
        path: r.url.replace(base, "") || "/",
        status: r.status,
        ok: r.ok,
      })),
      attempts: readinessAttempts(),
      retryMs: readinessRetryMs(),
    };
    console.log(JSON.stringify(summary));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
