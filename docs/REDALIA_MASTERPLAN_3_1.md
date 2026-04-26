# Redalia Masterplan 3.0.1

Posicionamiento rector:

> Redalia es una red inmobiliaria colaborativa chilena que conecta corredoras, propiedades y oportunidades, apoyada por tecnología KiteProp.

## Principios de ejecución

- No rehacer todo.
- No romper diseño ni branding.
- No cambiar fuente principal de datos sin evidencia fuerte.
- No hacer cambios masivos en un solo merge.
- Priorizar estabilidad y performance antes de nuevas capas comerciales.

## Ruta por fases (control de riesgo)

## Fase 0 — Foundation / Control de riesgo (actual)

- Auditar producción y repo.
- Congelar baseline técnico.
- Activar endpoints de diagnóstico protegidos (`/api/catalog-health`, `/api/socios-health`).
- Ordenar documentación operativa y riesgos.

## Fase 1 — Navegación y claridad comercial

- Menú objetivo:
  - Inicio
  - Qué es Redalia
  - Catálogo (Propiedades, Socios/Corredoras)
  - Servicios (Canje y colaboración, Membresía, Capacitación, Herramientas para corredoras)
  - Únete
  - Contacto
- Evitar links principales que terminen en 404.
- Mantener rutas públicas vigentes (`/propiedades`, `/socios`) hasta consolidación.

## Fase 2 — Estabilidad de socios

- Consolidar snapshot persistente para directorio.
- Orden determinístico: activos primero, luego inactivos.
- Rotación solo en empates y por período estable (semanal recomendado).
- Paginación estable (40 por página recomendado).

## Fase 3 — Performance de catálogo de propiedades (P0)

- Resolver lentitud y payload excesivo del listado.
- Garantizar paginación y filtros server-side.
- Cargar solo datos mínimos por card/listado.
- Mantener detalle completo para ficha, no para grilla.
- Medición antes/después obligatoria.

## Fase 4 — Home comercial y conversión

- Ajustar mensajes y jerarquía sobre bloques existentes (sin rediseño total).
- Refuerzo de propuesta de valor colaborativa + respaldo KiteProp.

## Fase 5 — Operación y observabilidad

- Health checks maduros + runbook post-deploy.
- Métricas de estabilidad/performance y criterios de rollback.
- Cierre documental (operación + producto).

## Criterios de no-regresión

- `/propiedades` y `/socios` siempre funcionales.
- No romper navegación desktop/mobile.
- No exponer secretos en endpoints.
- No degradar estabilidad de ingest.
- Cada fase con smoke tests y verificación manual de rutas críticas.
