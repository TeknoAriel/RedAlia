#!/usr/bin/env node
/**
 * Comprueba si en el feed JSON aparecen nombres de socios (agency / advertiser).
 *
 * Uso:
 *   node scripts/audit-feed-socios.mjs ./ruta/export.json
 *   KITEPROP_PROPERTIES_URL=https://... node scripts/audit-feed-socios.mjs
 *
 * También: npm run audit:feed-socios -- ./data/kiteprop-sample.json
 */

import { readFile } from "fs/promises";
import { resolve } from "path";

const NEEDLES = [
  "todo propiedades",
  "hgm propiedades",
  "paula quiroga",
  "haddad propiedades",
  "caper propiedades",
  "alliance",
  "meridiano 360",
  "piantini propiedades",
  "liu propiedades",
  "silva home",
  "atam propiedades",
  "iiman propiedades",
  "vyv propiedades",
  "mirna pro",
  "fabriq propiedades",
  "ralph propiedades",
  "sagari propiedades",
  "arcaya",
  "mvr propiedades",
  "hyz propiedades",
  "propiedades ok",
  "vyaok",
  "favreau",
  "mi espacio inmobiliario",
];

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const inner =
      payload.properties ??
      payload.data ??
      payload.items ??
      payload.results ??
      payload.publicaciones;
    if (Array.isArray(inner)) return inner;
  }
  return [];
}

function partnerNameFromField(v) {
  if (v == null) return null;
  if (typeof v === "string") {
    const s = v.trim();
    return s || null;
  }
  if (typeof v === "object" && !Array.isArray(v)) {
    const n = v.name ?? v.nombre ?? v.title ?? v.razon_social;
    if (typeof n === "string" && n.trim()) return n.trim();
  }
  return null;
}

function namesFromItem(item) {
  const out = new Set();
  if (!item || typeof item !== "object") return out;
  const keys = [
    "agency",
    "corredora",
    "inmobiliaria",
    "advertiser",
    "anunciante",
    "socio",
    "publisher",
    "listing_agency",
    "listingAgency",
  ];
  for (const k of keys) {
    const n = partnerNameFromField(item[k]);
    if (n) out.add(n);
  }
  const listing = item.listing;
  if (listing && typeof listing === "object") {
    for (const k of ["agency", "advertiser"]) {
      const n = partnerNameFromField(listing[k]);
      if (n) out.add(n);
    }
  }
  return out;
}

async function loadPayload() {
  const url = process.env.KITEPROP_PROPERTIES_URL?.trim();
  const fileArg = process.argv[2]?.trim();
  if (fileArg) {
    const raw = await readFile(resolve(process.cwd(), fileArg), "utf-8");
    return JSON.parse(raw);
  }
  if (url) {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al leer ${url}`);
    return res.json();
  }
  throw new Error(
    "Pasá la ruta a un JSON: node scripts/audit-feed-socios.mjs ./archivo.json\n" +
      "o definí KITEPROP_PROPERTIES_URL en el entorno.",
  );
}

function norm(s) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function main() {
  const payload = await loadPayload();
  const list = extractList(payload);
  const allNames = new Set();
  for (const item of list) {
    for (const n of namesFromItem(item)) {
      allNames.add(n);
    }
  }
  const blob = Array.from(allNames).map(norm).join(" | ");

  console.log(`Ítems en el array: ${list.length}`);
  console.log(`Nombres distintos (agency/advertiser y aliases directos): ${allNames.size}`);
  if (allNames.size && allNames.size <= 80) {
    console.log("Listado:", [...allNames].sort().join("\n  • "));
  } else if (allNames.size) {
    console.log("(Demasiados para listar; revisá coincidencias abajo.)\n");
  }

  console.log("\n¿Aparece en esos campos algún texto como en la grilla de socios?");
  let hits = 0;
  for (const needle of NEEDLES) {
    const ok = blob.includes(norm(needle));
    if (ok) hits++;
    console.log(`  ${ok ? "✓" : "✗"} ${needle}`);
  }
  console.log(`\nCoincidencias: ${hits}/${NEEDLES.length}`);
  if (hits === 0 && list.length > 0) {
    console.log(
      "\nNinguna coincidencia con la lista de referencia: o el feed usa otros nombres/claves, o hay que mapear más campos en lib/kiteprop-adapter.ts.",
    );
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
