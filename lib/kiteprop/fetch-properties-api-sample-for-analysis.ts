import "server-only";

import { extractRawPropertyListFromKitepropPropertiesResponse } from "@/lib/kiteprop/extract-property-list-from-api";
import { getKitePropPropertiesApiPage } from "@/lib/kiteprop/get-properties-api";
import {
  compareApiSampleToFeedCatalog,
  summarizeOneApiPropertyItem,
} from "@/lib/kiteprop/summarize-properties-api-shape";
import { unwrapKitepropSuccessData } from "@/lib/kiteprop/unwrap-envelope";
import type { NormalizedProperty } from "@/types/property";

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function topLevelKeys(raw: unknown): string[] {
  if (!isRecord(raw)) return [];
  return Object.keys(raw).sort();
}

export type KitepropPropertiesApiAnalysisResult =
  | {
      ok: true;
      upstreamHttpStatus: number;
      envelopeTopLevelKeys: string[];
      unwrappedType: string;
      listLength: number;
      requestedPage: number;
      requestedLimit: number;
      itemSamples: ReturnType<typeof summarizeOneApiPropertyItem>[];
      feedComparison: ReturnType<typeof compareApiSampleToFeedCatalog> | null;
    }
  | {
      ok: false;
      upstreamHttpStatus: number | null;
      errorCode: string;
      message: string;
      envelopeTopLevelKeys: string[];
    };

const SAMPLE_COUNT = 5;
const COMPARISON_MAX = 20;

/**
 * Una página pequeña de `GET /properties` + resumen estructural seguro.
 * No escribe logs con token ni cuerpo crudo.
 */
export async function fetchKitePropPropertiesApiSampleForAnalysis(options?: {
  page?: number;
  limit?: 15 | 30 | 50;
  feedCatalog?: NormalizedProperty[] | null;
}): Promise<KitepropPropertiesApiAnalysisResult> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 15;

  const result = await getKitePropPropertiesApiPage({ page, limit });

  if (!result.ok) {
    return {
      ok: false,
      upstreamHttpStatus: result.status,
      errorCode: result.errorCode,
      message:
        result.errorCode === "MISSING_BEARER"
          ? "Bearer not configured (set KITEPROP_ACCESS_TOKEN or KITEPROP_API_SECRET for GET /properties)"
          : result.errorCode === "HTTP_ERROR"
            ? "KiteProp returned an error HTTP status for GET /properties"
            : result.errorCode === "TIMEOUT"
              ? "Request to KiteProp timed out"
              : result.errorCode === "NETWORK"
                ? "Network error reaching KiteProp"
                : "Unexpected response from KiteProp",
      envelopeTopLevelKeys: [],
    };
  }

  const raw = result.data;
  const envelopeTopLevelKeys = topLevelKeys(raw);
  const inner = unwrapKitepropSuccessData(raw);
  const unwrappedType =
    inner === null || inner === undefined
      ? "nullish"
      : Array.isArray(inner)
        ? "array"
        : typeof inner;

  const list = extractRawPropertyListFromKitepropPropertiesResponse(raw);
  const itemSamples = list
    .slice(0, SAMPLE_COUNT)
    .map((item, i) => summarizeOneApiPropertyItem(item, i));

  let feedComparison: ReturnType<typeof compareApiSampleToFeedCatalog> | null = null;
  if (options?.feedCatalog && options.feedCatalog.length > 0 && list.length > 0) {
    feedComparison = compareApiSampleToFeedCatalog(list, options.feedCatalog, COMPARISON_MAX);
  }

  return {
    ok: true,
    upstreamHttpStatus: result.status,
    envelopeTopLevelKeys,
    unwrappedType,
    listLength: list.length,
    requestedPage: page,
    requestedLimit: limit,
    itemSamples,
    feedComparison,
  };
}
