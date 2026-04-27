/**
 * Cliente mínimo Upstash Redis REST (sin dependencia npm).
 * Variables: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
 */

function baseUrl(): string | null {
  const u = process.env.UPSTASH_REDIS_REST_URL?.trim();
  return u || null;
}

function token(): string | null {
  const t = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
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

export async function upstashSet(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
  const b = baseUrl();
  const tok = token();
  if (!b || !tok) return false;
  const base = b.replace(/\/$/, "");
  const ttl = ttlSeconds && ttlSeconds > 0 ? ttlSeconds : undefined;
  /** Pipeline evita límites de path en valores JSON grandes (Upstash REST). */
  const cmd: string[] = ttl ? ["SET", key, value, "EX", String(ttl)] : ["SET", key, value];
  const r = await fetch(`${base}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tok}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([cmd]),
    next: { revalidate: 0 },
  });
  return r.ok;
}

export async function upstashDel(key: string): Promise<boolean> {
  const b = baseUrl();
  const tok = token();
  if (!b || !tok) return false;
  const url = `${b.replace(/\/$/, "")}/del/${encodeURIComponent(key)}`;
  const r = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${tok}` },
    next: { revalidate: 0 },
  });
  return r.ok;
}
