# Plan de ingestión de catálogo (propiedades, atributos, socios)

Objetivo: una sola tubería **ordenada y estable** para poblar el sitio; las fuentes se **complementan** donde el código ya lo permite, sin inventar campos ni APIs.

## 1. Fuentes (en orden lógico)

| Orden | Fuente | Qué aporta | Variables |
|------|---------|------------|-----------|
| A | **Feed JSON de difusión KiteProp** | Listado de propiedades normalizadas + derivación de socios/agencias/agentes desde el mismo JSON (`NormalizedProperty` → directorio). | `KITEPROP_PROPERTIES_URL`, `KITEPROP_PROPERTIES_STRICT_EMPTY`, `KITEPROP_PROPERTIES_TRY_DEFAULT_FEED` |
| B | **API de red (AINA)** | Propiedades vía `loadPublicCatalogFromNetwork` + borradores de organizaciones (`partnerDirectoryExtraDrafts`). | `KITEPROP_PROPERTIES_SOURCE=network` \| `network_fallback_json`, credenciales en `docs/kiteprop-network-aina.md`, paginación opcional `KITEPROP_NETWORK_*_PAGED_FETCH` |
| B′ | **Solo organizaciones de red** (opcional) | Con catálogo **JSON**, suma socios institucionales del endpoint de organizaciones sin cambiar el origen de las propiedades. | `KITEPROP_MERGE_NETWORK_ORGANIZATIONS=1` + mismas credenciales que B |

**Regla hoy:** o predominan propiedades de **red** (si hay ítems), o el sitio sirve el **JSON** (con muestra embebida si el remoto falla o está vacío según flags). Los borradores de organización de red se **adjuntan** al resultado JSON cuando aplica (`getPartnerDirectoryExtraDrafts`).

## 2. Modelo de ficha (registros consumidos)

Sin duplicar el dominio en tablas nuevas: el contrato canónico sigue siendo el existente.

- **Propiedad / atributos / agentes:** `NormalizedProperty` (`types/property.ts`) — agencia, anunciante, agentes, matriz, precios, ubicación, imágenes, etc., mapeados en `lib/kiteprop-adapter.ts` desde el JSON o desde payloads de red normalizados con la misma función.
- **Socio / directorio público:** `PublicPartnerDirectoryEntry` y borrador `PublicPartnerDirectoryRowDraft` (`lib/public-data/types.ts`) — construidos desde el feed en `lib/public-data/from-properties-feed.ts` y, si hay, extras de red con claves `kpnet:…`.

**Metadatos de corrida (operación):** `CatalogIngestRunMeta` en `lib/catalog-ingest/catalog-result.ts` — conteos, qué se intentó (JSON / red), si hubo fallback a muestra, timestamp. Sin URLs ni PII.

## 3. Implementación en código

| Pieza | Rol |
|-------|-----|
| `lib/catalog-ingest/load-catalog-snapshot.ts` | Orquestación única de ingest (sin caché). |
| `lib/get-properties.ts` | `unstable_cache` + `cache` de React; TTL `CATALOG_INGEST_REVALIDATE_SECONDS` (default 7200 s); tag `redalia-catalog`. |
| `lib/catalog-ingest/cache-tag.ts` | Constante compartida con la ruta cron. |
| `app/api/cron/catalog/route.ts` | `GET` con `Authorization: Bearer $CRON_SECRET` → `revalidateTag` (Vercel Cron). |
| `vercel.json` | Cron cada 2 h → `/api/cron/catalog`. |

## 4. Completar feeds por una u otra fuente

- **Solo JSON:** `KITEPROP_PROPERTIES_SOURCE` omitido o `json` → feed remoto / muestra; directorio derivado del JSON.
- **JSON + socios de red:** mismo modo `json` + `KITEPROP_MERGE_NETWORK_ORGANIZATIONS=1` y credenciales AINA → catálogo sigue siendo el JSON; el directorio suma organizaciones de la API (sin duplicar `partnerKey` ya presente en el feed). Ver `ingestMeta.networkOrganizations*` si falla la API de organizaciones.
- **Red primero:** `network` / `aina` → red; si 0 propiedades o error de red, **JSON**; organizaciones de red pueden **sumarse** como `partnerDirectoryExtraDrafts` si la red respondió con borradores.
- **Producción ~2 h:** definir `CRON_SECRET` en Vercel (documentación oficial de Cron); el cron llama la ruta y fuerza nueva lectura tras vencer el TTL de caché.

## 5. Evolución (sin comprometer estabilidad)

Cuando existan **resultados medidos** más allá de lo documentado (shapes reales, totales, huecos de mapeo), se puede: reordenar prioridades, fusionar listas con deduplicación explícita por `externalNumericId`, o añadir una tercera fuente — siempre en `lib/catalog-ingest/*` y adaptadores ya acotados.

## 6. Desarrollo local

- `CATALOG_INGEST_DISABLE_CACHE=1` — ver cambios de feed sin esperar TTL.
- `npm run verify:network-ingest` — comprobar red sin levantar Next (`docs/kiteprop-network-aina.md`).

## 7. Vercel

- El bloque `crons` en `vercel.json` requiere que el proyecto tenga **Cron Jobs** habilitado según tu plan. Si el deploy rechaza la config, eliminá `crons` y programá un ping externo a `GET /api/cron/catalog` con el mismo `Authorization: Bearer`.

## 8. Operación (qué revisar)

| Pregunta | Dónde mirar |
|----------|-------------|
| ¿Qué fuente sirvió el listado? | `result.source` y `result.ingestMeta?.propertyPrimarySource` (tras `getProperties`). |
| ¿Hubo fallback a muestra? | `usedSampleFallback` e `ingestMeta.usedSampleFallback`. |
| ¿Cuántas propiedades entraron? | `ingestMeta.propertyCount`, `hasListings`. |
| ¿Falló la red pero siguió el JSON? | `ingestMeta.networkErrorCode` (códigos internos, sin PII). |
| ¿Falló solo el merge de organizaciones (modo JSON + merge)? | `ingestMeta.networkOrganizationsErrorCode` (intento en `networkOrganizationsAttempted`). |
| ¿Cuándo corrió la corrida? | `ingestMeta.completedAtMs`, `runId` para correlacionar con log. |
| Listado vacío en web | Feed remoto vacío/403, `KITEPROP_PROPERTIES_STRICT_EMPTY=1`, o red sin props + JSON vacío: revisá env y `npm run verify:network-ingest` si usás red. |
| Log de una línea por corrida | `CATALOG_INGEST_LOG=1` en el entorno server (Vercel): JSON en stdout con el mismo shape que `ingestMeta` (sin secretos). |

### Cron `GET /api/cron/catalog`

- Requiere header `Authorization: Bearer <CRON_SECRET>` (comparación **timing-safe**).
- **200** `{ ok, tag, revalidatedAt, message }` — tag invalidado.
- **401** — bearer incorrecto o faltante.
- **503** — `CRON_SECRET` no definido en el entorno (cron deshabilitado a propósito).

### Caché

- `getProperties` usa `unstable_cache` con tag `redalia-catalog` y TTL `CATALOG_INGEST_REVALIDATE_SECONDS` (default 7200).
- `CATALOG_INGEST_DISABLE_CACHE=1` omite caché (local / depuración).
