# Plan de ingestión de catálogo (propiedades, atributos, socios)

Objetivo: una sola tubería **ordenada y estable** para poblar el sitio; las fuentes se **complementan** donde el código ya lo permite, sin inventar campos ni APIs.

## 1. Fuentes (en orden lógico)

| Orden | Fuente | Qué aporta | Variables |
|------|---------|------------|-----------|
| A | **Feed JSON de difusión KiteProp** | Listado de propiedades normalizadas + derivación de socios/agencias/agentes desde el mismo JSON (`NormalizedProperty` → directorio). | `KITEPROP_PROPERTIES_URL`, `KITEPROP_PROPERTIES_STRICT_EMPTY`, `KITEPROP_PROPERTIES_TRY_DEFAULT_FEED` |
| B | **API de red (AINA)** — modo `network` | Propiedades **solo** desde `loadPublicCatalogFromNetwork` + organizaciones en la misma corrida. **Sin** feed JSON si la red falla o viene vacía. | `KITEPROP_PROPERTIES_SOURCE=network` (o `aina`), credenciales `docs/kiteprop-network-aina.md`, paginación opcional `KITEPROP_NETWORK_*_PAGED_FETCH` |
| B″ | **API de red + fallback JSON** — modo `network_fallback_json` | Intenta B; si 0 propiedades o error de red, entonces feed JSON (`loadJsonFeedSnapshot`) + mismas reglas de muestra/strict. | `KITEPROP_PROPERTIES_SOURCE=network_fallback_json` + URL feed + credenciales |
| B′ | **Solo organizaciones de red** (opcional) | Con catálogo **JSON**, suma socios institucionales del endpoint de organizaciones sin cambiar el origen de las propiedades. | `KITEPROP_MERGE_NETWORK_ORGANIZATIONS=1` + mismas credenciales que B |

**Regla hoy:** depende de `KITEPROP_PROPERTIES_SOURCE` (ver **`docs/catalog-operaciones.md`**): `network` = solo red para propiedades; `network_fallback_json` = red luego JSON; `json` = solo feed. Los borradores de organización de red se **adjuntan** cuando la corrida de red los obtuvo o con `KITEPROP_MERGE_NETWORK_ORGANIZATIONS=1` en modo JSON.

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
- **Solo red (`network` / `aina`):** propiedades únicamente desde API de red; **no** se consulta el feed JSON. Listado vacío si la API no entrega ítems (pueden quedar organizaciones como extras).
- **Red con fallback JSON (`network_fallback_json`):** primero red; si falla o 0 propiedades, entonces JSON + muestra/strict como en modo `json`.
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
| Listado vacío en web | Modo `network`: API vacía o error (`networkErrorCode`). Modo `json` / fallback: feed 403/vacío, `KITEPROP_PROPERTIES_STRICT_EMPTY=1`. Siempre: caché/TTL/cron. Ver **`docs/catalog-operaciones.md`**. |
| Log de una línea por corrida | `CATALOG_INGEST_LOG=1` en el entorno server (Vercel): JSON en stdout con el mismo shape que `ingestMeta` (sin secretos). |

### Cron `GET /api/cron/catalog`

- Requiere header `Authorization: Bearer <CRON_SECRET>` (comparación **timing-safe**).
- **200** `{ ok, tag, revalidatedAt, message }` — tag invalidado.
- **401** — bearer incorrecto o faltante.
- **503** — `CRON_SECRET` no definido en el entorno (cron deshabilitado a propósito).

### Caché

- `getProperties` usa `unstable_cache` con tag `redalia-catalog` y TTL `CATALOG_INGEST_REVALIDATE_SECONDS` (default 7200).
- `CATALOG_INGEST_DISABLE_CACHE=1` omite caché (local / depuración).
