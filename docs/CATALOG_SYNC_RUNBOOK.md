# Catalog Sync Runbook

## Objetivo

Mantener `/socios` y `/propiedades` leyendo snapshots persistidos, sin rebuild en request publico.

## Storage

- Preferido: Upstash Redis REST (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).
- Si falta storage persistente: estado `degraded/error` en health, sin habilitar live rebuild publico.

## Seguridad

- Sync protegido por `REDALIA_SYNC_SECRET`.
- Compatibilidad: `REDALIA_HEALTH_SECRET` y `CRON_SECRET` (Vercel Cron).
- Health protegido por `REDALIA_HEALTH_SECRET`.

## Cron

- Configurado en `vercel.json`:
  - path: `/api/cron/catalog`
  - schedule: `0 */2 * * *` (cada 2 horas)

## Flujo de sync

1. Cargar fuentes vivas (JSON + network).
2. Construir snapshots:
   - `property_listing_summary`
   - `partner_directory_summary`
3. Calcular hashes:
   - `propertiesHash`
   - `partnersOrderHash`
4. Escribir version `syncId`.
5. Promover `current` solo al completar OK.
6. Mantener version anterior si falla.

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

- `storage=missing`: configurar persistencia y reintentar sync.
- `stale=true` (>6h): revisar cron y ejecutar sync interno.
- hashes inestables sin sync: revisar orden deterministico y origen de datos versionados.
