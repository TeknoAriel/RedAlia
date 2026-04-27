#!/usr/bin/env node

const baseUrl = (process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const routes = ["/socios", "/socios?page=2", "/propiedades", "/propiedades?page=2"];
const rounds = 5;

function percentile95(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[idx];
}

async function probe(route) {
  const samples = [];
  for (let i = 0; i < rounds; i += 1) {
    const startedAt = Date.now();
    const res = await fetch(`${baseUrl}${route}`, {
      headers: {
        "user-agent": "Mozilla/5.0 Redalia QA Performance",
        accept: "text/html,application/xhtml+xml",
        "accept-language": "es-CL,es;q=0.9",
      },
      redirect: "follow",
    });
    const html = await res.text();
    const durationMs = Date.now() - startedAt;
    samples.push({
      status: res.status,
      durationMs,
      htmlBytes: Buffer.byteLength(html, "utf8"),
      redirected: res.redirected,
      contentType: res.headers.get("content-type") || "",
    });
  }
  const durations = samples.map((s) => s.durationMs);
  const max = Math.max(...durations);
  return {
    route,
    samples,
    stats: {
      min: Math.min(...durations),
      max,
      avg: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      p95: percentile95(durations),
    },
    warnings: [
      ...(samples.some((s) => s.durationMs > 3000) ? ["slow_request_over_3000ms"] : []),
      ...(max > 10000 ? ["critical_request_over_10000ms"] : []),
    ],
  };
}

async function run() {
  const results = [];
  for (const route of routes) {
    results.push(await probe(route));
  }
  console.log(
    JSON.stringify(
      {
        baseUrl,
        rounds,
        results,
      },
      null,
      2,
    ),
  );
}

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
