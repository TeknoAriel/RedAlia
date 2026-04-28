# Performance — notas operativas

## Objetivo

Primera carga del catálogo y directorio más liviana, con lectura rápida desde read models persistidos (sin reconstruir todo en cada request público).

## Qué cambió

1. **`PropertiesExplorer`** deja de recibir el array completo de propiedades. Recibe solo `pageItems` (subconjunto) + metadatos de totales y opciones de filtro precomputadas en el servidor.
2. **`PropertyCard`** para listing usa modelo resumido (`mainImageUrl`, campos mínimos), evitando arrays completos de media/detalle en HTML.
3. **Read model `property_listing_summary`** persistido en KV/archivo y leído por `/propiedades` y `/catalogo`.
4. **Read model `partner_directory_summary`** persistido y usado por `/socios`.
5. **Health endpoints** (`catalog-health`, `socios-health`) miden lectura de read model en vez de forzar ingest completo.
6. **Sync explícito**: `/api/internal/sync-catalog?secret=...` para regenerar snapshots rápidos.

## Cómo medir antes/después (manual)

- Tamaño de documento HTML / payload JSON transferido al cliente (DevTools → Network).
- Tiempo de respuesta del documento en `/propiedades` y `/catalogo`.
- **Health interno** (con `REDALIA_HEALTH_SECRET`):
  - `GET /api/catalog-health` → `readMs`, `lastSyncAtMs`, `sourceEffective`.
  - `GET /api/socios-health` → `readMs`, `lastSyncAtMs`, `sourceEffective`, conteos.

## Límites conocidos

- Si no existe snapshot persistido aún, la primera reconstrucción puede ser más lenta hasta ejecutar sync.
- La consistencia de datos depende del ciclo de sync (manual/cron) y no del request público.

## Operacion vigente (P0.3)

- Requests publicos de `/socios` y `/propiedades`: solo lectura de `public/read-models/*`.
- `storage` operativo: `static_repo_snapshot`.
- `live_rebuilt` deshabilitado para trafico publico y health.
- Sync de snapshots versionados cada 6 horas via GitHub Actions (`catalog-static-sync.yml`).
- Si falla la generacion o los minimos de volumen (>=380 socios, >=1000 propiedades), no se sobrescribe el ultimo snapshot valido.

## Stale snapshot

- `stale=true` cuando el snapshot supera 8 horas desde `generatedAt`.
- Aun con `stale=true`, se sigue sirviendo el ultimo snapshot valido para proteger estabilidad.

## Próxima etapa (opcional)

- Agregar storage SQL (Postgres/Supabase/Neon) para read models con índices y auditoría histórica.
- Evaluar Meilisearch/Typesense para fuzzy/autocomplete si la demanda de búsqueda lo requiere.
