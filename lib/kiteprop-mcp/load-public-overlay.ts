import "server-only";

import { readFile } from "fs/promises";
import path from "path";
import { mapSnapshotV1ToPublicOverlay } from "@/lib/kiteprop-mcp/map-snapshot-to-public";
import type { PublicMcpNetworkOverlay } from "@/lib/kiteprop-mcp/types";

const REVALIDATE_SEC = 3600;

function parseJson(raw: string): unknown {
  return JSON.parse(raw) as unknown;
}

/**
 * Carga señales MCP→públicas desde URL opcional o archivo local opcional.
 * No llama al binario MCP desde Next.js (no disponible en Vercel); el snapshot
 * debe generarse en CI, job interno o entorno con MCP y publicarse aquí.
 */
export async function loadPublicMcpNetworkOverlay(): Promise<PublicMcpNetworkOverlay | null> {
  const url = process.env.KITEPROP_MCP_PUBLIC_SNAPSHOT_URL?.trim();
  if (url) {
    try {
      const res = await fetch(url, {
        next: { revalidate: REVALIDATE_SEC },
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return null;
      const text = await res.text();
      const data = parseJson(text);
      return mapSnapshotV1ToPublicOverlay(data);
    } catch {
      return null;
    }
  }

  const rawFile = process.env.KITEPROP_MCP_PUBLIC_SNAPSHOT_FILE?.trim();
  const fileName =
    rawFile && !rawFile.includes("..") && !rawFile.includes("/") && !rawFile.includes("\\")
      ? rawFile
      : "kiteprop-mcp-public-snapshot.json";
  const filePath = path.join(process.cwd(), "data", fileName);
  try {
    const text = await readFile(filePath, "utf-8");
    const data = parseJson(text);
    return mapSnapshotV1ToPublicOverlay(data);
  } catch {
    return null;
  }
}
