#!/usr/bin/env node
/**
 * Llama a GET /api/test-kiteprop-network-audit contra un Next en ejecución.
 * Requiere: servidor local (o URL) con KITEPROP_NETWORK_AUDIT_ENABLED=1 y credenciales cargadas en el proceso Next.
 *
 * Uso:
 *   npm run dev   # otra terminal
 *   node scripts/kiteprop-network-audit.mjs
 *   AUDIT_BASE_URL=https://tu-preview.vercel.app node scripts/kiteprop-network-audit.mjs
 */

const base = (process.env.AUDIT_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const url = `${base}/api/test-kiteprop-network-audit`;

const res = await fetch(url, { headers: { Accept: "application/json" } });
const text = await res.text();
let body;
try {
  body = JSON.parse(text);
} catch {
  body = text;
}
console.log(JSON.stringify({ httpStatus: res.status, body }, null, 2));
if (!res.ok) process.exitCode = 1;
