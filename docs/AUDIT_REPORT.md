# AUDIT REPORT — Redalia Masterplan 3.0.1 (Primera pasada)

Fecha: 2026-04-26  
Scope: auditoría de producción + auditoría de repo + propuesta de plan por fases.  
Regla aplicada: **sin implementar cambios estructurales nuevos en esta pasada**.

## 1) Resumen ejecutivo

- Redalia tiene una base sólida y consistente con el enfoque híbrido (propiedades JSON + socios network), pero presenta dos riesgos operativos claros:
  - **Performance de catálogo de propiedades**: la ruta pública actual en producción entrega HTML extremadamente pesado (indicador de procesamiento/render excesivo en página).
  - **Volatilidad/consistencia de socios**: hay señales históricas de inestabilidad y actualmente existe mezcla de estrategias (memoria de proceso, rotación configurable, capas nuevas aún no desplegadas).
- Navegación: la estructura objetivo propuesta (Inicio, Qué es, Catálogo, Servicios, Únete, Contacto) **existe en repo local**, pero en producción todavía hay evidencia de versiones previas/mixtas.
- Estado de repo: hay una cantidad grande de cambios sin commit en `main` local. Antes de mover a implementación faseada conviene cerrar este delta con criterio de release.

## 2) Auditoría de producción (www.redalia.cl)

## 2.1 Rutas y tiempos observados (medición HTTP)

- `/` → `200`, ~53s, ~107 KB HTML
- `/propiedades` → `200`, ~64s, ~17.7 MB HTML
- `/propiedades?page=2` → `200`, ~76s, ~17.7 MB HTML
- `/socios` → `200`, ~54s, ~146 KB HTML
- `/socios?page=2` → `200`, ~62s, ~140 KB HTML
- `/catalogo` → `404`

Interpretación:
- **Muy crítico**: `/propiedades` es anormalmente pesado/lento para una página de listado.
- `/catalogo` no está activo en producción (aunque existe en estado local de repo).

## 2.2 Validaciones funcionales solicitadas

- Home comunica identidad Redalia: **sí** (hay narrativa de red colaborativa).
- Vínculo tecnológico con KiteProp: **sí** (menciones presentes).
- Navegación desktop: se detectan items principales; hay señales de coexistencia de variantes de menú.
- Navegación mobile: no se hizo inspección visual con device real en esta corrida (sin browser interactivo), queda pendiente en smoke manual UI.
- `/socios` y `/socios?page=2`: ambos `200`, con paginación visible.
- `api` diagnóstico:
  - `/api/test-catalog-uncached` → `200` con datos completos.
  - `/api/catalog-health` y `/api/socios-health` → `404` en producción actual.

## 2.3 Señales del endpoint de catálogo uncached

Datos observados:
- `totalProperties`: 2962
- `withImages`: 2958
- `directoryEntries`: 515
- `directoryWithLogo`: 261
- `kitepropPropertiesSourceMode`: `json`
- `partnerDirectorySourceMode`: `network`
- `networkOrganizationsErrorCode`: `null`
- `partnerDirectoryOverlayErrorCode`: `null`

Conclusión:
- El ingest uncached está sano en esta medición puntual.
- El cuello principal no parece ser “fuente caída”, sino **arquitectura de render/listado**.

## 2.4 Limitaciones de esta auditoría de producción

- No se ejecutó Lighthouse ni captura de consola del navegador con sesión visual (se usó auditoría HTTP + inspección de contenido).
- No se validó UX táctil real mobile (pendiente en fase de smoke UI).

## 3) Auditoría del repo

## 3.1 Stack y estructura

- Framework: Next.js App Router (`next` 16.x, React 19.x).
- Rutas principales: `/`, `/propiedades`, `/socios`, `/servicios`, `/que-es`, `/contacto`, `/unete`, `/planes`, etc.
- Existen componentes dedicados para:
  - Home (`app/page.tsx` + secciones)
  - Navbar (`components/layout/Navbar.tsx`)
  - Catálogo propiedades (`components/properties/*`, `app/propiedades/page.tsx`)
  - Socios (`app/socios/page.tsx`, `components/public-directory/*`)

## 3.2 Estado de trabajo actual en git (local)

`main...origin/main` con múltiples archivos modificados/no trackeados (catálogo, socios, navbar, docs, endpoints health, snapshots).  
Riesgo de release: **alto** si no se ordena por fases/PRs chicos.

## 3.3 Hallazgos técnicos por tema

### Propiedades

- En estado local ya existe una capa `catalog-query` orientada a filtro/orden/paginación en servidor.
- En producción (commit vigente), la ruta `/propiedades` sigue mostrando síntoma de payload/render masivo.
- `force-dynamic` había estado presente en rutas clave históricamente; hoy convive con ajustes ISR en local.

### Socios

- `directory-order.ts` ya implementa orden determinístico de base (activos primero, luego tipo/nombre) con rotación opcional por empates.
- `load-catalog-snapshot.ts` tiene fallback en memoria de proceso para drafts de socios (útil, pero insuficiente solo en serverless).
- En local existe propuesta de snapshot persistente (`lib/public-data/partner-directory-snapshot-persist.ts`, helper estable).
- En producción actual, esa capa no está activa todavía (health endpoints 404 y `/catalogo` 404 son señal de desfase deploy vs repo local).

### Diagnóstico/health

- En local hay endpoints de salud nuevos.
- En producción todavía no están disponibles.

## 4) Problemas detectados por severidad

## P0 (crítico)

1. **Rendimiento de `/propiedades`**: respuesta extremadamente pesada/lenta.
   - Impacto: UX, SEO, conversiones, costo servidor.
   - Rutas/archivos probables: `app/propiedades/page.tsx`, `components/properties/PropertiesExplorer.tsx`, `PropertyCard.tsx`, pipeline de filtro/render.

2. **Desalineación repo vs producción** (funciones nuevas no desplegadas).
   - Impacto: decisiones sobre datos/UX no verificables en prod real.

## P1 (alto)

3. **Estrategia de estabilidad de socios incompleta en prod** (persistencia inter-instancia no confirmada).
   - Riesgo de fluctuación si falla red y cambia instancia.
   - Archivos clave: `load-catalog-snapshot.ts`, `directory-order.ts`, capa snapshot persistente.

4. **Navegación potencialmente sobrecargada/mixta** entre versiones.
   - Impacto: claridad comercial y foco de conversión.

## P2 (medio)

5. **Falta de health checks desplegados** para observabilidad operativa.
6. **Ruta `/catalogo` no disponible en prod** pese a existir intención en repo.

## 5) Quick wins seguros (sin rediseño)

1. Publicar endpoints internos de health protegidos por secret.
2. Activar en prod la ruta canónica de catálogo (`/catalogo`) manteniendo `/propiedades`.
3. Confirmar paginación server-side efectiva (no enviar listado completo al cliente).
4. Cerrar menú objetivo (sin eliminar contenido; solo reubicar).
5. Asegurar snapshot persistente para socios (KV) + fallback controlado.

## 6) Cambios que NO conviene hacer ahora

- Rehacer Home completa en una sola PR.
- Cambiar branding o dirección visual general.
- Cambiar fuente de verdad de propiedades o socios.
- Agregar nuevas fuentes de datos externas.
- Refactor “big bang” de todo el catálogo y socios en un único deploy.

## 7) Archivos críticos a tocar (fase implementación)

- Navegación: `components/layout/Navbar.tsx`
- Propiedades:
  - `app/propiedades/page.tsx`
  - `app/catalogo/page.tsx` (si se consolida)
  - `components/catalog/CatalogListingPage.tsx`
  - `components/properties/PropertiesExplorer.tsx`
  - `components/properties/PropertyCard.tsx`
  - `lib/properties/catalog-query.ts`
- Socios:
  - `app/socios/page.tsx`
  - `app/socios/[slug]/page.tsx`
  - `lib/public-data/directory-order.ts`
  - `lib/public-data/get-stable-partner-directory.ts`
  - `lib/public-data/partner-directory-snapshot-persist.ts`
  - `lib/catalog-ingest/load-catalog-snapshot.ts`
- Observabilidad:
  - `app/api/catalog-health/route.ts`
  - `app/api/socios-health/route.ts`
  - `lib/diagnostics/redalia-health-auth.ts`

## 8) Archivos que conviene NO tocar en Fase 1

- `app/page.tsx` (más allá de ajustes mínimos de data source estable)
- MCP/capa de integración no relacionada al problema inmediato
- arquitectura global del sitio fuera de nav + listados
- buscador “profundo” fuera del alcance de performance server-side del catálogo

## 9) Plan por fases (Masterplan 3.0.1)

## Fase 1 — Navegación + claridad comercial (bajo riesgo)

- Consolidar menú principal objetivo y submenús Catálogo/Servicios.
- Verificar desktop + mobile + anchors/rutas existentes.
- Sin tocar data pipelines.

## Fase 2 — Estabilidad de socios

- Confirmar snapshot persistente (KV recomendado) en producción.
- Orden determinístico + rotación semanal solo en empates.
- Paginación 40 y validación de “activos primero”.
- Health `/api/socios-health`.

## Fase 3 — Performance catálogo propiedades

- Garantizar paginación/filter server-side.
- Payload de card mínimo.
- No cargar campos pesados de detalle en listado.
- Ajustar caché/revalidate coherente.
- Health `/api/catalog-health`.

## Fase 4 — Home comercial y conversión (sin rediseño total)

- Ajuste de bloques/mensajes sobre lo existente.
- CTA principal y narrativa “red colaborativa + tecnología KiteProp”.

## Fase 5 — Observabilidad y operación

- Runbook post-deploy.
- Métricas base vs after.
- Documentación final de operación.

## 10) Recomendación técnica snapshot/cache

- **Socios**: `live -> snapshot persistente (KV) -> último snapshot válido -> estado vacío controlado`.
- **Propiedades**:
  - listado con “summary model” (card fields mínimos),
  - detalle completo solo en ficha.
- Evitar depender solo de memoria de proceso para estabilidad en serverless.

## 11) Recomendación UX navegación/Home

- Navegación objetivo:
  - Inicio
  - Qué es Redalia
  - Catálogo (Propiedades, Socios/Corredoras)
  - Servicios (Canje y colaboración, Membresía, Capacitación, Herramientas para corredoras)
  - Únete
  - Contacto
- Home: iterar por capas sobre bloques existentes; no rehacer de cero.

## 12) Métricas base actuales (antes de optimizar)

- `/propiedades` HTML: ~17.7 MB (muy alto)
- `/propiedades` tiempo HTTP observado: ~64–76s (muy alto)
- `/socios` HTML: ~140–146 KB
- `/socios` tiempo HTTP observado: ~54–62s
- `/api/test-catalog-uncached`: saludable y consistente en este corte.

## 13) Siguiente Sprint (propuesta concreta)

1. **Cerrar estado git y recortar PR por fases** (evitar merge masivo).
2. Deploy Fase 1 (navegación) + smoke manual desktop/mobile.
3. Deploy Fase 2 (socios estable + health socios) + test de 5 refresh y page-back/page-forward.
4. Deploy Fase 3 (propiedades performance + health catálogo) + medición comparativa de peso/tiempo.
5. Recién después, ajustar Home comercial (Fase 4).

## 14) Sprint 0 / 0.1 ejecutado (bajo riesgo)

- Rama creada: `redalia/sprint-0-1-foundation-nav`.
- Se mantuvo la regla de no tocar performance P0 de propiedades en esta pasada.
- Health checks protegidos implementados:
  - `GET /api/catalog-health?secret=...`
  - `GET /api/socios-health?secret=...`
  - Sin secret válido: `401`.
  - Con secret válido: JSON controlado en modo pasivo (`not_available` para métricas que exigirían cómputo más pesado), con opción `include_data=1` para lectura con datos.
  - Contrato mínimo de respuesta: `ok`, `route`, `timestamp`, `mode`, `durationMs`, `warnings`, más conteos cuando estén disponibles.
- Baseline local ejecutado:
  - `pnpm lint` ✅
  - `pnpm typecheck` ✅
  - `pnpm build` ✅
- Prueba local de auth health:
  - `/api/catalog-health` sin secret → `401` ✅
  - `/api/socios-health` sin secret → `401` ✅
  - con secret → JSON `ok` + `route` + `mode` ✅

## 15) Decisiones explícitas de este sprint

- Mantener `/propiedades` como ruta pública principal vigente.
- No promover `/catalogo` en navegación pública hasta cierre de desfase repo/producción.
- No intervenir aún `app/propiedades/page.tsx`, `components/properties/PropertiesExplorer.tsx`, `components/properties/PropertyCard.tsx`, `lib/properties/catalog-query.ts` en este sprint de control.

