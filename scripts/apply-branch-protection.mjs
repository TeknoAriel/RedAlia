#!/usr/bin/env node
/**
 * Aplica (idempotente) reglas de protección en la rama por defecto vía REST API.
 * Requiere token con permiso de administración del repositorio (no alcanza el GITHUB_TOKEN del CI).
 *
 * Uso local / CI con PAT:
 *   export BRANCH_PROTECTION_TOKEN=ghp_…   # o fine-grained con Administration: write
 *   node scripts/apply-branch-protection.mjs
 *
 * Variables opcionales:
 *   GITHUB_REPOSITORY=owner/repo  (en Actions ya viene definido)
 *   BRANCH=main
 *   CHECK_CONTEXT=…               fuerza el nombre del check (si la autodetección falla)
 *   REQUIRE_PR=1|0                exigir PR antes de mergear (default 1)
 *   STRICT_UP_TO_DATE=1|0         rama al día (default 1)
 *   ENFORCE_ADMINS=1|0            admins sujetos a las mismas reglas (default 1)
 *   DRY_RUN=1                     solo muestra el cuerpo que se enviaría / estado actual
 */

import { execSync } from "node:child_process";

const API_VERSION = "2022-11-28";
const DEFAULT_JOB_LABEL = "listo para merge";
const FALLBACK_CONTEXTS = ["CI / CI — listo para merge", "CI — listo para merge"];

function getOwnerRepo() {
  const gr = process.env.GITHUB_REPOSITORY;
  if (gr) {
    const [owner, repo] = gr.split("/");
    if (owner && repo) return { owner, repo };
  }
  try {
    const url = execSync("git remote get-url origin", {
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
    }).trim();
    const m = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/i);
    if (m) return { owner: m[1], repo: m[2].replace(/\.git$/i, "") };
  } catch {
    /* sin git */
  }
  throw new Error(
    "Definí GITHUB_REPOSITORY=dueno/repo o ejecutá desde un clone con remote origin a github.com.",
  );
}

function getToken() {
  const t =
    process.env.BRANCH_PROTECTION_TOKEN ||
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN;
  if (!t || !String(t).trim()) {
    throw new Error(
      "Falta token: BRANCH_PROTECTION_TOKEN (recomendado en Actions) o GITHUB_TOKEN / GH_TOKEN con permiso Administration del repo.",
    );
  }
  return String(t).trim();
}

function envBool(name, defaultValue) {
  const v = process.env[name];
  if (v === undefined || v === "") return defaultValue;
  return !/^(0|false|no|off)$/i.test(String(v).trim());
}

async function githubFetch(path, token, options = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": API_VERSION,
      Authorization: `Bearer ${token}`,
      "User-Agent": "redalia-apply-branch-protection",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { message: text };
    }
  }
  return { ok: res.ok, status: res.status, json };
}

async function listAllCheckRuns(owner, repo, ref, token) {
  const out = [];
  let page = 1;
  const perPage = 100;
  for (;;) {
    const path = `/repos/${owner}/${repo}/commits/${encodeURIComponent(ref)}/check-runs?per_page=${perPage}&page=${page}`;
    const { ok, status, json } = await githubFetch(path, token);
    if (!ok) {
      throw new Error(
        `No se pudieron listar check-runs (${status}): ${json?.message || JSON.stringify(json)}`,
      );
    }
    const batch = json.check_runs || [];
    out.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
    if (page > 20) break;
  }
  return out;
}

function pickCheckContext(checkRuns) {
  const success = checkRuns.filter(
    (r) =>
      r.status === "completed" &&
      (r.conclusion === "success" || r.conclusion === "skipped"),
  );
  const byLabel = success.find((r) =>
    String(r.name || "").includes(DEFAULT_JOB_LABEL),
  );
  if (byLabel?.name) return String(byLabel.name).trim();
  const fromActions = success.find(
    (r) => r.app?.slug === "github-actions" || r.app?.name === "GitHub Actions",
  );
  if (fromActions?.name) return String(fromActions.name).trim();
  return null;
}

function protectionPayload(context, opts) {
  const { strict, enforceAdmins, requirePr } = opts;
  const ctx = context.trim();
  return {
    required_status_checks: {
      strict,
      contexts: [ctx],
      checks: [{ context: ctx, app_id: null }],
    },
    enforce_admins: enforceAdmins,
    required_pull_request_reviews: requirePr
      ? { required_approving_review_count: 0 }
      : null,
    restrictions: null,
    required_linear_history: false,
    allow_force_pushes: false,
    allow_deletions: false,
    block_creations: false,
    required_conversation_resolution: false,
    lock_branch: false,
    allow_fork_syncing: false,
  };
}

function protectionAlreadyMatches(existing, wantedContext, opts) {
  if (!existing) return false;
  const checks = existing.required_status_checks;
  if (!checks) return false;
  const listed = [
    ...(checks.checks || []).map((c) => c.context),
    ...(checks.contexts || []),
  ].filter(Boolean);
  if (!listed.includes(wantedContext)) return false;
  if (Boolean(checks.strict) !== Boolean(opts.strict)) return false;
  const hasPrRule = existing.required_pull_request_reviews != null;
  if (hasPrRule !== Boolean(opts.requirePr)) return false;
  const enforced =
    typeof existing.enforce_admins === "object" && existing.enforce_admins !== null
      ? Boolean(existing.enforce_admins.enabled)
      : Boolean(existing.enforce_admins);
  if (enforced !== Boolean(opts.enforceAdmins)) return false;
  return true;
}

async function getProtection(owner, repo, branch, token) {
  const path = `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection`;
  const { ok, status, json } = await githubFetch(path, token);
  if (status === 404) return null;
  if (!ok) {
    throw new Error(
      `GET branch protection (${status}): ${json?.message || JSON.stringify(json)}`,
    );
  }
  return json;
}

async function putProtection(owner, repo, branch, body, token) {
  const path = `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}/protection`;
  const { ok, status, json } = await githubFetch(path, token, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  if (!ok) {
    const msg = json?.message || JSON.stringify(json);
    const err = new Error(`PUT branch protection (${status}): ${msg}`);
    err.status = status;
    err.body = json;
    throw err;
  }
  return json;
}

async function main() {
  const dry = envBool("DRY_RUN", false);
  const branch = (process.env.BRANCH || "main").trim();
  let tokenFinal;
  try {
    tokenFinal = getToken();
  } catch (e) {
    if (dry) {
      console.log(
        "[dry-run] Sin BRANCH_PROTECTION_TOKEN / GITHUB_TOKEN / GH_TOKEN: no se puede consultar la API.",
      );
      const forced = (process.env.CHECK_CONTEXT || "").trim();
      if (forced) {
        const body = protectionPayload(forced, {
          strict: envBool("STRICT_UP_TO_DATE", true),
          enforceAdmins: envBool("ENFORCE_ADMINS", true),
          requirePr: envBool("REQUIRE_PR", true),
        });
        console.log("[dry-run] PUT body:", JSON.stringify(body, null, 2));
      }
      process.exit(0);
    }
    throw e;
  }

  const { owner, repo } = getOwnerRepo();
  const strict = envBool("STRICT_UP_TO_DATE", true);
  const enforceAdmins = envBool("ENFORCE_ADMINS", true);
  const requirePr = envBool("REQUIRE_PR", true);
  const forcedContext = (process.env.CHECK_CONTEXT || "").trim();

  let context = forcedContext || null;
  if (!context) {
    console.log(`Buscando check en ${owner}/${repo}@${branch}…`);
    try {
      const runs = await listAllCheckRuns(owner, repo, branch, tokenFinal);
      context = pickCheckContext(runs);
      if (context) {
        console.log(`Check detectado: "${context}"`);
      }
    } catch (e) {
      console.warn(String(e.message || e));
    }
  } else {
    console.log(`Check forzado por env: "${context}"`);
  }

  if (!context) {
    context = FALLBACK_CONTEXTS[0];
    console.log(`Usando fallback: "${context}"`);
  }

  const body = protectionPayload(context, {
    strict,
    enforceAdmins,
    requirePr,
  });

  const existing = await getProtection(owner, repo, branch, tokenFinal);
  if (
    protectionAlreadyMatches(existing, context, {
      strict,
      requirePr,
      enforceAdmins,
    })
  ) {
    console.log(
      `La rama ${branch} ya coincide con la política deseada (check "${context}"). Nada que cambiar.`,
    );
    process.exit(0);
  }

  if (dry) {
    console.log("[dry-run] PUT body:", JSON.stringify(body, null, 2));
    process.exit(0);
  }

  const candidates = [context, ...FALLBACK_CONTEXTS.filter((c) => c !== context)];
  let lastErr;
  for (const ctx of candidates) {
    const b = protectionPayload(ctx, { strict, enforceAdmins, requirePr });
    try {
      await putProtection(owner, repo, branch, b, tokenFinal);
      console.log(
        `Listo: ${branch} en ${owner}/${repo} exige status check "${ctx}", strict=${strict}, PR requerido=${requirePr}, enforce_admins=${enforceAdmins}.`,
      );
      process.exit(0);
    } catch (e) {
      lastErr = e;
      if (e.status === 422) {
        console.warn(`Contexto "${ctx}" rechazado por la API; probando siguiente…`);
        continue;
      }
      throw e;
    }
  }
  throw lastErr || new Error("No se pudo aplicar branch protection.");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
