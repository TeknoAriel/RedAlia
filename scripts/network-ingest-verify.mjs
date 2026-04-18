#!/usr/bin/env node
/**
 * Verifica ingest contra la API de red KiteProp (mismo contrato que AINA / `lib/kiteprop-network`).
 * No usa Next ni imports TypeScript: sirve en CI y local con las mismas variables que producción.
 *
 * Requiere (mínimo AINA):
 *   KITEPROP_API_USER, KITEPROP_API_PASSWORD
 *   KITEPROP_NETWORK_ID, KITEPROP_NETWORK_TOKEN
 *
 * Opcional:
 *   KITEPROP_API_BASE_URL (default https://www.kiteprop.com/api/v1)
 *   KITEPROP_AUTH_LOGIN_PATH (default auth/login)
 *   KITEPROP_AUTH_LOGIN_USER_FIELD / KITEPROP_AUTH_LOGIN_PASSWORD_FIELD (email / password)
 *   KITEPROP_NETWORK_ORGANIZATIONS_PATH / KITEPROP_NETWORK_PROPERTIES_PATH con {networkId} {networkToken}
 *   KITEPROP_NETWORK_TOKEN_AS_BEARER=1 — Bearer = token de red (sin login)
 *   KITEPROP_ACCESS_TOKEN o KITEPROP_API_SECRET — Bearer si no hay user/pass
 *   KITEPROP_NETWORK_ID_HEADER / KITEPROP_NETWORK_TOKEN_HEADER
 *   NETWORK_VERIFY_MIN_PROPERTIES (default 1), NETWORK_VERIFY_MIN_ORGANIZATIONS (default 1)
 *
 * Uso:
 *   set -a && source .env.local && set +a && node scripts/network-ingest-verify.mjs
 */

const TIMEOUT_MS = 25_000;
const DEFAULT_BASE = "https://www.kiteprop.com/api/v1";

function trimEnv(name) {
  const v = process.env[name]?.trim();
  return v || "";
}

function unwrapSuccessData(raw) {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw;
  if (o.success !== true) return null;
  return o.data ?? null;
}

function pickArrayDeep(root, keyOrder, preferNonEmpty, depth) {
  if (depth > 5 || root == null) return null;
  if (Array.isArray(root)) {
    if (!preferNonEmpty || root.length > 0) return root;
    return null;
  }
  if (typeof root !== "object") return null;
  const rec = root;
  if (preferNonEmpty) {
    for (const k of keyOrder) {
      const v = rec[k];
      if (Array.isArray(v) && v.length > 0) return v;
    }
  }
  for (const k of keyOrder) {
    const v = rec[k];
    if (Array.isArray(v)) return v;
  }
  const nested = rec.data ?? rec.result ?? rec.payload;
  if (nested && typeof nested === "object") {
    return pickArrayDeep(nested, keyOrder, preferNonEmpty, depth + 1);
  }
  return null;
}

function extractPropertyArray(raw) {
  const KEYS = [
    "properties",
    "publications",
    "listings",
    "property_list",
    "propertyList",
    "items",
    "results",
    "rows",
    "list",
  ];
  if (Array.isArray(raw)) return raw;
  const u = unwrapSuccessData(raw);
  const roots = [u, raw].filter((x) => x != null);
  for (const root of roots) {
    const got = pickArrayDeep(root, KEYS, true, 0);
    if (got?.length) return got;
  }
  for (const root of roots) {
    const got = pickArrayDeep(root, KEYS, false, 0);
    if (got) return got;
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const v of Object.values(raw)) {
      if (Array.isArray(v) && v.length > 0) return v;
    }
  }
  return [];
}

function extractOrganizationArray(raw) {
  const KEYS = [
    "organizations",
    "organization_list",
    "organizationList",
    "items",
    "results",
    "rows",
    "list",
  ];
  if (Array.isArray(raw)) return raw;
  const u = unwrapSuccessData(raw);
  const roots = [u, raw].filter((x) => x != null);
  for (const root of roots) {
    const got = pickArrayDeep(root, KEYS, true, 0);
    if (got?.length) return got;
  }
  for (const root of roots) {
    const got = pickArrayDeep(root, KEYS, false, 0);
    if (got) return got;
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const v of Object.values(raw)) {
      if (Array.isArray(v) && v.length > 0) return v;
    }
  }
  return [];
}

function normalizeBase(raw) {
  return (raw || DEFAULT_BASE).replace(/\/+$/, "");
}

function applyPathTemplate(template, networkId, networkToken) {
  let p = template;
  if (networkId) p = p.split("{networkId}").join(encodeURIComponent(networkId));
  if (networkToken) p = p.split("{networkToken}").join(encodeURIComponent(networkToken));
  return p;
}

function pathEmbedsToken(path, tok) {
  if (!path || !tok) return false;
  return path.includes(tok) || path.includes(encodeURIComponent(tok));
}

function resolvePaths() {
  const id = trimEnv("KITEPROP_NETWORK_ID");
  const tok = trimEnv("KITEPROP_NETWORK_TOKEN");
  const customOrg = trimEnv("KITEPROP_NETWORK_ORGANIZATIONS_PATH");
  const customProp = trimEnv("KITEPROP_NETWORK_PROPERTIES_PATH");

  let orgPath = null;
  if (customOrg) orgPath = applyPathTemplate(customOrg, id, tok);
  else if (id && tok) orgPath = `/networks/${encodeURIComponent(id)}/${encodeURIComponent(tok)}/organizations`;

  let propPath = null;
  if (customProp) propPath = applyPathTemplate(customProp, id, tok);
  else if (id && tok)
    propPath = `/properties/network/${encodeURIComponent(id)}/${encodeURIComponent(tok)}`;

  return { orgPath, propPath, networkId: id, networkToken: tok };
}

function buildExtraHeaders(request, orgPath, propPath, nid, ntok, idHeader, tokHeader) {
  const paths =
    request === "organizations" ? [orgPath] : request === "properties" ? [propPath] : [orgPath, propPath].filter(Boolean);
  if (ntok && paths.some((p) => p && pathEmbedsToken(p, ntok))) return {};
  const extra = {};
  if (nid) extra[idHeader] = nid;
  if (ntok) extra[tokHeader] = ntok;
  return extra;
}

function pickTokenFromLoginResponse(raw) {
  if (typeof raw === "string" && raw.length > 8) return raw.trim();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw;
  const data = o.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const at = data.access_token;
    if (typeof at === "string" && at.length > 8) return at.trim();
  }
  const direct = ["access_token", "accessToken", "token", "jwt", "bearerToken"];
  for (const k of direct) {
    const v = o[k];
    if (typeof v === "string" && v.length > 8) return v;
  }
  return null;
}

async function fetchJson(method, url, { headers = {}, body } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...headers,
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
      body: body != null ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const text = await res.text();
    let data = null;
    if (text.trim()) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { _parseError: true, snippet: text.slice(0, 200) };
      }
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, status: null, data: null, error: msg };
  } finally {
    clearTimeout(t);
  }
}

async function resolveBearer(orgPath, propPath) {
  const ntok = trimEnv("KITEPROP_NETWORK_TOKEN");
  if (trimEnv("KITEPROP_NETWORK_TOKEN_AS_BEARER") === "1" && ntok) {
    return {
      ok: true,
      bearer: ntok,
      extra: buildExtraHeaders(
        undefined,
        orgPath,
        propPath,
        trimEnv("KITEPROP_NETWORK_ID"),
        ntok,
        trimEnv("KITEPROP_NETWORK_ID_HEADER") || "X-Network-Id",
        trimEnv("KITEPROP_NETWORK_TOKEN_HEADER") || "X-Network-Token",
      ),
    };
  }

  const user = trimEnv("KITEPROP_API_USER");
  const pass = trimEnv("KITEPROP_API_PASSWORD");
  if (user && pass) {
    const loginPath = (trimEnv("KITEPROP_AUTH_LOGIN_PATH") || "auth/login").replace(/^\/+/, "");
    const uf = trimEnv("KITEPROP_AUTH_LOGIN_USER_FIELD") || "email";
    const pf = trimEnv("KITEPROP_AUTH_LOGIN_PASSWORD_FIELD") || "password";
    const base = normalizeBase(trimEnv("KITEPROP_API_BASE_URL"));
    const loginUrl = `${base}/${loginPath}`;
    const loginBody = { [uf]: user, [pf]: pass };
    const loginRes = await fetchJson("POST", loginUrl, { body: loginBody });
    if (!loginRes.ok) {
      return { ok: false, step: "login", status: loginRes.status, error: `HTTP login ${loginRes.status}` };
    }
    const token = pickTokenFromLoginResponse(loginRes.data);
    if (!token) {
      return { ok: false, step: "login", error: "TOKEN_NOT_FOUND_IN_RESPONSE" };
    }
    const nid = trimEnv("KITEPROP_NETWORK_ID");
    const idHeader = trimEnv("KITEPROP_NETWORK_ID_HEADER") || "X-Network-Id";
    const tokHeader = trimEnv("KITEPROP_NETWORK_TOKEN_HEADER") || "X-Network-Token";
    return {
      ok: true,
      bearer: token,
      extra: buildExtraHeaders(undefined, orgPath, propPath, nid, ntok, idHeader, tokHeader),
    };
  }

  const bearer =
    trimEnv("KITEPROP_ACCESS_TOKEN") || trimEnv("KITEPROP_API_SECRET") || trimEnv("KITEPROP_API_TOKEN");
  if (bearer) {
    const nid = trimEnv("KITEPROP_NETWORK_ID");
    const ntok2 = trimEnv("KITEPROP_NETWORK_TOKEN");
    const idHeader = trimEnv("KITEPROP_NETWORK_ID_HEADER") || "X-Network-Id";
    const tokHeader = trimEnv("KITEPROP_NETWORK_TOKEN_HEADER") || "X-Network-Token";
    return {
      ok: true,
      bearer,
      extra: buildExtraHeaders(undefined, orgPath, propPath, nid, ntok2, idHeader, tokHeader),
    };
  }

  return { ok: false, step: "auth", error: "MISSING_AUTH (user+password o ACCESS_TOKEN/API_SECRET o NETWORK_TOKEN_AS_BEARER)" };
}

async function getJson(base, pathPart, bearer, extraHeaders, query) {
  let path = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;
  const sp = new URLSearchParams();
  if (query) for (const [k, v] of Object.entries(query)) if (v) sp.set(k, v);
  const q = sp.toString();
  if (q) path += (path.includes("?") ? "&" : "?") + q;
  const url = `${base}${path}`;
  const headers = {
    Authorization: `Bearer ${bearer}`,
    ...extraHeaders,
  };
  return fetchJson("GET", url, { headers });
}

async function main() {
  const base = normalizeBase(trimEnv("KITEPROP_API_BASE_URL"));
  const { orgPath, propPath } = resolvePaths();

  if (!propPath) {
    console.error(
      "Falta path de propiedades: definí KITEPROP_NETWORK_ID + KITEPROP_NETWORK_TOKEN o KITEPROP_NETWORK_PROPERTIES_PATH.",
    );
    process.exit(1);
  }
  if (!orgPath) {
    console.error(
      "Falta path de organizaciones: definí KITEPROP_NETWORK_ID + KITEPROP_NETWORK_TOKEN o KITEPROP_NETWORK_ORGANIZATIONS_PATH.",
    );
    process.exit(1);
  }

  const auth = await resolveBearer(orgPath, propPath);
  if (!auth.ok) {
    console.error(JSON.stringify({ ok: false, auth }, null, 2));
    process.exit(1);
  }

  const propHeaders = {
    ...buildExtraHeaders(
      "properties",
      orgPath,
      propPath,
      trimEnv("KITEPROP_NETWORK_ID"),
      trimEnv("KITEPROP_NETWORK_TOKEN"),
      trimEnv("KITEPROP_NETWORK_ID_HEADER") || "X-Network-Id",
      trimEnv("KITEPROP_NETWORK_TOKEN_HEADER") || "X-Network-Token",
    ),
  };
  const orgHeaders = {
    ...buildExtraHeaders(
      "organizations",
      orgPath,
      propPath,
      trimEnv("KITEPROP_NETWORK_ID"),
      trimEnv("KITEPROP_NETWORK_TOKEN"),
      trimEnv("KITEPROP_NETWORK_ID_HEADER") || "X-Network-Id",
      trimEnv("KITEPROP_NETWORK_TOKEN_HEADER") || "X-Network-Token",
    ),
  };

  const [propRes, orgRes] = await Promise.all([
    getJson(base, propPath, auth.bearer, propHeaders, { status: "active" }),
    getJson(base, orgPath, auth.bearer, orgHeaders, {}),
  ]);

  const properties = propRes.ok ? extractPropertyArray(propRes.data) : [];
  const organizations = orgRes.ok ? extractOrganizationArray(orgRes.data) : [];

  const minP = Math.max(0, parseInt(trimEnv("NETWORK_VERIFY_MIN_PROPERTIES") || "1", 10) || 1);
  const minO = Math.max(0, parseInt(trimEnv("NETWORK_VERIFY_MIN_ORGANIZATIONS") || "1", 10) || 1);

  const summary = {
    ok: propRes.ok && orgRes.ok && properties.length >= minP && organizations.length >= minO,
    base,
    login: "ok",
    properties: {
      httpStatus: propRes.status,
      count: properties.length,
      ok: propRes.ok,
    },
    organizations: {
      httpStatus: orgRes.status,
      count: organizations.length,
      ok: orgRes.ok,
    },
    thresholds: { minProperties: minP, minOrganizations: minO },
  };

  console.log(JSON.stringify(summary, null, 2));

  if (!propRes.ok) {
    console.error(`Propiedades: HTTP ${propRes.status ?? "?"} (sin lista)`);
    process.exit(1);
  }
  if (!orgRes.ok) {
    console.error(`Organizaciones: HTTP ${orgRes.status ?? "?"} (sin lista)`);
    process.exit(1);
  }
  if (properties.length < minP) {
    console.error(`Propiedades: count ${properties.length} < mínimo ${minP}`);
    process.exit(1);
  }
  if (organizations.length < minO) {
    console.error(`Organizaciones: count ${organizations.length} < mínimo ${minO}`);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
