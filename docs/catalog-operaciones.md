# Catálogo Redalia — operación y fuente de verdad

Referencia corta para deploy y soporte. Detalle técnico: `docs/ingestion-feed-plan.md`, red AINA: `docs/kiteprop-network-aina.md`.

## Variables mínimas por modo

| Modo (`KITEPROP_PROPERTIES_SOURCE`) | Propiedades | Directorio Socios (extras) | Variables clave |
|--------------------------------------|---------------|-----------------------------|-------------------|
| **omitido / `json`** | Feed JSON (`KITEPROP_PROPERTIES_URL`) + muestra si falla | Derivado del JSON (`agencies` / `NormalizedProperty`) | URL feed, `KITEPROP_PROPERTIES_STRICT_EMPTY`, `KITEPROP_PROPERTIES_TRY_DEFAULT_FEED` |
| **`json` + merge orgs** | Igual JSON | + API organizaciones si `KITEPROP_MERGE_NETWORK_ORGANIZATIONS=1` | Lo anterior + credenciales red (`KITEPROP_API_*`, `KITEPROP_NETWORK_*`) |
| **`network`** | **Solo** API propiedades de red | Organizaciones de la misma corrida de red si hay datos | Credenciales red; **no** hay fallback al feed JSON |
| **`network_fallback_json`** | Red primero; si error o 0 ítems → feed JSON + reglas de muestra | Organizaciones de red si la llamada de red devolvió borradores | Credenciales + URL feed |

Caché: `CATALOG_INGEST_REVALIDATE_SECONDS`, `CATALOG_INGEST_DISABLE_CACHE=1` (local). Cron: `CRON_SECRET` + `GET /api/cron/catalog` con Bearer. Logs de corrida: `CATALOG_INGEST_LOG=1`.

## Orden real de fuentes (sin ambigüedad)

1. **`network`:** una sola fuente para el **array de propiedades**: `loadPublicCatalogFromNetwork` → normalización. Sin `loadJsonFeedSnapshot`.
2. **`network_fallback_json`:** (a) misma carga de red; (b) si no hay propiedades útiles, `loadJsonFeedSnapshot` (URL remota / disco / bundle); (c) ramas de vacío estricto y muestra como en `json-feed.ts`.
3. **`json`:** solo `loadJsonFeedSnapshot` (+ opcional solo-organizaciones si merge activo).

## Variables locales desde Vercel (segundo caso: API red, sin pegar secretos en el chat)

1. Instalá la CLI: `npm i -g vercel` (o usá `npx vercel`).
2. En la raíz del repo: `vercel link` y elegí el **team** y el **proyecto** donde ya están las env vars.
3. Bajá todo a un archivo **gitignored**: `npm run env:pull:vercel` (equivale a `vercel env pull .env.local`).
4. Cargá y probá: `set -a && source .env.local && set +a && npm run catalog:sources-probe` (sin `CATALOG_PROBE_JSON_ONLY` para incluir REST + red) o `npm run verify:network-ingest`.

**Importante:** no commitees `.env.local` (ya está cubierto por `.gitignore` con `.env*.local`). No copies valores sensibles al asistente ni a issues públicos.

## Cómo probar la ingesta

- **Sin Next:** `npm run verify:network-ingest` (misma auth que producción).
- **Fuentes en paralelo (JSON + REST + red):** `set -a && source .env.local && set +a && npm run catalog:sources-probe` — imprime HTTP, conteos y muestras de títulos/nombres (sin volcar PII). Solo JSON: `CATALOG_PROBE_JSON_ONLY=1 npm run catalog:sources-probe`.
- **Con Next:** `CATALOG_INGEST_DISABLE_CACHE=1`, recargar `/propiedades`; revisar `ingestMeta` en logs si `CATALOG_INGEST_LOG=1`.

## Cómo forzar fallback (propiedades)

- **Muestra embebida:** feed remoto falla o vacío y **no** `KITEPROP_PROPERTIES_STRICT_EMPTY=1` → `json-feed` puede servir `data/kiteprop-sample.json` / bundle.
- **Vacío forzado:** `KITEPROP_PROPERTIES_STRICT_EMPTY=1` evita rellenar con muestra cuando el remoto devuelve 0 ítems.
- **Modo red sin respaldo JSON:** usar `network`; si la API falla, listado vacío (`source: "empty"`) con `ingestMeta.networkErrorCode`.

## Auditoría AINA

1. `KITEPROP_NETWORK_AUDIT_ENABLED=1` en el entorno del servidor.
2. `GET /api/test-kiteprop-network-audit` (solo server; no exponer en cliente).
3. Revisar `auth`, conteos, `socioResolutionStats` (cuántas propiedades resuelven a anunciante vs org-only vs unmapped), `socioResolutionSample`, `advertiserScan`.
4. Script: `npm run audit:kiteprop-network` (ver `scripts/kiteprop-network-audit.mjs`).

## Si el listing queda vacío

| Síntoma | Revisar |
|---------|---------|
| `source: "empty"`, `hasListings: false` | Modo `network`: API sin ítems o error (`networkErrorCode`). Modo JSON: URL 403/404, o strict empty. |
| Caché “vieja” | Cron con `CRON_SECRET`; TTL; o `revalidateTag` manual; `CATALOG_INGEST_DISABLE_CACHE=1` en local. |
| Extractor devuelve 0 | `extractPropertyArrayFromNetworkResponse` / envelope `success`+`data`; correr auditoría y `verify:network-ingest`. |
| Directorio sin socios pero hay props | `buildPublicPartnerDirectoryFromFeed`: socios derivados de partners en propiedades; extras `kpnet:*` si red aportó borradores. |

## Fuente de verdad hoy

- **Listado de propiedades en la web:** la que indique `KITEPROP_PROPERTIES_SOURCE` (tabla arriba). `ingestMeta.propertyPrimarySource` refleja el origen dominante de esa corrida (`remote` \| `sample` \| `empty` \| `network`).
- **Directorio público (sin cambiar UI en esta fase):** derivación desde propiedades normalizadas + opcional `partnerDirectoryExtraDrafts` (red).

## Fuente futura de “Socio Redalia”

- **Red API:** modelo documentado en `lib/kiteprop-network/redalia-socio-network-model.ts`: **anunciante canónico** (`kpnet:advertiser:{id}`), **organización** como contexto o fallback (`kpnet:org:{id}`).
- **Feed JSON:** hoy `partnerKey` por `scopedPartnerKey` desde roles en ficha (`lib/agencies.ts` → `lib/public-data/map-socio-catalog-to-public.ts`). La convergencia hacia anunciante-red es la siguiente fase de producto (sin tocar UI pública hasta decisión explícita).
