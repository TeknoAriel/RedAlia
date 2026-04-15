#!/usr/bin/env node
/**
 * Analiza un export KiteProp (array raíz o con líneas de metadatos previas).
 * Uso: node scripts/analyze-kiteprop-json.mjs <ruta.json>
 */
import { readFile } from "fs/promises";
import { resolve } from "path";

const path = resolve(process.cwd(), process.argv[2] || "");
if (!process.argv[2]) {
  console.error("Uso: node scripts/analyze-kiteprop-json.mjs <archivo.json>");
  process.exit(1);
}

let text = await readFile(path, "utf8");
const i = text.indexOf("[");
if (i === -1) throw new Error("No se encontró array JSON");
text = text.slice(i);
const list = JSON.parse(text);

console.log("Propiedades:", list.length);

const agencyNames = new Map();
const agentNames = new Map();
const advertiserNames = new Map();
const rootKeys = new Map();
let withAdvertiser = 0;
let withAinaKey = 0;

for (const item of list) {
  for (const k of Object.keys(item)) {
    rootKeys.set(k, (rootKeys.get(k) || 0) + 1);
  }
  if (item.aina != null) withAinaKey++;
  if (item.advertiser != null) withAdvertiser++;
  const ag = item.agency;
  if (ag?.name) {
    const k = `${ag.id ?? "?"}::${ag.name}`;
    agencyNames.set(k, (agencyNames.get(k) || 0) + 1);
  }
  const adv = item.advertiser;
  if (adv?.name) {
    const k = `${adv.id ?? "?"}::${adv.name}`;
    advertiserNames.set(k, (advertiserNames.get(k) || 0) + 1);
  }
  const agent = item.agent;
  if (agent?.name) {
    const k = `${agent.id ?? "?"}::${agent.name}`;
    agentNames.set(k, (agentNames.get(k) || 0) + 1);
  }
}

console.log("\nClaves raíz presentes (frecuencia):");
console.log(
  [...rootKeys.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `  ${k}: ${n}`)
    .join("\n"),
);

console.log("\nCon clave `aina`:", withAinaKey, "| con `advertiser`:", withAdvertiser);

console.log("\nValores distintos de agency.name (id::nombre → count):");
[...agencyNames.entries()]
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, c]) => console.log(`  ${c}x  ${k}`));

console.log("\nTop agent (id::nombre → count):");
[...agentNames.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([k, c]) => console.log(`  ${c}x  ${k}`));

if (advertiserNames.size) {
  console.log("\nAdvertiser (id::nombre → count):");
  [...advertiserNames.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .forEach(([k, c]) => console.log(`  ${c}x  ${k}`));
}

const blob = JSON.stringify(list).toLowerCase();
const needles = [
  "[ci]",
  "hgm",
  "todo propiedades",
  "silva home",
  "liu propiedades",
  "piantini",
  "corredora",
  "inmobiliaria",
];
console.log("\nSubcadenas en JSON completo (texto libre):");
for (const n of needles) {
  console.log(`  ${blob.includes(n) ? "✓" : "✗"} ${n}`);
}
