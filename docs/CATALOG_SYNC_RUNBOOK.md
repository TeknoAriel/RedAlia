# Catalog Sync Runbook

## Objetivo

Mantener `/socios` y `/propiedades` leyendo snapshots persistidos, sin rebuild en request publico.

## Storage

- Operativo actual: `static_repo_snapshot` versionado en `public/read-models`.
- Futuro recomendado: Blob/KV/Postgres para historico y redundancia multi-entorno.

## Seguridad

- Sync protegido por `REDALIA_SYNC_SECRET`.
- Compatibilidad: `REDALIA_HEALTH_SECRET` y `CRON_SECRET` (Vercel Cron).
- Health protegido por `REDALIA_HEALTH_SECRET`.

## Cron

- Configurado en `vercel.json`:
  - path: `/api/cron/catalog`
  - schedule: `0 6 * * *` (diario, limite de plan Hobby)
- Frecuencia operativa cada 6 horas via GitHub Actions:
  - `.github/workflows/catalog-static-sync.yml` (`0 */6 * * *`)
  - genera snapshots y commitea cambios en `public/read-models`.

### Decision 6h vs 24h

- Decision actual: `6h` en workflow de snapshots.
- Motivo: en Redalia el contenido comercial cambia durante el dia y 24h eleva demasiado la ventana de desactualizacion visible.
- Riesgo si se usa 24h: mayor drift entre catalogo publicado y snapshots (`/socios`, `/propiedades`) durante horarios comerciales.
- Como volver a 24h: cambiar cron del workflow a `0 3 * * *` y monitorear `ageMinutes`/`stale` en health.
- Impacto esperado de 6h: mejor frescura manteniendo web pasiva (sin live rebuild en trafico publico).

## Flujo de sync

1. Cargar fuentes vivas (JSON + network).
2. Construir snapshots:
   - `property_listing_summary`
   - `partner_directory_summary`
3. Calcular hashes:
   - `propertiesHash`
   - `partnersOrderHash`
4. Validar minimos antes de sobrescribir (>=380 socios, >=1000 propiedades y listas no vacias).
5. Escribir version `syncId` en snapshots estaticos.
6. Mantener snapshot anterior si falla cualquier validacion.

## Health / observabilidad

- `/api/catalog-health?secret=...&include_data=1`
- `/api/socios-health?secret=...&include_data=1`
- `/api/internal/self-check-catalog?secret=...`

Campos clave:

- `storage`, `storageAvailable`
- `currentSyncId`, `lastSyncAt`, `ageMinutes`, `stale`
- `partnersOrderHash`, `propertiesHash`
- `liveRebuildUsed=false` (en trafico publico)

## Respuesta ante incidentes

- `stale=true` (>8h): revisar ejecucion de `catalog-static-sync` y estado de secretos.
- falla de generacion: conservar ultimo snapshot valido, revisar logs de ingest y reintentar workflow manual.
- hashes inestables sin sync: revisar orden deterministico y fuentes efectivas del snapshot.
