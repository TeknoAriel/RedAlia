# Decisión de Arquitectura de Búsqueda

## Contexto

Escala actual:

- Propiedades: ~3k
- Socios: ~500

Objetivo inmediato: resolver P0 de latencia y peso HTML, no agregar complejidad de motor externo sin necesidad.

## Opciones evaluadas

### A) Postgres indexado (o read models persistidos + filtros server-side)

Pros:

- Suficiente para volumen actual.
- Operación simple.
- Menor costo/infra.
- Excelente para filtros combinados + paginación.

Contras:

- Full-text/fuzzy avanzado limitado frente a motores dedicados.

### B) Meilisearch/Typesense

Pros:

- Fuzzy/autocomplete muy rápidos.
- Implementación más liviana que Elastic.

Contras:

- Infra adicional.
- Sin necesidad inmediata para el P0 actual.

### C) Elastic/OpenSearch

Pros:

- Escala grande y scoring complejo.
- Casos avanzados de analítica/search.

Contras:

- Sobrecosto operacional alto para tamaño actual.
- Complejidad innecesaria en esta etapa.

## Decisión

1. Priorizar **read models persistidos + cache + sync** (ya implementado para `/socios` y `/propiedades` listing).
2. Mantener búsqueda/filtros server-side en modelo resumido.
3. Re-evaluar Meilisearch/Typesense solo si aparece necesidad concreta de fuzzy/autocomplete avanzado.
4. Postergar Elastic/OpenSearch hasta que exista evidencia de escala/uso que lo justifique.

## Criterio para escalar de opción

- Tiempo de respuesta p95 > objetivo pese a read models y cache.
- Requerimiento explícito de búsqueda semántica/fuzzy compleja en producción.
- Volumen de catálogo creciendo a orden de decenas de miles con filtros combinados intensivos.
