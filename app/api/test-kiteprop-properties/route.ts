import { NextResponse } from "next/server";
import { getProperties } from "@/lib/get-properties";
import { isKitePropApiTestEnabled } from "@/lib/kiteprop/api-test-enabled";
import { fetchKitePropPropertiesApiSampleForAnalysis } from "@/lib/kiteprop/fetch-properties-api-sample-for-analysis";

export const runtime = "nodejs";

/**
 * Prueba server-side: muestra pequeña de `GET /properties` (Bearer) + resumen estructural sin PII.
 *
 * Misma protección que `/api/test-kiteprop`: si `KITEPROP_ENABLE_API_TEST` ≠ `1` → **404** sin cuerpo.
 * No sustituye al feed JSON ni alimenta la UI pública.
 */
export async function GET() {
  if (!isKitePropApiTestEnabled()) {
    return new NextResponse(null, { status: 404 });
  }

  const feed = await getProperties();
  const feedCatalog = feed.ok ? feed.properties : null;

  const analysis = await fetchKitePropPropertiesApiSampleForAnalysis({
    page: 1,
    limit: 15,
    feedCatalog,
  });

  if (!analysis.ok) {
    const status =
      analysis.errorCode === "MISSING_BEARER"
        ? 503
        : analysis.errorCode === "TIMEOUT"
          ? 504
          : 502;
    return NextResponse.json(
      {
        ok: false,
        message: analysis.message,
        errorCode: analysis.errorCode,
        upstreamHttpStatus: analysis.upstreamHttpStatus,
      },
      { status },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "KiteProp GET /properties — muestra estructural (sin valores de campos sensibles)",
    endpoint: {
      method: "GET",
      pathOnBaseUrl: "/properties",
      baseUrlEnv: "KITEPROP_API_BASE_URL",
      defaultBaseUrl: "https://www.kiteprop.com/api/v1",
      fullUrlExample: "https://www.kiteprop.com/api/v1/properties?page=1&limit=15",
      queryParamsDocumentedInClient: ["page", "limit", "status (opcional)"],
      paginationNote:
        "El wrapper `getKitePropPropertiesApiPage` solo envía `limit` ∈ {15,30,50} (validación local; confirmar límites en doc oficial KiteProp).",
      authentication:
        "Header Authorization: Bearer — variable KITEPROP_ACCESS_TOKEN o, si preferís una sola secret, KITEPROP_API_SECRET (mismo valor kp_… que en MCP; no X-API-Key en esta ruta).",
    },
    upstreamHttpStatus: analysis.upstreamHttpStatus,
    envelopeTopLevelKeys: analysis.envelopeTopLevelKeys,
    unwrappedPayloadType: analysis.unwrappedType,
    extractedListLength: analysis.listLength,
    itemShapeSamples: analysis.itemSamples,
    feedVersusApiAggregates: analysis.feedComparison,
    feedCatalogLoaded: Boolean(feedCatalog?.length),
    piiNote:
      "Este JSON no incluye emails, teléfonos ni nombres en claro; solo rutas de keys y conteos agregados.",
  });
}
