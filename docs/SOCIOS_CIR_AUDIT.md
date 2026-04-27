# SOCIOS CIR Audit

## Alcance

- Fecha auditoria: 2026-04-26
- Scope: solo `/socios`, `/socios/[slug]` y `/api/socios-health`
- Fuera de scope: Home, `/propiedades`, contenido comercial, navegacion general

## Produccion (antes de este ajuste)

- Endpoint auditado: `/api/socios-health?secret=***&include_data=1`
- `totalDirectoryEntries`: 514
- `activePartners`: 0
- `emptyPartners`: 514
- `pageSize`: 40
- `source`: `live`
- `partnerDirectorySourceMode` (ingest meta): `network`
- `partnerDirectoryExtraDraftsCount`: 369
- `partnerDirectoryNetworkAdvertiserDraftsCount`: 145

### Render y paginacion en produccion

- `/socios`: 40 cards
- `/socios?page=2`: 40 cards
- `/socios?page=10`: 40 cards
- Refresh `x5` en `/socios`: orden estable (`stableRefresh5: true`)
- Logos detectados por HTML:
  - pagina 1: 41 imagenes (incluye no solo logos de cards)
  - pagina 2: 33 imagenes
  - pagina 10: 10 imagenes

## Hallazgo raiz

El directorio se arma con claves de red `kpnet:*` y luego recalcula `propertyCount` con `propertyMatchesPartnerKey`.
Cuando la clave de red no coincide por ID con la clave normalizada de propiedades del feed JSON, el conteo cae a `0`.
Eso explica `activePartners: 0` aun con 2953 propiedades publicadas.

Archivos involucrados en el flujo:

- `lib/public-data/partner-directory-resolve.ts`
- `lib/agencies.ts`
- `lib/public-data/directory-order.ts`
- `app/api/socios-health/route.ts`
- `app/socios/page.tsx`
- `components/public-directory/PartnerDirectoryCard.tsx`

## Correcciones aplicadas en esta iteracion

1. Recalculo de `propertyCount` robusto:
   - mantiene matching por `partnerKey`
   - agrega fallback por `displayName` normalizado para entradas `kpnet:*`
2. Orden fijo sin rotacion:
   - `propertyCount > 0` primero
   - luego `propertyCount` descendente
   - empate por nombre ascendente (`es`)
3. Health de socios enriquecido:
   - `renderablePartners`
   - `partnersWithLogo`
   - `partnersWithoutLogo`
   - `estimatedPages`
   - `ordering`
   - `rotation`
4. Cards de socios mas compactas y sobrias:
   - menor padding
   - CTA corto "Ver propiedades"
   - texto para cero: "Sin propiedades publicadas"
5. Se elimina mensaje de clasificacion visual por activos/inactivos en `/socios`.

## Validacion local

En `next start` local con `.env.production.local`:

- `/api/socios-health?secret=***&include_data=1` responde 200
- pero retorna `totalDirectoryEntries: 0` (entorno local sin datos de red equivalentes a produccion)

Conclusion: la validacion funcional definitiva de conteos debe cerrarse en preview/produccion.
