# Performance — notas operativas

## Objetivo

Primera carga del catálogo más liviana y navegación por filtros/páginas sin enviar miles de propiedades al bundle del cliente.

## Qué cambió

1. **`PropertiesExplorer`** deja de recibir el array completo de propiedades. Recibe solo `pageItems` (subconjunto) + metadatos de totales y opciones de filtro precomputadas en el servidor.
2. **`PropertyCard`** admite `compactListing`: imagen con `loading="lazy"` y sin bloque de resumen largo en grilla paginada.
3. **Rutas** `/propiedades` y `/catalogo` comparten `CatalogListingPage` con **ISR** (`revalidate` desde env).
4. **Búsqueda por texto (`q`):** debounce ~480 ms + `router.replace` para no disparar una navegación por tecla.

## Cómo medir antes/después (manual)

- Tamaño de documento HTML / payload JSON transferido al cliente (DevTools → Network).
- Tiempo de respuesta del documento en `/propiedades` y `/catalogo`.
- **Health interno** (con `REDALIA_HEALTH_SECRET`):
  - `GET /api/catalog-health` → `ingestMs`, `sortAndPageMs`, `pageSliceCount`.
  - `GET /api/socios-health` → `ingestMs`, `directoryResolveMs`, conteos.

## Límites conocidos

- Comparar propiedades solo puede incluir ítems **visibles en la página actual** (hasta 5), porque el modal ya no tiene el catálogo completo en memoria.
- Filtros numéricos libres (precio min/max, m²) aplican al **salir del campo** (`onBlur`) para evitar navegaciones excesivas.

## Próxima etapa (opcional)

- Payload aún más liviano: tipo `PropertyCardLite` + API de detalle para comparación.
- Índice invertido o servicio de búsqueda si el catálogo crece por encima de lo razonable para filtrar en RAM por request.
