import "server-only";

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
  const key = process.env.KITEPROP_API_KEY?.trim();
  return key || null;
}

/**
 * Token Bearer documentado para varios endpoints v1 (p. ej. `GET /users`, `GET /properties`).
 * No exponer en cliente ni en respuestas HTTP públicas.
 */
export function getKitePropBearerTokenOrNull(): string | null {
  const t = process.env.KITEPROP_ACCESS_TOKEN?.trim();
  return t || null;
}

export type KitepropGetAuth = "api_key" | "bearer";

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
};

/**
 * GET JSON contra la API REST de KiteProp (server-only).
 * No registra la API key, token ni cuerpos de respuesta en consola.
 */
export async function kitepropGetJson<T = unknown>(
  path: string,
  options?: KitepropGetJsonOptions,
): Promise<KitepropJsonResult<T>> {
  const auth: KitepropGetAuth = options?.auth ?? "api_key";

  const headers: Record<string, string> = { Accept: "application/json" };

  if (auth === "api_key") {
    const apiKey = getKitePropApiKeyOrNull();
    if (!apiKey) {
      return { ok: false, status: null, errorCode: "MISSING_KEY" };
    }
    headers["X-API-Key"] = apiKey;
  } else {
    const token = getKitePropBearerTokenOrNull();
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
