# Arquitectura híbrida: catálogo (propiedades) y directorio (socios)

**Decisión de producto (congelada):** el **listado público de propiedades** y las **fotos de ficha** salen del **JSON de difusión** KiteProp. El **directorio institucional de socios** (identidad, logos, contexto) se alinea con la **API de red** (AINA / mismos contratos que `lib/kiteprop-network`).

No reinterpretrar: la red **no** es la fuente principal del array de propiedades del sitio; el feed JSON **no** sustituye el directorio de socios cuando haya credenciales de red.

## Tabla de fuente de verdad

| Dato | Fuente de verdad | Cómo se carga (código) |
|------|------------------|-------------------------|
| Propiedades (título, precio, etc.) | Feed JSON de difusión | `loadJsonFeedSnapshot` cuando `getKitepropPropertiesSourceMode()` = `json` (default). Con URL configurada **no** hay fallback a muestra embebida. |
| Imágenes de propiedades | Mismo JSON (`images` + normalización) | `lib/kiteprop-adapter.ts` → `NormalizedProperty.images` |
| Listado de organizaciones (borradores `kpnet:org:*`) | API de red | `getNetworkOrganizations` vía `loadNetworkPartnerDirectoryDraftsOnly` si merge de orgs activo (default) |
| Anunciantes / logos `kpnet:advertiser:*` | API de red (payload de propiedades de red + reglas) | `loadNetworkPartnerDirectoryAdvertiserOverlayDrafts` + `buildNetworkDirectoryDraftsFromPropertyPayloads` (logo anunciante con **fallback** a `organizationContext` en el mismo bump) |
| Directorio sin fusionar claves feed↔red | `REDALIA_PARTNER_DIRECTORY_SOURCE=network` (**default** vacío) | `networkPrimaryRows` en `partner-directory-resolve.ts` |
| Fusión explícita feed + red (mismo `advertiser.id`) | `REDALIA_PARTNER_DIRECTORY_SOURCE=merge` | `mergeFeedAndNetwork` en `partner-directory-resolve.ts` |

## Relación propiedad → socio (Redalia)

1. Cada `NormalizedProperty` del feed trae `advertiser`, `agency`, `agentAgency` según el JSON (`lib/kiteprop-adapter.ts`, `lib/agencies.ts`).
2. El directorio puede exponer claves canónicas de red `kpnet:advertiser:{id}` con el **mismo id numérico** que `advertiser:{id}` en el feed.
3. `propertyMatchesPartnerKey` acepta both `advertiser:123` y `kpnet:advertiser:123` para contar y filtrar (`lib/agencies.ts`).
4. **Modo `network`:** filas `kpnet:*` primero; `propertyCount` / cobertura se recalculan contra las propiedades del **JSON** con `propertyMatchesPartnerKey` (soporta `kpnet:advertiser:*`).
5. **Modo `merge`:** logo y contactos con prioridad **red** en match numérico; `mergeAdvertiserFeedWithNetwork`.

## Variables de entorno (producción)

| Variable | Verdad final |
|----------|--------------|
| `KITEPROP_PROPERTIES_URL` | URL del **JSON de difusión** real; obligatoria en deploy si el default del repo no aplica. |
| `KITEPROP_PROPERTIES_SOURCE` | Vacío o `json` → **solo** feed JSON para el listing. `network` / `network_fallback_json` solo si se pide explícitamente. |
| `REDALIA_PARTNER_DIRECTORY_SOURCE` | Vacío o `network` → directorio desde **red** (fallback a feed si no hay borradores). `merge` / `feed` ver `docs/redalia-partner-directory.md`. |
| `KITEPROP_MERGE_NETWORK_ORGANIZATIONS` | **Default: activo** (merge). `0` desactiva el `GET` de organizaciones. |
| `KITEPROP_NETWORK_ID`, `KITEPROP_NETWORK_TOKEN`, auth API | Necesarias para directorio/overlay; sin ellas, el catálogo de **propiedades** sigue en JSON, el directorio cae a feed puro. |

## Vercel sin tocar el panel (opcional)

`vercel.json` define `env` con `KITEPROP_PROPERTIES_SOURCE`, `REDALIA_PARTNER_DIRECTORY_SOURCE`, `KITEPROP_PUBLIC_ORIGIN` y `KITEPROP_PROPERTIES_URL` (feed validado en repo). Las variables del **dashboard Vercel** siguen teniendo prioridad si las definís (p. ej. otra URL de difusión). **Secretos** (`KITEPROP_NETWORK_TOKEN`, `KITEPROP_API_PASSWORD`, etc.) no van en el repo: una sola carga en **Project → Settings → Environment Variables** para `/socios` completo desde red.

## Metadatos

`ingestMeta.kitepropPropertiesSourceMode` y `ingestMeta.partnerDirectorySourceMode` (en `getProperties` / `attachIngestMeta`) dejan trazabilidad de la corrida.

## Referencias

- `lib/kiteprop-network/network-env.ts` — resolución de `KITEPROP_PROPERTIES_SOURCE` y merge de orgs
- `lib/public-data/partner-directory-source.ts` — directorio
- `lib/catalog-ingest/load-catalog-snapshot.ts` — orquestación
- `docs/catalog-operaciones.md` — operación
- `docs/kiteprop-network-aina.md` — contrato red
