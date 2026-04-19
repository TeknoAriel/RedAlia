import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { REDALIA_CATALOG_CACHE_TAG } from "@/lib/catalog-ingest/cache-tag";

export const runtime = "nodejs";

function isAuthorizedCronRequest(authHeader: string | null, secret: string): boolean {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7).trim();
  if (!token || !secret) return false;
  try {
    const a = Buffer.from(token, "utf8");
    const b = Buffer.from(secret, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Invalida la entrada de caché etiquetada `REDALIA_CATALOG_CACHE_TAG` (ver `getProperties` / `unstable_cache`).
 * Vercel Cron envía `Authorization: Bearer <CRON_SECRET>` cuando la variable está definida en el proyecto.
 *
 * Respuestas: **200** revalidación solicitada; **401** secreto incorrecto o ausente en header; **503** proyecto sin `CRON_SECRET` configurado.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "misconfigured", message: "Definí CRON_SECRET en el entorno para habilitar el cron." },
      { status: 503 },
    );
  }

  if (!isAuthorizedCronRequest(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  revalidateTag(REDALIA_CATALOG_CACHE_TAG, "max");

  const revalidatedAt = new Date().toISOString();
  return NextResponse.json({
    ok: true,
    tag: REDALIA_CATALOG_CACHE_TAG,
    revalidatedAt,
    message:
      "Tag invalidado; las siguientes peticiones disparan recálculo según el comportamiento de Data Cache de Next.",
  });
}
