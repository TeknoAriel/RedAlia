# REDALIA — MEMORIA OPERATIVA

Documento vivo entre sesiones. No reemplaza los `docs/*.md` canónicos; alinea **criterio de cierre**, **fuente de verdad** y **reglas de release** para esta etapa.

## Objetivo actual

No seguir con mejoras visuales ni UX hasta **cerrar datos reales en producción**.

## Criterios de cierre de esta etapa

- `/propiedades` debe mostrar **>3000** propiedades reales.
- `/socios` debe mostrar **>300** socios/organizaciones reales.
- Las propiedades deben tener **fotos visibles**.
- Los socios deben tener **logos visibles** cuando el dato exista.
- No debe aparecer **catálogo referencial** ni **socios demo**.

## Fuente de verdad

- **Catálogo**: API **network** como fuente prioritaria (`KITEPROP_PROPERTIES_SOURCE=network` en producción salvo decisión explícita en contrario).
- **Socios**: **anunciante** como socio canónico (`kpnet:advertiser:{id}`).
- **Organización**: contexto / fallback (`kpnet:org:{id}`).

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
- Red: `lib/kiteprop-network/get-network-properties.ts`, `get-network-organizations.ts`, `lib/kiteprop/client.ts`.
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

### Invariante Premier

- Antes de tocar filtros de tags / mappers de listado Premier: `.cursor/rules/premier-inventory-invariant.mdc` y `docs/PREMIER_INVENTORY_INVARIANT.md`.

### Repo

- `components/layout/Navbar.tsx`: no mezclar con esta etapa salvo pedido explícito.
