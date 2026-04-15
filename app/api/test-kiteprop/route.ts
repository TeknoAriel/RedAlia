import { NextResponse } from "next/server";
import { isKitePropApiTestEnabled } from "@/lib/kiteprop/api-test-enabled";
import { getKitePropProfile } from "@/lib/kiteprop/get-profile";

export const runtime = "nodejs";

function summarizeDataShape(data: unknown): string[] {
  if (data === null || data === undefined) {
    return [];
  }
  if (Array.isArray(data)) {
    return [`[array length ${data.length}]`];
  }
  if (typeof data === "object") {
    return Object.keys(data as Record<string, unknown>).sort();
  }
  return [`[${typeof data}]`];
}

const ERROR_MESSAGES: Record<string, string> = {
  MISSING_KEY: "KiteProp API key not configured",
  TIMEOUT: "KiteProp API request timed out",
  NETWORK: "Could not reach KiteProp API",
  HTTP_ERROR: "KiteProp API returned an error status",
  INVALID_JSON: "KiteProp API returned an unexpected response body",
};

/**
 * Prueba server-side de conectividad contra GET /profile (X-API-Key).
 *
 * PROTECCIÓN: si `KITEPROP_ENABLE_API_TEST` no es exactamente "1", respondemos 404 sin cuerpo
 * (no se llama a KiteProp; no se filtra existencia de rutas internas en mensajes verbosos).
 */
export async function GET() {
  if (!isKitePropApiTestEnabled()) {
    return new NextResponse(null, { status: 404 });
  }

  const result = await getKitePropProfile();

  if (result.ok) {
    return NextResponse.json({
      ok: true,
      status: result.status,
      message: "KiteProp API connection successful",
      dataShape: summarizeDataShape(result.data),
    });
  }

  const message = ERROR_MESSAGES[result.errorCode] ?? "KiteProp request failed";

  const httpStatus =
    result.errorCode === "MISSING_KEY"
      ? 503
      : result.errorCode === "TIMEOUT"
        ? 504
        : 502;

  return NextResponse.json(
    {
      ok: false,
      status: result.status ?? 0,
      message,
      dataShape: [] as string[],
    },
    { status: httpStatus },
  );
}
