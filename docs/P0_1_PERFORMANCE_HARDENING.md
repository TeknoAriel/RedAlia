# Redalia P0.1 - Performance Hardening

## Hallazgos de auditoria

- `/socios` y `/propiedades` podian caer en `live_rebuilt` cuando no existia snapshot persistido.
- El fallback silencioso permitia recomputar desde fuente viva durante request publico.
- El orden de socios no tenia desempate total (faltaba `slug` y `id/partnerKey`), lo que podia cambiar el top 40 ante entradas empatadas.
- Faltaban hashes de estabilidad (`partnersOrderHash`, `propertiesHash`) y metadatos de sync reutilizables.
- Faltaba contrato estricto de health para indicar storage efectivo y degradacion cuando persistencia no existe.

## Cambios aplicados

- Se prohibio `live_rebuilt` en requests publicos:
  - `app/socios/page.tsx` ya no reconstruye desde fuente viva.
  - `lib/properties/get-stable-property-listing.ts` solo reconstruye live si `allowLiveRebuild=true` explicito.
- Sync atomico versionado en keys:
  - `redalia:readmodel:partners:{syncId}`
  - `redalia:readmodel:properties:{syncId}`
  - `redalia:readmodel:current`
  - `redalia:readmodel:meta`
- Health endurecido:
  - `status`, `storage`, `liveRebuildUsed`, `publicLiveRebuildAllowed`, `currentSyncId`, `lastSyncAt`.
  - `partnersOrderHash` en socios y `propertiesHash` en catalogo.
- Orden de socios totalmente deterministico:
  - `propertyCount > 0` primero.
  - `propertyCount` descendente.
  - empates por nombre normalizado, luego `publicSlug`, luego `partnerKey`.
- Scripts QA agregados:
  - `pnpm qa:socios:stability`
  - `pnpm qa:catalog:performance`

## Criterios de operacion

- Si storage persistente falta en produccion:
  - health debe reportar `status=degraded`, `storage=missing`.
  - sync responde error `persistent_storage_missing`.
  - requests publicos no intentan rebuild live.
- Los cambios de total/orden deben ocurrir solo tras sync explicito.

## P0.2 (cierre de confiabilidad)

- Se agrega adapter unico: `lib/catalog-read-model/read-model-store.ts`.
- Politica de lectura publica: `PUBLIC_LIVE_REBUILD_ALLOWED=false`.
- `/socios` y `/propiedades` leen snapshots via adapter (sin live fetch en request publico).
- Sync protegido con `REDALIA_SYNC_SECRET` (compatible fallback `REDALIA_HEALTH_SECRET` y `CRON_SECRET` para Vercel Cron).
- Se agrega self-check server-side: `/api/internal/self-check-catalog?secret=...`.
- Cron operativo cada 6 horas via GitHub Actions (`.github/workflows/catalog-sync.yml`).
- Cron en `vercel.json` queda diario por limitacion de plan Hobby.
