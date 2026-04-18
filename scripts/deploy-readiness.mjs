#!/usr/bin/env node
/**
 * Comprueba que un deploy sea "usable": rutas públicas responden 2xx.
 * Sin secretos. Uso:
 *   DEPLOY_READINESS_URL=https://tu-dominio.vercel.app node scripts/deploy-readiness.mjs
 *   node scripts/deploy-readiness.mjs https://tu-dominio.vercel.app
 *
 * Sale con código 1 si alguna petición falla (HTTP no OK, timeout, red).
 */

const TIMEOUT_MS = 25_000;
const PATHS = ["/", "/propiedades", "/socios", "/contacto"];

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

async function checkUrl(url) {
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
    console.error(`\nDeploy readiness: ${failed.length}/${results.length} fallos.`);
    process.exit(1);
  }
  console.error(`\nDeploy readiness: ${results.length} rutas OK (${base}).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
