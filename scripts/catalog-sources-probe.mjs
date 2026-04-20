#!/usr/bin/env node
/**
 * Resumen en terminal de las fuentes del catálogo (sin Next, sin PII en valores).
 *
 * 1) Feed JSON de difusión (KITEPROP_PROPERTIES_URL o default del repo)
 * 2) REST GET /properties — todas las páginas (limit 50 por request; máx. páginas CATALOG_PROBE_REST_MAX_PAGES, default 500)
 * 3) REST GET /users — idem paginado (usuarios API; no es el directorio Socios web)
 * 4) API de red: propiedades + organizaciones (mismos paths que ingest AINA)
 *
 * Uso:
 *   set -a && source .env.local && set +a && npm run catalog:sources-probe
 *
 * Solo JSON (sin llamar a KiteProp API):
 *   CATALOG_PROBE_JSON_ONLY=1 npm run catalog:sources-probe
 *
 * Al final imprime un bloque RESUMEN con totales de propiedades e inmobiliarias (agencias
 * distintas en el feed JSON; organizaciones en API red).
 */

const DEFAULT_JSON_FEED =
  "https://static.kiteprop.com/kp/difusions/4b3c894a10d905c82e85b35c410d7d4099551504/externalsite-274-824a1c8e7d598497d49e0ad573e2a8dc63d82c63.json";
const DEFAULT_API_BASE = "https://www.kiteprop.com/api/v1";

/** KiteProp REST y red usan 15 | 30 | 50 por página; el probe usa 50 y recorre todas las páginas permitidas. */
const REST_PAGE_LIMIT = 50;
const PAGE_LIMITS = new Set([15, 30, 50]);

function trimEnv(n) {
  const v = process.env[n]?.trim();
  return v || "";
}

function requestTimeoutMs() {
  const n = parseInt(trimEnv("KITEPROP_API_TIMEOUT_MS") || "25000", 10);
  return Number.isFinite(n) ? Math.min(120_000, Math.max(5_000, n)) : 25_000;
}

function jsonFeedUrl() {
  return trimEnv("KITEPROP_PROPERTIES_URL") || trimEnv("NEXT_PUBLIC_KITEPROP_PROPERTIES_URL") || DEFAULT_JSON_FEED;
}

function isRecord(x) {
  return x != null && typeof x === "object" && !Array.isArray(x);
}

function extractRawListJs(payload) {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  const inner =
    payload.properties ??
    payload.publicaciones ??
    payload.publications ??
    payload.listings ??
    payload.listing ??
    payload.items ??
    payload.data ??
    payload.results ??
    payload.inmuebles ??
    payload.avisos;
  if (Array.isArray(inner)) return inner;
  const nested = payload.response ?? payload.body ?? payload.content;
  if (isRecord(nested)) {
    const inner2 = nested.properties ?? nested.publicaciones ?? nested.items ?? nested.data;
    if (Array.isArray(inner2)) return inner2;
  }
  return [];
}

function pickTitle(raw) {
  if (!isRecord(raw)) return null;
  for (const k of ["title", "titulo", "name", "nombre"]) {
    const v = raw[k];
    if (typeof v === "string" && v.trim()) return v.trim().slice(0, 80);
  }
  return null;
}

/** Inmobiliarias = objetos `agency` / alias en cada ítem del feed (dedupe por id o nombre). */
function agencyDedupeKey(ag) {
  if (!isRecord(ag)) return null;
  const id = ag.id ?? ag.ID;
  if (typeof id === "number" && Number.isFinite(id)) return `id:${Math.round(id)}`;
  if (typeof id === "string" && /^\d+$/.test(id.trim())) return `id:${id.trim()}`;
  const n = String(ag.name ?? ag.nombre ?? "")
    .trim()
    .toLowerCase();
  return n ? `name:${n}` : null;
}

function countDistinctAgenciesInRawList(list) {
  const seen = new Set();
  for (const raw of list) {
    if (!isRecord(raw)) continue;
    const ag = raw.agency ?? raw.inmobiliaria ?? raw.corredora ?? raw.office;
    const k = agencyDedupeKey(ag);
    if (k) seen.add(k);
  }
  return seen.size;
}

/** Totales acumulados para el bloque RESUMEN (sin PII). */
const runStats = {
  json: null,
  restPropertiesAll: null,
  restUsersAll: null,
  network: null,
};

async function fetchJson(method, url, { headers = {}, body } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), requestTimeoutMs());
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
        data = { _parseError: true, snippet: text.slice(0, 120) };
      }
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: null, data: null, error: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(t);
  }
}

async function probeJsonFeed() {
  const url = jsonFeedUrl();
  console.log("\n========== 1) FEED JSON (difusión) ==========");
  console.log("URL (sin querystring largo):", url.split("?")[0].slice(0, 96) + (url.length > 96 ? "…" : ""));
  const res = await fetchJson("GET", url, {
    headers: {
      "User-Agent": "RedaliaCatalogProbe/1.0",
      "Cache-Control": "no-cache",
    },
  });
  console.log("HTTP:", res.status ?? "?", res.ok ? "OK" : "FAIL", res.error || "");
  if (!res.ok || res.data == null) {
    console.log("Cuerpo (recorte):", typeof res.data === "object" ? JSON.stringify(res.data).slice(0, 200) : String(res.data));
    runStats.json = { http: res.status, propiedades: null, inmobiliariasDistintas: null };
    return;
  }
  const list = extractRawListJs(res.data);
  const inm = countDistinctAgenciesInRawList(list);
  runStats.json = { http: res.status, propiedades: list.length, inmobiliariasDistintas: inm };
  console.log("Ítems detectados (extractRawList):", list.length);
  console.log("Inmobiliarias distintas (bloque agency por ficha, dedupe):", inm);
  const sample = list.slice(0, 5).map((r, i) => ({ i: i + 1, title: pickTitle(r) || "(sin título)" }));
  console.log("Muestra (hasta 5 títulos):", JSON.stringify(sample, null, 2));
  console.log("── TOTAL feed JSON → propiedades:", list.length, "| inmobiliarias (agencias distintas):", inm);
}

function unwrapSuccessData(raw) {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  if (raw.success !== true) return null;
  return raw.data ?? null;
}

function pickArrayDeep(root, keyOrder, preferNonEmpty, depth) {
  if (depth > 5 || root == null) return null;
  if (Array.isArray(root)) return root.length > 0 || !preferNonEmpty ? root : null;
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

function extractPropertyArrayRest(raw) {
  const KEYS = ["properties", "publications", "listings", "items", "results", "rows", "list"];
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
  return [];
}

function extractUsersArray(raw) {
  const KEYS = ["users", "data", "items", "results", "rows", "list"];
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
  return [];
}

function normalizeBase(raw) {
  return (raw || DEFAULT_API_BASE).replace(/\/+$/, "");
}

function pickTokenFromLoginResponse(raw) {
  if (typeof raw === "string" && raw.length > 8) return raw.trim();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const data = raw.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const at = data.access_token;
    if (typeof at === "string" && at.length > 8) return at.trim();
  }
  for (const k of ["access_token", "accessToken", "token", "jwt"]) {
    const v = raw[k];
    if (typeof v === "string" && v.length > 8) return v;
  }
  return null;
}

async function resolveRestBearer() {
  const ntok = trimEnv("KITEPROP_NETWORK_TOKEN");
  if (trimEnv("KITEPROP_NETWORK_TOKEN_AS_BEARER") === "1" && ntok) {
    return { ok: true, bearer: ntok };
  }
  const user = trimEnv("KITEPROP_API_USER");
  const pass = trimEnv("KITEPROP_API_PASSWORD");
  if (user && pass) {
    const loginPath = (trimEnv("KITEPROP_AUTH_LOGIN_PATH") || "auth/login").replace(/^\/+/, "");
    const uf = trimEnv("KITEPROP_AUTH_LOGIN_USER_FIELD") || "email";
    const pf = trimEnv("KITEPROP_AUTH_LOGIN_PASSWORD_FIELD") || "password";
    const base = normalizeBase(trimEnv("KITEPROP_API_BASE_URL"));
    const loginUrl = `${base}/${loginPath}`;
    const loginRes = await fetchJson("POST", loginUrl, { body: { [uf]: user, [pf]: pass } });
    if (!loginRes.ok) return { ok: false, error: `login HTTP ${loginRes.status}` };
    const token = pickTokenFromLoginResponse(loginRes.data);
    if (!token) return { ok: false, error: "TOKEN_NOT_FOUND_IN_RESPONSE" };
    return { ok: true, bearer: token };
  }
  const bearer =
    trimEnv("KITEPROP_ACCESS_TOKEN") || trimEnv("KITEPROP_API_SECRET") || trimEnv("KITEPROP_API_TOKEN");
  if (bearer) return { ok: true, bearer };
  return { ok: false, error: "MISSING_AUTH (KITEPROP_API_USER+PASSWORD o ACCESS_TOKEN/API_SECRET)" };
}

function restHeaders(bearer) {
  const h = { Authorization: `Bearer ${bearer}` };
  if (trimEnv("KITEPROP_REST_BEARER_WITH_API_KEY") === "1") {
    const key = trimEnv("KITEPROP_API_KEY") || trimEnv("KITEPROP_API_SECRET");
    if (key) h["X-API-Key"] = key;
  }
  return h;
}

function pickNumber(obj, keys) {
  for (const k of keys) {
    const v = obj[k];
    if (v === undefined || v === null) continue;
    const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
    if (!Number.isFinite(n)) continue;
    return n;
  }
  return null;
}

function pickPositiveInt(o, keys) {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) return Math.floor(v);
    if (typeof v === "string" && /^\d+$/.test(v.trim())) return parseInt(v.trim(), 10);
  }
  return null;
}

function paginationHintFromObject(o) {
  const last = pickPositiveInt(o, ["last_page", "lastPage", "last"]);
  const cur = pickPositiveInt(o, ["current_page", "currentPage", "page"]);
  const per = pickPositiveInt(o, ["per_page", "perPage", "limit"]);
  const total = pickPositiveInt(o, ["total", "total_count", "totalCount"]);
  if (last != null && cur != null) {
    return { currentPage: cur, lastPage: last, perPage: per, total };
  }
  if (total != null && per != null && cur != null) {
    return { currentPage: cur, lastPage: Math.max(1, Math.ceil(total / per)), perPage: per, total };
  }
  return null;
}

/** Igual criterio que `scripts/network-ingest-verify.mjs` para cortar páginas. */
function extractPaginationHint(raw) {
  const u = unwrapSuccessData(raw);
  const roots = [u, raw].filter((x) => x != null);
  for (const root of roots) {
    if (!root || typeof root !== "object" || Array.isArray(root)) continue;
    let h = paginationHintFromObject(root);
    if (h) return h;
    const meta = root.meta;
    if (meta && typeof meta === "object" && !Array.isArray(meta)) {
      h = paginationHintFromObject(meta);
      if (h) return h;
    }
    const nested = root.data;
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      h = paginationHintFromObject(nested);
      if (h) return h;
    }
  }
  return null;
}

function stablePropertyIdFromRaw(raw) {
  const flat = coerceProp(raw);
  if (!flat || typeof flat !== "object" || Array.isArray(flat)) return null;
  let idNum =
    pickNumber(flat, [
      "id",
      "ID",
      "property_id",
      "propertyId",
      "listing_id",
      "listingId",
      "codigo",
      "external_id",
      "externalId",
    ]) ?? 0;
  if (!idNum) {
    for (const k of ["id", "property_id", "propertyId", "listing_id", "listingId"]) {
      const v = flat[k];
      if (typeof v === "string" && /^\d+$/.test(v.trim())) {
        idNum = parseInt(v.trim(), 10);
        break;
      }
    }
  }
  if (!idNum) return null;
  return String(Math.round(idNum));
}

function stableUserIdFromRaw(raw) {
  if (!isRecord(raw)) return null;
  const id = raw.id ?? raw.user_id ?? raw.userId;
  if (typeof id === "number" && Number.isFinite(id)) return `u:${Math.round(id)}`;
  if (typeof id === "string" && id.trim()) return `u:${id.trim()}`;
  const e = raw.email;
  if (typeof e === "string" && e.includes("@")) return `e:${e.trim().toLowerCase()}`;
  return null;
}

function stableOrgIdFromRaw(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  for (const k of ["id", "organization_id", "organizationId", "uuid", "slug"]) {
    const v = raw[k];
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

const REST_MAX_PAGES = Math.min(
  500,
  Math.max(1, parseInt(trimEnv("CATALOG_PROBE_REST_MAX_PAGES") || "500", 10) || 500),
);

/**
 * @param {"properties"|"users"} kind
 */
async function fetchRestAllPages(base, bearer, kind) {
  const pathBase = kind === "users" ? "/users" : "/properties";
  const extract = kind === "users" ? extractUsersArray : extractPropertyArrayRest;
  const stableId = kind === "users" ? stableUserIdFromRaw : stablePropertyIdFromRaw;

  const merged = [];
  const seen = new Set();
  let lastStatus = null;
  let lastHint = null;
  let pagesFetched = 0;

  for (let page = 1; page <= REST_MAX_PAGES; page++) {
    const pathWithQuery = `${pathBase}?page=${page}&limit=${REST_PAGE_LIMIT}`;
    const url = `${base}${pathWithQuery}`;
    const res = await fetchJson("GET", url, { headers: restHeaders(bearer) });
    if (!res.ok) {
      if (page === 1) {
        return {
          ok: false,
          status: res.status,
          items: [],
          pagesFetched: 0,
          lastHint: null,
          error: res.error || `HTTP ${res.status}`,
        };
      }
      break;
    }
    pagesFetched = page;
    lastStatus = res.status;
    const pageItems = res.data != null ? extract(res.data) : [];
    lastHint = res.data != null ? extractPaginationHint(res.data) : null;
    let newlyAdded = 0;
    for (const raw of pageItems) {
      const sid = stableId(raw);
      if (sid) {
        if (seen.has(sid)) continue;
        seen.add(sid);
      }
      merged.push(raw);
      newlyAdded += 1;
    }
    if (pageItems.length === 0) break;
    if (lastHint?.lastPage != null && lastHint.currentPage >= lastHint.lastPage) break;
    if (pageItems.length < REST_PAGE_LIMIT) break;
    if (newlyAdded === 0) break;
  }

  return {
    ok: true,
    status: lastStatus,
    items: merged,
    pagesFetched,
    lastHint,
    distinctIds: seen.size,
  };
}

async function probeRestPropertiesAll() {
  const auth = await resolveRestBearer();
  console.log("\n========== 2) REST GET /properties (todas las páginas) ==========");
  if (!auth.ok) {
    console.log("Omitido:", auth.error);
    runStats.restPropertiesAll = { ok: false, nota: auth.error };
    return;
  }
  const base = normalizeBase(trimEnv("KITEPROP_API_BASE_URL"));
  console.log("GET /properties", `limit=${REST_PAGE_LIMIT} por página`, `máx. páginas=${REST_MAX_PAGES}`);
  const r = await fetchRestAllPages(base, auth.bearer, "properties");
  if (!r.ok) {
    console.log("HTTP/error:", r.status, r.error || "");
    runStats.restPropertiesAll = { ok: false, http: r.status, totalItems: 0, pagesFetched: r.pagesFetched, nota: r.error };
    return;
  }
  const sample = r.items.slice(0, 5).map((raw, i) => ({
    i: i + 1,
    title: pickTitle(raw) || pickTitle(coerceProp(raw)) || "(sin título)",
  }));
  console.log("HTTP última página OK:", r.status);
  console.log("Páginas recorridas:", r.pagesFetched, "| ítems acumulados (dedupe por id estable):", r.items.length);
  console.log("Muestra (hasta 5):", JSON.stringify(sample, null, 2));
  if (r.lastHint) console.log("Meta paginación (última respuesta):", JSON.stringify(r.lastHint));
  runStats.restPropertiesAll = {
    ok: true,
    http: r.status,
    totalItems: r.items.length,
    distinctStableIds: r.distinctIds,
    pagesFetched: r.pagesFetched,
    limitPerPage: REST_PAGE_LIMIT,
    paginacionUltima: r.lastHint,
  };
  console.log("── TOTAL REST /properties (todas las páginas) →", r.items.length, "fichas");
}

async function probeRestUsersAll() {
  const auth = await resolveRestBearer();
  console.log("\n========== 3) REST GET /users (todas las páginas; API usuarios) ==========");
  if (!auth.ok) {
    console.log("Omitido:", auth.error);
    runStats.restUsersAll = { ok: false, nota: auth.error };
    return;
  }
  const base = normalizeBase(trimEnv("KITEPROP_API_BASE_URL"));
  console.log("GET /users", `limit=${REST_PAGE_LIMIT} por página`, `máx. páginas=${REST_MAX_PAGES}`);
  const r = await fetchRestAllPages(base, auth.bearer, "users");
  if (!r.ok) {
    console.log("HTTP/error:", r.status, r.error || "");
    runStats.restUsersAll = { ok: false, http: r.status, totalItems: 0, pagesFetched: r.pagesFetched, nota: r.error };
    return;
  }
  const sample = r.items.slice(0, 5).map((raw, i) => ({
    i: i + 1,
    hint: isRecord(raw) ? (raw.email ? "email:…" : raw.id != null ? `id:${raw.id}` : "?") : "?",
  }));
  console.log("HTTP última página OK:", r.status);
  console.log("Páginas recorridas:", r.pagesFetched, "| ítems acumulados:", r.items.length);
  console.log("Muestra (hasta 5, sin PII):", JSON.stringify(sample, null, 2));
  runStats.restUsersAll = {
    ok: true,
    http: r.status,
    totalItems: r.items.length,
    distinctStableIds: r.distinctIds,
    pagesFetched: r.pagesFetched,
    limitPerPage: REST_PAGE_LIMIT,
    paginacionUltima: r.lastHint,
  };
  console.log("── TOTAL REST /users (todas las páginas) →", r.items.length, "usuarios");
}

function coerceProp(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const nested = raw.property ?? raw.listing ?? raw.listing_object ?? raw.detail;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return { ...nested, ...raw };
  }
  return raw;
}

function applyPathTemplate(template, networkId, networkToken) {
  let p = template;
  if (networkId) p = p.split("{networkId}").join(encodeURIComponent(networkId));
  if (networkToken) p = p.split("{networkToken}").join(encodeURIComponent(networkToken));
  return p;
}

function resolveNetworkPaths() {
  const id = trimEnv("KITEPROP_NETWORK_ID");
  const tok = trimEnv("KITEPROP_NETWORK_TOKEN");
  const customOrg = trimEnv("KITEPROP_NETWORK_ORGANIZATIONS_PATH");
  const customProp = trimEnv("KITEPROP_NETWORK_PROPERTIES_PATH");
  let orgPath = null;
  if (customOrg) orgPath = applyPathTemplate(customOrg, id, tok);
  else if (id && tok) orgPath = `/networks/${encodeURIComponent(id)}/${encodeURIComponent(tok)}/organizations`;
  let propPath = null;
  if (customProp) propPath = applyPathTemplate(customProp, id, tok);
  else if (id && tok) propPath = `/properties/network/${encodeURIComponent(id)}/${encodeURIComponent(tok)}`;
  return { orgPath, propPath };
}

function pathEmbedsToken(path, t) {
  if (!path || !t) return false;
  return path.includes(t) || path.includes(encodeURIComponent(t));
}

/** @param {"organizations"|"properties"|undefined} request */
function buildExtraHeaders(request, orgPath, propPath, nid, ntok, idHeader, tokHeader) {
  const paths =
    request === "organizations"
      ? [orgPath]
      : request === "properties"
        ? [propPath]
        : [orgPath, propPath].filter(Boolean);
  if (ntok && paths.some((p) => p && pathEmbedsToken(p, ntok))) return {};
  const extra = {};
  if (nid) extra[idHeader] = nid;
  if (ntok) extra[tokHeader] = ntok;
  return extra;
}

async function getNetJson(base, pathPart, bearer, extra, query) {
  let path = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;
  const sp = new URLSearchParams();
  if (query) for (const [k, v] of Object.entries(query)) if (v) sp.set(k, v);
  const q = sp.toString();
  if (q) path += (path.includes("?") ? "&" : "?") + q;
  const url = `${base}${path}`;
  return fetchJson("GET", url, {
    headers: { Authorization: `Bearer ${bearer}`, ...extra },
  });
}

async function resolveBearerForNetwork(orgPath, propPath) {
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
  const r = await resolveRestBearer();
  if (!r.ok) return r;
  const nid = trimEnv("KITEPROP_NETWORK_ID");
  const ntok2 = trimEnv("KITEPROP_NETWORK_TOKEN");
  return {
    ok: true,
    bearer: r.bearer,
    extra: buildExtraHeaders(
      undefined,
      orgPath,
      propPath,
      nid,
      ntok2,
      trimEnv("KITEPROP_NETWORK_ID_HEADER") || "X-Network-Id",
      trimEnv("KITEPROP_NETWORK_TOKEN_HEADER") || "X-Network-Token",
    ),
  };
}

function extractOrganizationArrayNet(raw) {
  const KEYS = ["organizations", "organization_list", "organizationList", "items", "results", "rows", "list"];
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
  return [];
}

function orgNameHint(raw) {
  if (!isRecord(raw)) return null;
  for (const k of ["name", "nombre", "legal_name", "business_name"]) {
    const v = raw[k];
    if (typeof v === "string" && v.trim()) return v.trim().slice(0, 60);
  }
  return null;
}

/** En el probe siempre paginamos (mismos límites/env que `network-ingest-verify.mjs` con PAGED_FETCH=1). */
async function fetchAllNetworkPropertiesProbe(base, propPath, bearer, propHeaders) {
  const rawLimit = parseInt(trimEnv("KITEPROP_NETWORK_PROPERTIES_PAGE_LIMIT") || "50", 10);
  const pageLimit = PAGE_LIMITS.has(rawLimit) ? rawLimit : 50;
  const maxPages = Math.min(
    1000,
    Math.max(1, parseInt(trimEnv("KITEPROP_NETWORK_PROPERTIES_MAX_PAGES") || "150", 10) || 150),
  );

  const merged = [];
  const seen = new Set();
  let lastOkStatus = null;
  let pagesFetched = 0;

  for (let page = 1; page <= maxPages; page += 1) {
    const propRes = await getNetJson(base, propPath, bearer, propHeaders, {
      status: "active",
      page: String(page),
      limit: String(pageLimit),
    });
    if (!propRes.ok) {
      if (page === 1) return { ok: false, http: propRes.status, items: [], pagesFetched: 0, error: propRes.error };
      break;
    }
    pagesFetched = page;
    lastOkStatus = propRes.status;
    const pageItems = extractPropertyArrayRest(propRes.data);
    const hint = extractPaginationHint(propRes.data);
    let newlyAdded = 0;
    for (const raw of pageItems) {
      const sid = stablePropertyIdFromRaw(raw);
      if (sid) {
        if (seen.has(sid)) continue;
        seen.add(sid);
      }
      merged.push(coerceProp(raw));
      newlyAdded += 1;
    }
    if (pageItems.length === 0) break;
    if (hint?.lastPage != null && hint.currentPage >= hint.lastPage) break;
    if (pageItems.length < pageLimit) break;
    if (newlyAdded === 0) break;
  }

  return {
    ok: true,
    http: lastOkStatus,
    items: merged,
    pagesFetched,
    distinctStableIds: seen.size,
    pageLimit,
  };
}

async function fetchAllNetworkOrganizationsProbe(base, orgPath, bearer, orgHeaders) {
  const rawLimit = parseInt(trimEnv("KITEPROP_NETWORK_ORGANIZATIONS_PAGE_LIMIT") || "50", 10);
  const pageLimit = PAGE_LIMITS.has(rawLimit) ? rawLimit : 50;
  const maxPages = Math.min(
    200,
    Math.max(1, parseInt(trimEnv("KITEPROP_NETWORK_ORGANIZATIONS_MAX_PAGES") || "20", 10) || 20),
  );

  const merged = [];
  const seen = new Set();
  let lastOkStatus = null;
  let pagesFetched = 0;

  for (let page = 1; page <= maxPages; page += 1) {
    const orgRes = await getNetJson(base, orgPath, bearer, orgHeaders, {
      page: String(page),
      limit: String(pageLimit),
    });
    if (!orgRes.ok) {
      if (page === 1) return { ok: false, http: orgRes.status, items: [], pagesFetched: 0, error: orgRes.error };
      break;
    }
    pagesFetched = page;
    lastOkStatus = orgRes.status;
    const pageItems = extractOrganizationArrayNet(orgRes.data);
    const hint = extractPaginationHint(orgRes.data);
    let newlyAdded = 0;
    for (const raw of pageItems) {
      const sid = stableOrgIdFromRaw(raw);
      if (sid) {
        if (seen.has(sid)) continue;
        seen.add(sid);
      }
      merged.push(raw);
      newlyAdded += 1;
    }
    if (pageItems.length === 0) break;
    if (hint?.lastPage != null && hint.currentPage >= hint.lastPage) break;
    if (pageItems.length < pageLimit) break;
    if (newlyAdded === 0) break;
  }

  return {
    ok: true,
    http: lastOkStatus,
    items: merged,
    pagesFetched,
    distinctStableIds: seen.size,
    pageLimit,
  };
}

async function probeNetwork() {
  console.log("\n========== 4) API RED (propiedades + organizaciones / «socios» institucionales) ==========");
  const { orgPath, propPath } = resolveNetworkPaths();
  if (!orgPath || !propPath) {
    console.log("Omitido: definí KITEPROP_NETWORK_ID + KITEPROP_NETWORK_TOKEN (o paths custom).");
    runStats.network = { omitido: true, nota: "falta NETWORK_ID/TOKEN o paths" };
    return;
  }
  const auth = await resolveBearerForNetwork(orgPath, propPath);
  if (!auth.ok) {
    console.log("Auth:", auth.error || "falló");
    runStats.network = { ok: false, nota: auth.error || "auth" };
    return;
  }
  const base = normalizeBase(trimEnv("KITEPROP_API_BASE_URL"));
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

  const rawPropLim = parseInt(trimEnv("KITEPROP_NETWORK_PROPERTIES_PAGE_LIMIT") || "50", 10);
  const rawOrgLim = parseInt(trimEnv("KITEPROP_NETWORK_ORGANIZATIONS_PAGE_LIMIT") || "50", 10);
  const effPropLim = PAGE_LIMITS.has(rawPropLim) ? rawPropLim : 50;
  const effOrgLim = PAGE_LIMITS.has(rawOrgLim) ? rawOrgLim : 50;
  console.log("Paginación completa (probe): propiedades limit/req =", effPropLim, "| organizaciones limit/req =", effOrgLim);

  const [propOut, orgOut] = await Promise.all([
    fetchAllNetworkPropertiesProbe(base, propPath, auth.bearer, propHeaders),
    fetchAllNetworkOrganizationsProbe(base, orgPath, auth.bearer, orgHeaders),
  ]);

  const props = propOut.ok ? propOut.items : [];
  const orgs = orgOut.ok ? orgOut.items : [];

  console.log(
    "Propiedades red — HTTP:",
    propOut.http,
    "páginas:",
    propOut.pagesFetched,
    "total ítems:",
    props.length,
    propOut.ok ? "" : `(error: ${propOut.error || "?"})`,
  );
  console.log(
    "Muestra títulos:",
    JSON.stringify(props.slice(0, 5).map((r, i) => ({ i: i + 1, title: pickTitle(r) || "?" })), null, 2),
  );
  console.log(
    "Organizaciones red — HTTP:",
    orgOut.http,
    "páginas:",
    orgOut.pagesFetched,
    "total filas:",
    orgs.length,
    orgOut.ok ? "" : `(error: ${orgOut.error || "?"})`,
  );
  console.log(
    "Muestra nombres (org):",
    JSON.stringify(orgs.slice(0, 5).map((r, i) => ({ i: i + 1, name: orgNameHint(r) || "?" })), null, 2),
  );

  const distinctOrg = new Set(orgs.map((r) => (isRecord(r) ? stableOrgIdFromRaw(r) : null)).filter(Boolean));

  runStats.network = {
    ok: propOut.ok && orgOut.ok,
    httpPropiedades: propOut.http ?? null,
    httpOrganizaciones: orgOut.http ?? null,
    propiedades: props.length,
    propiedadesPaginas: propOut.pagesFetched,
    propiedadesDistinctStableIds: propOut.ok ? propOut.distinctStableIds : null,
    organizacionesFilas: orgs.length,
    organizacionesPaginas: orgOut.pagesFetched,
    organizacionesIdsDistintos: distinctOrg.size,
    nota:
      "Probe recorre todas las páginas (dedupe por id estable). Ajustá KITEPROP_NETWORK_*_MAX_PAGES / *_PAGE_LIMIT si corta antes.",
  };
  console.log(
    "── TOTAL API red → propiedades:",
    props.length,
    "| organizaciones (filas acumuladas):",
    orgs.length,
    "| ids org detectados:",
    distinctOrg.size,
  );
}

async function main() {
  console.log("Redalia — catalog:sources-probe —", new Date().toISOString());
  await probeJsonFeed();

  if (trimEnv("CATALOG_PROBE_JSON_ONLY") === "1") {
    console.log("\n(CATALOG_PROBE_JSON_ONLY=1: omitiendo REST y red.)");
    console.log("\n========== RESUMEN TOTALES (esta corrida) ==========");
    console.log(JSON.stringify(runStats, null, 2));
    process.exit(0);
  }

  await probeRestPropertiesAll();
  await probeRestUsersAll();

  await probeNetwork();

  console.log("\n========== RESUMEN TOTALES (esta corrida) ==========");
  console.log(JSON.stringify(runStats, null, 2));
  console.log(
    "Leyenda: «inmobiliarias» en JSON = agencias distintas en el feed. En red, «organizaciones» = endpoint de orgs (directorio institucional merge); no es el mismo conteo que agencias del JSON.",
  );

  console.log("\n========== Notas ==========");
  console.log("- Directorio «Socios» en la web se deriva del JSON o de extras de red (merge); no es el mismo shape que GET /users.");
  console.log("- Ingest estricto de red: npm run verify:network-ingest");
  console.log("- Auditoría shape (server): GET /api/test-kiteprop-network-audit con KITEPROP_NETWORK_AUDIT_ENABLED=1");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
