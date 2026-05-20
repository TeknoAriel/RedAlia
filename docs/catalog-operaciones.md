# Catálogo Redalia — operación y fuente de verdad

Referencia operativa. Arquitectura híbrida fijada: **`docs/redalia-hybrid-catalog-architecture.md`**. Red AINA: `docs/kiteprop-network-aina.md`.

## Fuentes (sin ambigüedad)

| Qué | Fuente de verdad | Variable principal |
|-----|------------------|--------------------|
| **Listado de propiedades e imágenes** | **JSON de difusión** | `KITEPROP_PROPERTIES_URL` (y `KITEPROP_PROPERTIES_SOURCE` vacío o `json` → solo feed) |
| **Directorio de socios** (`/socios`, logos institucionales) | **API de red** + reglas de merge con el feed | `REDALIA_PARTNER_DIRECTORY_SOURCE` (default `merge`) + `KITEPROP_NETWORK_*` + credenciales API |
| **Organizaciones (extras `kpnet:org:*`)** | API de red, **por defecto activo** con catálogo JSON | `KITEPROP_MERGE_NETWORK_ORGANIZATIONS=0` para desactivar |

`network_fallback_json` y `KITEPROP_PROPERTIES_SOURCE=network` son modos **explícitos**; no son el default de producto. Ver `getKitepropPropertiesSourceMode()` en `lib/kiteprop-network/network-env.ts`.

## Variables mínimas

| Modo de propiedades (`KITEPROP_PROPERTIES_SOURCE`) | Comportamiento |
|--------------------------------------------------|----------------|
| **Vacío, `json`, `feed`, `difusion`, `static`** | Solo `loadJsonFeedSnapshot` (JSON de difusión, imágenes incluidas). |
| `network` | Solo API de red para el array de propiedades. |
| `network_fallback_json` / `network+json` / `aina_fallback_json` | Red primero; si 0 o error, feed JSON. |

| Directorio (`REDALIA_PARTNER_DIRECTORY_SOURCE`) | Comportamiento |
|-------------------------------------------------|----------------|
| **Vacío o `network` (default)** | Borradores `kpnet:*` desde la red primero; `propertyCount` recalculado sobre propiedades del **JSON**; si no hay red, cae al armado derivado del catálogo. |
| `merge` | Fusiona feed + red por `advertiser.id` numérico (logos/contacto red primero en match). |
| `feed` | Sin overlay de anunciantes de red; solo `extractSociosGridCatalog` + extras de orgs si aplica. |

Caché: `CATALOG_INGEST_REVALIDATE_SECONDS`, `CATALOG_INGEST_DISABLE_CACHE=1` (local). Crons (mismo `CRON_SECRET`):

| Ruta | Frecuencia (ver `vercel.json`) | Qué hace |
|------|-------------------------------|----------|
| `GET /api/cron/catalog` | Diario 06:00 UTC | Invalida tag + precalienta **solo propiedades** en Upstash |
| `GET /api/cron/socios` | Cada 48 h 07:00 UTC | Sync **incremental** del directorio por `partnerKey` (registro en Redis `redalia:partner-directory:registry:v1`) |

Sync socios: id ya conocido → no toca la fila; id nuevo → alta; id ausente → baja. Si las bajas superan `max(50, 2% del registro)` se **diferen** (posible corte de red) y se reintenta en la próxima corrida; tras 3 diferidos seguidos, sync completo. Requiere `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` y catálogo precalentado.

`ingestMeta.kitepropPropertiesSourceMode` y `partnerDirectorySourceMode` trazan cada corrida de ingesta live.

## Orden de ejecución (modo `json` + default)

1. Cargar propiedades desde el feed remoto (o muestra/strict según `json-feed.ts`).
2. Si el merge de organizaciones no está desactivado, `GET` organizaciones de red → `partnerDirectoryExtraDrafts`.
3. Si el directorio no es `feed`, intentar **overlay** de anunciantes de red (`loadNetworkPartnerDirectoryAdvertiserOverlayDrafts`).

## Variables locales (Vercel)

1. `vercel link` y `npm run env:pull:vercel` → `.env.local` (no commitear).
2. `set -a && source .env.local && set +a && npm run catalog:sources-probe` — no volcar PII.
3. `npm run verify:network-ingest` — contrato de red.

## Cómo forzar vacío o muestra (propiedades)

- **Muestra embebida:** fallo o vacío remoto y no `KITEPROP_PROPERTIES_STRICT_EMPTY=1` → `data/kiteprop-sample.json` / bundle.
- **Red sin propiedades:** `KITEPROP_PROPERTIES_SOURCE=network` y la API no devuelve ítems → `source: empty` (u orgs sueltas).
- **Merge de orgs desactivado:** `KITEPROP_MERGE_NETWORK_ORGANIZATIONS=0`.

## Auditoría AINA

1. `KITEPROP_NETWORK_AUDIT_ENABLED=1`
2. `GET /api/test-kiteprop-network-audit` (server-only)
3. `npm run audit:kiteprop-network`

## Si el listing queda vacío

| Síntoma | Revisar |
|---------|---------|
| 403/404 al feed | `KITEPROP_PROPERTIES_URL` correcta; permisos `static.kiteprop.com` |
| `kitepropPropertiesSourceMode: network` | Modo forzado a red; credenciales y paths |
| Directorio sin `kpnet:*` | Red no autenticada; `ingestMeta.partnerDirectoryOverlayErrorCode` |

## Documentos relacionados

- `docs/redalia-partner-directory.md` — merge y `partnerKey`
- `docs/redalia-hybrid-catalog-architecture.md` — decisión de arquitectura
- `docs/ingestion-feed-plan.md` — detalle de ingest (histórico)
