import "server-only";

import {
  resolveProfileXApiKeyOrNull,
  resolveRestBearerTokenOrNull,
} from "@/lib/kiteprop/env-credentials";

const DEFAULT_BASE_URL = "https://www.kiteprop.com/api/v1";
const DEFAULT_TIMEOUT_MS = 15_000;

function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
}

export function getKitePropApiBaseUrl(): string {
  const fromEnv = process.env.KITEPROP_API_BASE_URL?.trim();
  return normalizeBaseUrl(fromEnv || DEFAULT_BASE_URL);
}

/** Solo para uso en este módulo y en funciones server-side que llaman al cliente. */
export function getKitePropApiKeyOrNull(): string | null {
  return resolveProfileXApiKeyOrNull();
}

/**
 * Token Bearer documentado para varios endpoints v1 (p. ej. `GET /users`, `GET /properties`).
 * Si no hay `KITEPROP_ACCESS_TOKEN`, se usa `KITEPROP_API_SECRET` (misma secret que el perfil, otro header).
 * No exponer en cliente ni en respuestas HTTP públicas.
 */
export function getKitePropBearerTokenOrNull(): string | null {
  return resolveRestBearerTokenOrNull();
}

export type KitepropGetAuth = "api_key" | "bearer" | "bearer_with_api_key" | "none";

export type KitepropClientErrorCode =
  | "MISSING_KEY"
  | "MISSING_BEARER"
  | "TIMEOUT"
  | "NETWORK"
  | "HTTP_ERROR"
  | "INVALID_JSON";

export type KitepropJsonResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number | null; errorCode: KitepropClientErrorCode };

export type KitepropGetJsonOptions = {
  /** `api_key` (default): header `X-API-Key` — usado en `GET /profile` en integración actual. `bearer`: header `Authorization: Bearer …` según docs públicas para otros recursos. */
  auth?: KitepropGetAuth;
  /** Cabeceras extra (p. ej. id/token de red); nunca incluir secretos en logs. */
  extraHeaders?: Record<string, string>;
  /** Si `auth === "bearer"`, usa este token en lugar del Bearer de variables de entorno. */
  bearerOverride?: string | null;
  /** Query string (p. ej. `status: "active"` en red AINA / properties). */
  query?: Record<string, string | undefined>;
};

/**
 * GET JSON contra la API REST de KiteProp (server-only).
 * No registra la API key, token ni cuerpos de respuesta en consola.
 */
function applyExtraHeaders(
  headers: Record<string, string>,
  extra?: Record<string, string>,
): void {
  if (!extra) return;
  for (const [k, v] of Object.entries(extra)) {
    if (k.trim() && v) headers[k.trim()] = v;
  }
}

function appendQueryString(
  pathPart: string,
  query?: Record<string, string | undefined>,
): string {
  if (!query) return pathPart;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "") sp.set(k, v);
  }
  const q = sp.toString();
  if (!q) return pathPart;
  return pathPart.includes("?") ? `${pathPart}&${q}` : `${pathPart}?${q}`;
}

export async function kitepropGetJson<T = unknown>(
  path: string,
  options?: KitepropGetJsonOptions,
): Promise<KitepropJsonResult<T>> {
  const auth: KitepropGetAuth = options?.auth ?? "api_key";

  const headers: Record<string, string> = { Accept: "application/json" };
  applyExtraHeaders(headers, options?.extraHeaders);

  if (auth === "api_key") {
    const apiKey = getKitePropApiKeyOrNull();
    if (!apiKey) {
      return { ok: false, status: null, errorCode: "MISSING_KEY" };
    }
    headers["X-API-Key"] = apiKey;
  } else if (auth === "bearer") {
    const token = options?.bearerOverride?.trim() || getKitePropBearerTokenOrNull();
    if (!token) {
      return { ok: false, status: null, errorCode: "MISSING_BEARER" };
    }
    headers.Authorization = `Bearer ${token}`;
  } else if (auth === "bearer_with_api_key") {
    let token = options?.bearerOverride?.trim() || null;
    if (!token) {
      const { resolveRestBearerFromEnvOrPasswordLogin } = await import(
        "@/lib/kiteprop/resolve-rest-bearer"
      );
      const resolved = await resolveRestBearerFromEnvOrPasswordLogin();
      if (!resolved.ok) {
        return { ok: false, status: null, errorCode: "MISSING_BEARER" };
      }
      token = resolved.token;
    }
    const apiKey = getKitePropApiKeyOrNull();
    if (!apiKey) {
      return { ok: false, status: null, errorCode: "MISSING_KEY" };
    }
    headers.Authorization = `Bearer ${token}`;
    headers["X-API-Key"] = apiKey;
  } else {
    return { ok: false, status: null, errorCode: "MISSING_KEY" };
  }

  const base = getKitePropApiBaseUrl();
  const pathPart = appendQueryString(path.startsWith("/") ? path : `/${path}`, options?.query);
  const url = `${base}${pathPart}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers,
      cache: "no-store",
    });

    const text = await res.text();

    if (!res.ok) {
      return { ok: false, status: res.status, errorCode: "HTTP_ERROR" };
    }

    if (!text.trim()) {
      return { ok: false, status: res.status, errorCode: "INVALID_JSON" };
    }

    try {
      const data = JSON.parse(text) as T;
      return { ok: true, status: res.status, data };
    } catch {
      return { ok: false, status: res.status, errorCode: "INVALID_JSON" };
    }
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return { ok: false, status: null, errorCode: "TIMEOUT" };
    }
    return { ok: false, status: null, errorCode: "NETWORK" };
  } finally {
    clearTimeout(timeoutId);
  }
}

export type KitepropPostJsonOptions = {
  auth?: Extract<KitepropGetAuth, "api_key" | "bearer" | "none">;
  extraHeaders?: Record<string, string>;
  bearerOverride?: string | null;
};

/**
 * POST JSON contra la API REST de KiteProp (server-only). Misma base URL y timeout que GET.
 */
export async function kitepropPostJson<T = unknown>(
  path: string,
  body: unknown,
  options?: KitepropPostJsonOptions,
): Promise<KitepropJsonResult<T>> {
  const auth: KitepropGetAuth = options?.auth ?? "none";

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  applyExtraHeaders(headers, options?.extraHeaders);

  if (auth === "api_key") {
    const apiKey = getKitePropApiKeyOrNull();
    if (!apiKey) {
      return { ok: false, status: null, errorCode: "MISSING_KEY" };
    }
    headers["X-API-Key"] = apiKey;
  } else if (auth === "bearer") {
    const token = options?.bearerOverride?.trim() || getKitePropBearerTokenOrNull();
    if (!token) {
      return { ok: false, status: null, errorCode: "MISSING_BEARER" };
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const base = getKitePropApiBaseUrl();
  const pathPart = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${pathPart}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers,
      body: JSON.stringify(body ?? {}),
      cache: "no-store",
    });

    const text = await res.text();

    if (!res.ok) {
      return { ok: false, status: res.status, errorCode: "HTTP_ERROR" };
    }

    if (!text.trim()) {
      return { ok: false, status: res.status, errorCode: "INVALID_JSON" };
    }

    try {
      const data = JSON.parse(text) as T;
      return { ok: true, status: res.status, data };
    } catch {
      return { ok: false, status: res.status, errorCode: "INVALID_JSON" };
    }
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return { ok: false, status: null, errorCode: "TIMEOUT" };
    }
    return { ok: false, status: null, errorCode: "NETWORK" };
  } finally {
    clearTimeout(timeoutId);
  }
}
