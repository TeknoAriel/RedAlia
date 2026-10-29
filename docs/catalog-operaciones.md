# Catálogo Redalia — operación y fuente de verdad

Referencia operativa. Arquitectura híbrida fijada: **`docs/redalia-hybrid-catalog-architecture.md`**. Red AINA: `docs/kiteprop-network-aina.md`.

## Espejo Redalia (filtros locales)

El usuario **no** filtra contra KiteProp. `/propiedades?q=&city=&priceMin=` lee el snapshot
en memoria / Redis / Data Cache y `filterPropertiesCatalog` corre en el server de Redalia.

La API `GET /properties/network` está **apagada** salvo `REDALIA_NETWORK_PROPERTY_CRAWL=1`.
Los ~50k GET de esa ruta en informes semanales son crawls paginados de crons viejos, no búsquedas.

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

Caché: `CATALOG_INGEST_REVALIDATE_SECONDS`. Tráfico web = **solo lectura** (memoria → Upstash → Data Cache JSON). **Cero REST a KiteProp en visitas.**

| Ruta | Frecuencia | Qué pega a KiteProp |
|------|------------|---------------------|
| `GET /api/cron/catalog` | Cada 2 h | **HEAD** al JSON estático. GET del JSON solo si cambió. Nunca `properties/network`. |
| `GET /api/cron/socios` | 1× al día (08:00 UTC) | `GET organizations` si el directorio tiene >24 h. Sin crawl de propiedades salvo `REDALIA_NETWORK_PROPERTY_CRAWL=1`. |

Listas de red cache 24 h. GitHub `Sync production cache` es **manual** (no duplica el cron cada 2 h).

**Importante:** las visitas **no** paginan la API de red. Lectura preferida: memoria → Upstash. Si Upstash falla (cuota Fixed / 403), fallback a `unstable_cache` + feed JSON (sin red). Si Redis está en cuota, liberar storage o upgrade en Upstash Console; mientras tanto el sitio sigue con Data Cache.

Emergency local: `CATALOG_INGEST_DISABLE_CACHE=1`.

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
