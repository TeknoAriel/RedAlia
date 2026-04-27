# Auditoría de Arquitectura de Performance (P0)

Fecha: 2026-04-27  
Ambiente auditado: `https://www.redalia.cl`

## Estado actual (antes de cambios)

Mediciones HTTP/HTML (muestreo con agente de navegador):

- `/` ~112 KB HTML, ~94.8s request total observada.
- `/socios` ~219 KB HTML, ~69.8s request total observada.
- `/socios?page=2` ~216 KB HTML, ~64.0s request total observada.
- `/socios?page=10` ~212 KB HTML, ~122.4s request total observada.
- `/propiedades` ~274 KB HTML, ~56.4s request total observada.
- `/propiedades?page=2` ~290 KB HTML, ~64.8s request total observada.

Health con `include_data=1` (previo):

- `/api/catalog-health`: ~116s (lectura ligada a snapshot/capa pesada)
- `/api/socios-health`: ~123s (incluía ingest + resolve en request)

## Causas raíz probables

1. Request público acoplado a cómputo de catálogo/directorio (o a caché caliente no garantizada).
2. `/socios` reconstruía directorio desde propiedades cuando no estaba pre-serializado en una capa rápida.
3. `/propiedades` consumía modelo completo `NormalizedProperty` en cards/listado (payload innecesario para listing).
4. Health endpoints estaban midiendo flujo pesado, no capa de lectura rápida.
5. Falta de read model formal para listings y directorio con fallback persistente explícito.

## Rutas críticas

- `app/socios/page.tsx`
- `app/propiedades/page.tsx` + `components/catalog/CatalogListingPage.tsx`
- `app/api/socios-health/route.ts`
- `app/api/catalog-health/route.ts`
- `lib/catalog-ingest/load-catalog-snapshot.ts`

## Datos pesados detectados

- Uso de `NormalizedProperty` completo para grilla de `/propiedades`.
- Recomputación/resolve de directorio en request de `/socios` en vez de solo leer snapshot persistido.

## Decisiones implementadas

1. **Read model de propiedades (listing):**
   - `property_listing_summary` persistido en KV/archivo (`lib/properties/read-model.ts`, `lib/properties/property-listing-snapshot-persist.ts`).
2. **Lectura estable de listing:**
   - `resolveStablePropertyListingSnapshot()` usa read model persistido primero (`lib/properties/get-stable-property-listing.ts`).
3. **`/propiedades` y `/catalogo` desacoplados del modelo completo:**
   - ahora filtran/paginan contra `PropertyListingSummary`.
4. **Read model de socios para request público:**
   - `/socios` prioriza snapshot persistido de directorio.
5. **Health rápido:**
   - `catalog-health` y `socios-health` leen read models persistidos (tiempo de lectura real).
6. **Sync explícito:**
   - nuevo endpoint protegido `/api/internal/sync-catalog?secret=...` para regenerar read models.

## Storage elegido

- Primario actual: **Upstash Redis REST** (cuando está configurado).
- Fallback dev/local: `.redalia-cache/*.json`.

Esto permite desacoplar request público de fuente viva sin cambiar source of truth.

## Plan de migración ejecutado

- Fase 1 (audit + diseño): completada.
- Fase 2 (socios read model): completada.
- Fase 3 (propiedades listing summary + paginación server-side real): completada.
- Fase 4 (sync endpoint protegido): completada.
- Fase 5 (search avanzado): documentada en decisión aparte.

## Estado posterior al cambio (producción)

### HTML (impacto principal)

- `/propiedades`: de ~274 KB a ~176 KB (baja ~35.8%).
- `/propiedades?page=2`: de ~290 KB a ~186 KB (baja ~35.8%).
- `/socios`: se mantiene en torno a ~219 KB (cambio menor; el beneficio aquí es desacople de cómputo/ingest).

### Paginación efectiva observada

- `/socios`: 40 tarjetas por página (última página parcial: 30).
- `/propiedades`: 30 propiedades por página (se observan 90 links a detalle por enlaces repetidos dentro de card).

### Health post implementación

- `catalog-health`: `sourceEffective=property_listing_summary`, `readModel=true`.
- `socios-health`: `sourceEffective=partner_directory_summary`, `readModel=true`.
- Ambos endpoints leen vía capa de read model; si falta snapshot persistido, reconstruyen desde caché de catálogo y no bloquean con error.

### Riesgo operativo detectado

- En producción hay alta variabilidad de latencia externa (se observaron corridas de ~60s en `curl` y otras sub-segundo).
- Este comportamiento parece de borde/red/protección upstream y no del tamaño HTML.
- Queda recomendado activar storage persistente fuerte para snapshots (Upstash Redis en producción) para evitar reconstrucciones cuando no hay snapshot.
