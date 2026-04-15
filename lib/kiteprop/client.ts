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

export type KitepropClientErrorCode =
  | "MISSING_KEY"
  | "TIMEOUT"
  | "NETWORK"
  | "HTTP_ERROR"
  | "INVALID_JSON";

export type KitepropJsonResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number | null; errorCode: KitepropClientErrorCode };

/**
 * GET JSON contra la API REST de KiteProp (server-only).
 * No registra la API key ni cuerpos de respuesta en consola.
 */
export async function kitepropGetJson<T = unknown>(path: string): Promise<KitepropJsonResult<T>> {
  const apiKey = getKitePropApiKeyOrNull();
  if (!apiKey) {
    return { ok: false, status: null, errorCode: "MISSING_KEY" };
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
      headers: {
        Accept: "application/json",
        "X-API-Key": apiKey,
      },
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
