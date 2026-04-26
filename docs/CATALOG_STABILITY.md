# Estabilidad del catálogo y del directorio de socios

## Propiedades (`/propiedades`, `/catalogo`)

- **Fuente:** sin cambios respecto al producto — `getProperties()` + ingest existente (`KITEPROP_PROPERTIES_SOURCE`, etc.).
- **Listado:** filtros, orden y paginación se resuelven **en el servidor** por request. Al cliente solo llega la **página actual** (tamaño `REDALIA_PROPERTIES_PAGE_SIZE`, default 30).
- **ISR:** las rutas `/propiedades` y `/catalogo` exportan `revalidate = 1800` (literal requerido por Next). El TTL del data cache de `getProperties` sigue gobernado por `REDALIA_CATALOG_REVALIDATE_SECONDS` o `CATALOG_INGEST_REVALIDATE_SECONDS` (ver `lib/get-properties.ts`).
- **Fallback vacío:** si el feed falla, no se inventa listado; el mensaje de error de página se mantiene.

## Socios (`/socios`)

- **Fuente principal:** API de red / KiteProp según `REDALIA_PARTNER_DIRECTORY_SOURCE` (default `network`).
- **Orden:** `lib/public-data/directory-order.ts` — activos primero (`propertyCount > 0`), luego volumen, tipo, nombre. Inactivos siempre al final.
- **Rotación entre empates:** opcional; seed estable por período (`REDALIA_SOCIOS_ROTATION_PERIOD`: `weekly` default, `daily`, `off`). Solo aplica con `REDALIA_SOCIOS_ROTATE_ACTIVE_TIES=1`.
- **Snapshot persistente:** tras cada directorio exitoso (con entradas) se guarda JSON en:
  - **Producción recomendada:** Upstash Redis (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`).
  - **Desarrollo:** archivo `.redalia-cache/partner-directory-snapshot.json` (gitignored).
- **Si la red falla y el listado live queda vacío:** se sirve el **último snapshot persistido** sin mostrar error al visitante (banner discreto opcional en UI).

## Verificación post-deploy

1. `/propiedades` y `/catalogo?operation=venta&page=2` — misma lógica, distinta ruta.
2. `/socios` y `/socios?page=2` — orden estable dentro del período de rotación.
3. Health (requiere `REDALIA_HEALTH_SECRET` y header `x-redalia-health`):
   - `GET /api/catalog-health`
   - `GET /api/socios-health`

## Variables relevantes

| Variable | Rol |
|----------|-----|
| `REDALIA_CATALOG_REVALIDATE_SECONDS` | ISR página catálogo + TTL preferido de `getProperties` |
| `REDALIA_PROPERTIES_PAGE_SIZE` | Filas por página en listado |
| `REDALIA_SOCIOS_PAGE_SIZE` | Filas por página en `/socios` |
| `REDALIA_SOCIOS_ROTATION_PERIOD` | `off` \| `daily` \| `weekly` |
| `REDALIA_SOCIOS_ROTATE_ACTIVE_TIES` | `1` para rotar empates entre activos |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Snapshot persistente de socios |
| `REDALIA_HEALTH_SECRET` | Protege endpoints de diagnóstico |
