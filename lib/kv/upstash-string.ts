/**
 * Cliente mínimo Upstash Redis REST (sin dependencia npm).
 * Variables: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
 */

function baseUrl(): string | null {
  const u =
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.KV_REST_API_URL?.trim() ||
    process.env.KV_URL?.trim();
  return u || null;
}

function token(): string | null {
  const t =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.KV_REST_API_TOKEN?.trim();
  return t || null;
}

export function isUpstashRedisConfigured(): boolean {
  return Boolean(baseUrl() && token());
}

export async function upstashGet(key: string): Promise<string | null> {
  const b = baseUrl();
  const tok = token();
  if (!b || !tok) return null;
  const url = `${b.replace(/\/$/, "")}/get/${encodeURIComponent(key)}`;
  const r = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${tok}` },
    next: { revalidate: 0 },
  });
  if (!r.ok) return null;
  const j = (await r.json()) as { result: string | null };
  return j?.result ?? null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * SET con TTL. Reintenta ante 429/5xx y valores grandes (límite REST ~1 MB).
 * Usa pipeline para no meter el JSON en el path URL.
 */
export async function upstashSet(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
  const b = baseUrl();
  const tok = token();
  if (!b || !tok) return false;
  const base = b.replace(/\/$/, "");
  const ttl = ttlSeconds && ttlSeconds > 0 ? ttlSeconds : undefined;
  const cmd: string[] = ttl ? ["SET", key, value, "EX", String(ttl)] : ["SET", key, value];

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(`${base}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tok}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([cmd]),
        next: { revalidate: 0 },
      });
      const text = await r.text();
      if (r.ok) {
        try {
          const j = JSON.parse(text) as Array<{ result?: unknown; error?: string }>;
          const first = Array.isArray(j) ? j[0] : null;
          if (first && typeof first === "object" && first.error) {
            if (/plan limits|max requests|quota/i.test(String(first.error))) return false;
            if (attempt < 3) {
              await sleep(200 * (attempt + 1));
              continue;
            }
            return false;
          }
        } catch {
          /* body no JSON: si HTTP ok, asumir OK */
        }
        return true;
      }
      // Fixed plan / cuota: no reintentar (403 con mensaje de límites).
      if (r.status === 403 && /plan limits|upgrade|quota/i.test(text)) return false;
      if ((r.status === 429 || r.status >= 500) && attempt < 3) {
        await sleep(300 * (attempt + 1));
        continue;
      }
      return false;
    } catch {
      if (attempt < 3) {
        await sleep(300 * (attempt + 1));
        continue;
      }
      return false;
    }
  }
  return false;
}
