import "server-only";

import { kitepropPostJson } from "@/lib/kiteprop/client";
import {
  getKitepropApiPasswordOrNull,
  getKitepropApiUserOrNull,
  getKitepropAuthLoginPath,
  getKitepropLoginPasswordField,
  getKitepropLoginUserField,
} from "@/lib/kiteprop-network/network-env";
import { readCachedLoginBearer, writeCachedLoginBearer } from "@/lib/kiteprop-network/token-cache";
import { unwrapKitepropSuccessData } from "@/lib/kiteprop/unwrap-envelope";

function pickTokenFromObject(o: Record<string, unknown>, depth: number): string | null {
  if (depth < 0) return null;
  const direct = ["access_token", "accessToken", "token", "jwt", "bearerToken"] as const;
  for (const k of direct) {
    const v = o[k];
    if (typeof v === "string" && v.length > 8) return v;
  }
  const nestedKeys = ["data", "auth", "session", "result"] as const;
  for (const k of nestedKeys) {
    const v = o[k];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const t = pickTokenFromObject(v as Record<string, unknown>, depth - 1);
      if (t) return t;
    }
  }
  return null;
}

function extractAccessToken(raw: unknown): string | null {
  if (typeof raw === "string" && raw.length > 8) return raw.trim();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const fromEnvelope = unwrapKitepropSuccessData(raw);
  if (fromEnvelope && typeof fromEnvelope === "object" && !Array.isArray(fromEnvelope)) {
    const t = pickTokenFromObject(fromEnvelope as Record<string, unknown>, 4);
    if (t) return t;
  }
  return pickTokenFromObject(o, 4);
}

/**
 * POST login (sin Bearer previo). Usa `KITEPROP_API_USER` / `KITEPROP_API_PASSWORD` y paths/campos configurables.
 * Cachea el Bearer en memoria del proceso (`token-cache`).
 */
export async function kitepropLoginForNetworkBearer(): Promise<
  { ok: true; token: string } | { ok: false; error: string }
> {
  const cached = readCachedLoginBearer();
  if (cached) return { ok: true, token: cached };

  const user = getKitepropApiUserOrNull();
  const pass = getKitepropApiPasswordOrNull();
  if (!user || !pass) {
    return { ok: false, error: "MISSING_LOGIN_CREDENTIALS" };
  }

  const path = getKitepropAuthLoginPath().replace(/^\/+/, "");
  const uf = getKitepropLoginUserField();
  const pf = getKitepropLoginPasswordField();
  const body: Record<string, string> = {
    [uf]: user,
    [pf]: pass,
  };

  const res = await kitepropPostJson<unknown>(path.startsWith("/") ? path : `/${path}`, body, {
    auth: "none",
  });

  if (!res.ok) {
    return { ok: false, error: res.errorCode };
  }

  const token = extractAccessToken(res.data);
  if (!token) {
    return { ok: false, error: "TOKEN_NOT_FOUND_IN_RESPONSE" };
  }

  writeCachedLoginBearer(token);
  return { ok: true, token };
}
