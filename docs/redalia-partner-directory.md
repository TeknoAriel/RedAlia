# Directorio público de socios — modelo canónico y migración gradual

Este documento define el **Socio Redalia** en la capa de datos pública, la separación **anunciante vs organización**, el feature flag **`REDALIA_PARTNER_DIRECTORY_SOURCE`** y las reglas de **merge** / deduplicación. Complementa `docs/catalog-operaciones.md` y `docs/kiteprop-network-aina.md`.

## Modelo canónico (red API)

| Rol | Entidad | `partnerKey` canónico | Uso en directorio |
|-----|---------|----------------------|-------------------|
| Socio canónico | **Anunciante** (payload de red) | `kpnet:advertiser:{id}` | Fila principal del directorio cuando la fuente es red o merge con match numérico. |
| Contexto / fallback | **Organización** | `kpnet:org:{id}` | Contexto institucional; fila propia solo si no hay anunciante parseable en esa propiedad (`organization_only` en `resolveSocioFromNetworkProperty`). |

Implementación de resolución por propiedad: `lib/kiteprop-network/redalia-socio-network-model.ts`.  
Claves estables: `lib/kiteprop-network/socio-canonical-keys.ts`.  
Mapeo anunciante → `PublicPartnerDirectoryRowDraft`: `lib/kiteprop-network/map-network-advertiser-to-public-draft.ts`.  
Mapeo organización → borrador: `lib/kiteprop-network/map-network-org-to-public-draft.ts`.

## Feature flag: `REDALIA_PARTNER_DIRECTORY_SOURCE`

| Valor | Comportamiento |
|-------|----------------|
| `network` (**default** vacío) | Directorio desde **red** (`kpnet:*`); conteos/cobertura contra propiedades del **JSON** vía `propertyMatchesPartnerKey`. Si no hay borradores de red, **fallback** al armado estilo `feed`. |
| `merge` | Fusiona feed + red por id de anunciante (logos red primero en match). Reglas: `lib/public-data/partner-directory-resolve.ts`. |
| `feed` | Solo socios del catálogo de propiedades; sin overlay de anunciantes de red. |

El **listado de propiedades** sigue gobernado por **`KITEPROP_PROPERTIES_SOURCE`** (default: JSON de difusión). El directorio es independiente. Ver `docs/redalia-hybrid-catalog-architecture.md`.

### Overlay de red sobre catálogo JSON

Si el modo es `network` o `merge` y el snapshot **no** incluye ya `partnerDirectoryNetworkAdvertiserDrafts` (p. ej. catálogo solo JSON), la ingesta intenta **`GET` de propiedades de red** una vez y arma borradores (`loadNetworkPartnerDirectoryAdvertiserOverlayDrafts`). Errores quedan en `ingestMeta.partnerDirectoryOverlayErrorCode` sin romper el catálogo.

## Reglas de merge (`merge`)

Entrada: borradores **feed** (claves `agency:*`, `advertiser:{n}`, etc.) + borradores **red** (`kpnet:advertiser:{n}`, …) + **extras** (`kpnet:org:*` del listado de organizaciones).

1. **Matching anunciante**  
   Se considera el mismo socio si el feed tiene `advertiser:{n}` y la red tiene `kpnet:advertiser:{n}` con el mismo `n` numérico.

2. **`partnerKey` resultante**  
   Gana la **red**: la fila fusionada usa `kpnet:advertiser:{n}`.

3. **Nombre visible (`displayName`)**  
   Texto de **red** si viene no vacío; si no, **feed**.

4. **Logo y contactos** (`logoUrl`, `email`, `phone`, `mobile`, `whatsapp`, `webUrl`)  
   Campo a campo: **red primero** si tiene valor; si no, **feed**.

5. **Filas feed que no son anunciante** (`agency`, `agent`, `sub_agent`)**  
   Se conservan tal cual (misma clave feed); no se intenta fusionarlas con `kpnet:org` en esta fase (evita heurística ambigua).

6. **Filas red sin par en feed**  
   Se agregan con su `kpnet:*`.

7. **Extras de organización** (`partnerDirectoryExtraDrafts`)**  
   Se agregan al final si el `partnerKey` no existe aún (dedupe por clave).

8. **`propertyCount` y `coverageLabels`**  
   Tras armar filas, se **recalculan desde el catálogo de propiedades servido** con `propertyMatchesPartnerKey` (incluye soporte para `kpnet:advertiser:*` y `kpnet:org:*` en `lib/agencies.ts`).

Código: `lib/public-data/partner-directory-resolve.ts`.

## Riesgos y activación gradual

- **Modo `network` con overlay fallido**: se vuelve al armado tipo `feed`; el sitio no queda sin directorio por un fallo de red aislado.
- **Modo `network` con overlay vacío** (credenciales / paths): mismo fallback a feed.
- **Doble llamada a red**: en catálogo ya `network`, los borradores vienen de la misma corrida; en JSON + `merge`/`network`, hay un **GET adicional** de propiedades de red para el overlay (cacheada con el resto del snapshot vía `getProperties`).
- **Slugs públicos**: al pasar de `advertiser:{n}` a `kpnet:advertiser:{n}`, cambia el `publicSlug` derivado; enlaces antiguos a `/socios/...` pueden dejar de coincidir hasta una fase de UI/redirecciones (fuera de alcance de esta tarea).

## Variables relacionadas

| Variable | Rol |
|----------|-----|
| `REDALIA_PARTNER_DIRECTORY_SOURCE` | `network` (default) \| `merge` \| `feed` |
| `KITEPROP_PROPERTIES_SOURCE` | Origen del listado de propiedades (default **`json`**: feed de difusión; ver `network-env.ts`). |
| `KITEPROP_MERGE_NETWORK_ORGANIZATIONS` | `0` desactiva; **sin `0`**: activa extras `kpnet:org:*` con catálogo JSON. |
| `KITEPROP_NETWORK_*` | Auth y paginación para llamadas de red. |

## Próxima fase (fuera de este PR)

- Validar en staging slugs y enlaces del directorio con `merge` / `network`.
- Ajustar Home / carrusel para usar las mismas opciones de build si se desea paridad con `/socios`.
- Redirecciones 301 de slugs viejos si se estabiliza `kpnet:*` en producción.
