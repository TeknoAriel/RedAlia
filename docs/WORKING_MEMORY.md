# REDALIA — MEMORIA OPERATIVA

Documento vivo entre sesiones. No reemplaza los `docs/*.md` canónicos; alinea **criterio de cierre**, **fuente de verdad** y **reglas de release** para esta etapa.

## Objetivo actual

No seguir con mejoras visuales ni UX hasta **cerrar datos reales en producción**.

## Estado Sprint 0/1 (foundation)

- Rama de trabajo: `redalia/sprint-0-1-foundation-nav`.
- Se habilitaron health checks protegidos por `REDALIA_HEALTH_SECRET` con formato `?secret=...` y respuesta `401` cuando falta/incorrecto.
- Decisión vigente de rutas públicas: mantener `\`/propiedades\`` como catálogo principal en producción.
- `\`/catalogo\`` sigue fuera de navegación principal mientras en producción continúe en `404`.
- Este sprint **no** ataca el P0 de performance de propiedades; queda planificado para Sprint 3.

## Estado Sprint P0 Performance Architecture (abril 2026)

- Rama: `redalia/p0-catalog-performance-architecture`.
- Objetivo: desacoplar request público de fuentes vivas para `/socios` y `/propiedades`.
- Implementado:
  - Read model persistido `property_listing_summary`.
  - Reuso de snapshot persistido para directorio de socios (`partner_directory_summary`).
  - Endpoint de sync protegido: `/api/internal/sync-catalog?secret=...`.
  - Health orientado a lectura rápida de read model (`catalog-health`, `socios-health`).
- Regla operativa: request público **lee snapshot persistido**; ingest/sync ocurre fuera de request.

## Estado Sprint P0.2 Persistent Catalog Cache (abril 2026)

- Rama: `redalia/p0-2-persistent-catalog-cache`.
- Adapter unico de snapshots: `lib/catalog-read-model/read-model-store.ts`.
- `PUBLIC_LIVE_REBUILD_ALLOWED=false` para rutas publicas `/socios` y `/propiedades`.
- Cron de sync cada 2 horas en `vercel.json`.
- Endpoints internos:
  - sync: `/api/internal/sync-catalog?secret=...`
  - self-check: `/api/internal/self-check-catalog?secret=...`

## Criterios de cierre de esta etapa

- `/propiedades` debe mostrar **>3000** propiedades reales.
- `/socios` debe mostrar **>300** socios/organizaciones reales.
- Las propiedades deben tener **fotos visibles**.
- Los socios deben tener **logos visibles** cuando el dato exista.
- No debe aparecer **catálogo referencial** ni **socios demo**.

## Fuente de verdad (híbrida; ver `docs/redalia-hybrid-catalog-architecture.md`)

- **Propiedades + fotos de ficha:** **JSON de difusión** (`KITEPROP_PROPERTIES_URL`; `KITEPROP_PROPERTIES_SOURCE` default = `json`).
- **Socios / directorio / logos institucionales:** **API de red** (`REDALIA_PARTNER_DIRECTORY_SOURCE` default = `network`; opcional `merge` para fusión explícita feed↔red).
- **Anunciante** canónico en red: `kpnet:advertiser:{id}`; **organización** contexto / fallback: `kpnet:org:{id}`.

## Estabilidad operativa de `/socios` + catálogo (abril 2026)

- Base efectiva del directorio: `REDALIA_PARTNER_DIRECTORY_SOURCE=network` (red) vía `resolveStablePublicDirectorySnapshot` (`lib/public-data/get-stable-partner-directory.ts`).
- **Persistencia entre instancias:** snapshot JSON del directorio en **Upstash Redis** (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`); en **dev** archivo `.redalia-cache/partner-directory-snapshot.json`. Si la red falla y el listado live queda vacío, se sirve el último snapshot sin error al usuario.
- Capa adicional en proceso: `load-catalog-snapshot.ts` conserva últimos drafts de red en memoria de la instancia (complemento, no sustituto de Redis en serverless).
- Orden: activos primero; `propertyCount` desc; tipo; nombre. Rotación opcional entre empates: `REDALIA_SOCIOS_ROTATION_PERIOD` (`weekly` default, `daily`, `off`) + `REDALIA_SOCIOS_ROTATE_ACTIVE_TIES=1`.
- Catálogo: filtros/paginación **server-side** (`lib/properties/catalog-query.ts`); rutas `/propiedades` y `/catalogo` (ISR `revalidate=1800`). Ver `docs/CATALOG_STABILITY.md` y `docs/PERFORMANCE_NOTES.md`.
- Diagnóstico interno protegido por query secret: `GET /api/catalog-health?secret=...`, `GET /api/socios-health?secret=...` (`401` sin secret válido).
- Términos Chile en socios: “corredora”, “socios de la red”, “oficina/profesional” donde aplica.

## Reglas de release

- Una sola línea de trabajo por vez.
- Ramas cortas.
- PR inmediato.
- Merge a `main`.
- Deploy production.
- **Verificación pública obligatoria** tras cada deploy.

## No hacer (hasta cerrar catálogo + socios + media)

- No tocar **Home**.
- No tocar **buscador**.
- No tocar **MCP**.
- No tocar **copy institucional**.
- No tocar **navegación general**.

## Verificación obligatoria post-deploy

1. `/propiedades`
2. `/socios`
3. Conteo real (propiedades y socios/organizaciones).
4. Fotos visibles en propiedades.
5. Logos visibles en socios (cuando exista dato).

## Si falla — qué informar (sin decir “ya quedó”)

Indicar con precisión:

- Qué **source** está activa (propiedades y directorio).
- Cuántas **propiedades** entran.
- Cuántos **socios** entran.
- Qué **host** de media falla (y ejemplo de URL).
- Qué **env** está mal o ausente.
- Qué **endpoint** o capa corta (login, listado paginado, merge, mapping, absolutización, `next/image`, caché).

---

## Anexo técnico (referencia rápida)

### Rutas de código

- Catálogo: `lib/get-properties.ts` → `lib/catalog-ingest/load-catalog-snapshot.ts` → `lib/kiteprop-network/load-public-catalog-from-network.ts`.
- Listado público paginado: `lib/properties/catalog-query.ts`, `components/catalog/CatalogListingPage.tsx`, `components/properties/PropertiesExplorer.tsx`.
- Red: `lib/kiteprop-network/get-network-properties.ts`, `get-network-organizations.ts`, `lib/kiteprop/client.ts`.
- Directorio estable: `lib/public-data/get-stable-partner-directory.ts`, `partner-directory-snapshot-persist.ts`, `lib/kv/upstash-string.ts`.
- Listing rápido propiedades: `lib/properties/read-model.ts`, `lib/properties/property-listing-snapshot-persist.ts`, `lib/properties/get-stable-property-listing.ts`.
- Sync snapshots: `app/api/internal/sync-catalog/route.ts`, `scripts/sync-catalog.mjs`.
- Directorio: `lib/public-data/partner-directory-resolve.ts`, `from-properties-feed.ts`.
- Media: `lib/kiteprop-media-url.ts`, `lib/kiteprop-adapter.ts`, `next.config.ts` (`images.remotePatterns`).

### Env útiles (producción)

- `KITEPROP_PUBLIC_ORIGIN=https://www.kiteprop.com`
- Base REST: `KITEPROP_API_BASE_URL` **o** `KITEPROP_API_BASE` (el cliente acepta ambos).
- Tolerancia: `KITEPROP_API_TIMEOUT_MS`, `KITEPROP_NETWORK_REQUEST_RETRY_ATTEMPTS`, `KITEPROP_NETWORK_REQUEST_DELAY_MS`.
- Auditoría: `KITEPROP_NETWORK_AUDIT_ENABLED=1` → `GET /api/test-kiteprop-network-audit`, `GET /api/test-catalog-uncached`.
- Script: `node scripts/network-ingest-verify.mjs`.

### Riesgos conocidos

- Ingesta paginada grande + `unstable_cache`: si el snapshot **> ~2MB**, Next puede **no persistir** el data cache; revisar logs de build y estrategia de caché si afecta estabilidad.
- `HTTP_ERROR` intermitente upstream: ya hay carga en serie, reintento corto y envs de timeout/retry; seguir el protocolo **Si falla** arriba.
- **Topes de paginación (código)**: el default de `KITEPROP_NETWORK_ORGANIZATIONS_MAX_PAGES` no puede dejar < ~300 orgs con `per_page=15` (20 páginas = 300). Los defaults de `KITEPROP_NETWORK_PROPERTIES_MAX_PAGES` deben permitir >3000 con el `per_page` real. El techo de filas **real** lo impone la API; si KiteProp solo expone ~400–500 publicaciones de red, no se alcanza 3000 salvo otra fuente o contrato.

### UI explícitamente congelada en esta fase

- Home, header, Navbar, carruseles, footer, buscador, copy, navegación: **no tocar** hasta cierre de datos (salvo bug de datos que dependa de un asset compartido, documentado).
- **Excepción de operación (build):** `export const dynamic = "force-dynamic"` en `app/page.tsx` para evitar que el SSG de `/` ejecute toda la ingesta en build y falle el deploy por timeout (~60s). **No cambia copy ni componentes;** solo el modo de render.

### Invariante Premier

- Antes de tocar filtros de tags / mappers de listado Premier: `.cursor/rules/premier-inventory-invariant.mdc` y `docs/PREMIER_INVENTORY_INVARIANT.md`.

### Repo

- `components/layout/Navbar.tsx`: no mezclar con esta etapa salvo pedido explícito.
