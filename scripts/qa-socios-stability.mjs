#!/usr/bin/env node

import { createHash } from "node:crypto";

const baseUrl = (process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const paths = ["/socios", "/socios?page=2", "/socios?page=10", "/socios?page=13"];
const rounds = 5;

function hashHex(value) {
  return createHash("sha256").update(value).digest("hex");
}

function extractSocioSlugs(html) {
  const re = /href="\/socios\/([^"/?#]+)"/g;
  const out = [];
  const seen = new Set();
  let m;
  while ((m = re.exec(html)) !== null) {
    const slug = decodeURIComponent(m[1]);
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push(slug);
  }
  return out;
}

async function fetchHtml(pathname) {
  const startedAt = Date.now();
  const res = await fetch(`${baseUrl}${pathname}`, {
    headers: {
      "user-agent": "Mozilla/5.0 Redalia QA Stability",
      accept: "text/html,application/xhtml+xml",
      "accept-language": "es-CL,es;q=0.9",
    },
    redirect: "follow",
  });
  const html = await res.text();
  return {
    status: res.status,
    durationMs: Date.now() - startedAt,
    html,
  };
}

async function run() {
  const page1Samples = [];
  const page1Hashes = [];
  const page1Counts = [];

  for (let i = 0; i < rounds; i += 1) {
    const { status, html } = await fetchHtml("/socios");
    const slugs = extractSocioSlugs(html).slice(0, 40);
    const signature = hashHex(slugs.join("|"));
    page1Samples.push({ attempt: i + 1, status, first40: slugs });
    page1Hashes.push(signature);
    page1Counts.push(slugs.length);
  }

  const extras = {};
  for (const p of paths.slice(1)) {
    const { status, html, durationMs } = await fetchHtml(p);
    const slugs = extractSocioSlugs(html).slice(0, 40);
    extras[p] = {
      status,
      durationMs,
      count: slugs.length,
      hash: hashHex(slugs.join("|")),
    };
  }

  const stable = page1Hashes.every((h) => h === page1Hashes[0]) && page1Counts.every((c) => c === page1Counts[0]);
  console.log(
    JSON.stringify(
      {
        baseUrl,
        stable,
        page1Hashes,
        page2Hash: extras["/socios?page=2"]?.hash ?? null,
        page10Hash: extras["/socios?page=10"]?.hash ?? null,
        page13Hash: extras["/socios?page=13"]?.hash ?? null,
        counts: {
          page1: page1Counts,
          page2: extras["/socios?page=2"]?.count ?? 0,
          page10: extras["/socios?page=10"]?.count ?? 0,
          page13: extras["/socios?page=13"]?.count ?? 0,
        },
        samples: page1Samples,
      },
      null,
      2,
    ),
  );

  if (!stable) process.exitCode = 1;
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
