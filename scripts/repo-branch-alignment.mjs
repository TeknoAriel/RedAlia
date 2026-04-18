#!/usr/bin/env node
/**
 * Informe de ramas remotas vs origin/main (commits de atraso / adelanto).
 * Pensado para CI tras `git fetch origin` y checkout con fetch-depth: 0.
 *
 * Salida: Markdown en stdout (ideal para $GITHUB_STEP_SUMMARY).
 * Exit 0 siempre (es un informe; no falla el workflow).
 */

import { execSync } from "node:child_process";

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }).trim();
}

function main() {
  const exclude = new Set(
    (process.env.REPO_ALIGN_EXCLUDE_PREFIXES || "dependabot/")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  let remotes;
  try {
    remotes = sh("git branch -r --format='%(refname:short)'")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  } catch {
    console.log("No se pudieron listar ramas remotas.");
    process.exit(0);
  }

  const branches = remotes
    .filter((r) => r.startsWith("origin/"))
    .map((r) => r.replace(/^origin\//, ""))
    .filter((b) => b !== "HEAD" && !b.includes("->"));

  const rows = [];
  for (const b of branches) {
    if (b === "main") continue;
    if ([...exclude].some((p) => b.startsWith(p))) continue;
    const ref = `origin/${b}`;
    let behindMain = "";
    let aheadMain = "";
    try {
      behindMain = sh(`git rev-list --count ${ref}..origin/main 2>/dev/null`) || "0";
      aheadMain = sh(`git rev-list --count origin/main..${ref} 2>/dev/null`) || "0";
    } catch {
      behindMain = "?";
      aheadMain = "?";
    }
    rows.push({ branch: b, behindMain, aheadMain });
  }

  rows.sort((a, b) => Number(b.behindMain) - Number(a.behindMain));

  console.log("## Alineación de ramas con `origin/main`\n");
  console.log(
    "| Rama | Commits **atrás** de main (main tiene y esta rama no) | Commits **adelante** (solo en esta rama) |",
  );
  console.log("|------|------------------------------------------------------:|------------------------------------------:|");
  for (const r of rows) {
    console.log(`| \`${r.branch}\` | ${r.behindMain} | ${r.aheadMain} |`);
  }
  console.log("\n* **Atrás > 0**: conviene `git merge origin/main` o `git rebase origin/main` en esa rama antes de mergear el PR.*");
  console.log("* **Adelante > 0**: la rama tiene trabajo no integrado a main (normal hasta merge).*");
}

main();
