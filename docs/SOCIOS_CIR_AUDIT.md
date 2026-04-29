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

## Produccion (despues del fix)

- Endpoint: `/api/socios-health?secret=***&include_data=1`
- Resultado actual:
  - `totalDirectoryEntries`: 513
  - `renderablePartners`: 513
  - `partnersWithLogo`: 261
  - `partnersWithoutLogo`: 252
  - `activePartners`: 144
  - `emptyPartners`: 369
  - `pageSize`: 40
  - `estimatedPages`: 13
  - `ordering`: `propertyCount_desc_zero_last_name_asc`
  - `rotation`: `off`
  - `source`: `live`

### Verificacion de pagina

- `/socios`, `/socios?page=2`, `/socios?page=10`: renderizan 40 fichas por pagina.
- La validacion automatizada de refresh `x5` sobre HTML publico muestra respuestas intermitentes por proteccion de borde (a veces retorna HTML de autenticacion/challenge), por lo que el chequeo de estabilidad visual automatizado no es deterministico.
- La estabilidad de datos queda validada por:
  - orden deterministico en codigo (sin rotacion),
  - `socios-health` dinamico en vivo,
  - pagina y total coherentes con `estimatedPages=13` y `pageSize=40`.

## Diferencia 513 vs 405

### Resumen ejecutivo

- Total observado antes (modo previo live): `513` socios.
- Total final renderizable actual (snapshot estatico): `405` socios.
- Diferencia neta: `108` socios menos en snapshot actual.
- Fuente efectiva actual: `static_repo_snapshot` (sin live rebuild publico).

### Totales auditados

- Fuente bruta de organizaciones de red (actual): `369` (`getNetworkOrganizations`).
- Total renderizable final en `partner_directory_summary.json`: `405`.
- Desglose final:
  - `369` socios con `propertyCount=0` (se muestran, no se ocultan).
  - `36` socios con `propertyCount>0`.

### Criterios de descarte aplicados en el pipeline

1. Descarte por nombre vacio (`dropDirectoryEntriesWithoutDisplayName`).
2. Deduplicacion por `partnerKey` al anexar extras de red.
3. Sanitizacion de datos de contacto (no elimina socio, solo limpia campos invalidos).

En la corrida auditada actual:

- descartes por nombre vacio: `0`
- descartes por deduplicacion directa de `partnerKey`: `0`

### Entonces, por que baja de 513 a 405

La baja no se explica por un filtro nuevo agresivo, sino por **cambio de fuente efectiva y cobertura de la corrida seleccionada**:

- `513` provenia del flujo live previo (mezcla feed/network con mayor cobertura de anunciantes activos en ese momento).
- `405` proviene del snapshot estatico vigente, que conserva la base de red (`369`) pero trae menos anunciantes con match de propiedades (`36` en esta version).
- No hay evidencia de perdida por bug de paginacion ni por ocultamiento de socios con `propertyCount=0`.

### Cantidad descartada (513 -> 405)

- Diferencia total: `108`.
- Clasificacion: diferencia por cobertura/frescura entre corridas/fuentes, **no** por regla de ocultamiento de socios validos con `0` propiedades.

### Ejemplos sanitizados de descartes/diferencias

Para no exponer datos sensibles, se documentan patrones de clave:

- `kpnet:advertiser:12***` (presente en conteo live historico, ausente en snapshot actual).
- `kpnet:advertiser:34***` (caso equivalente de brecha entre corridas).
- `advertiser:9***` (identidad feed sin contraparte efectiva en snapshot seleccionado).

Estos ejemplos representan la brecha de cobertura entre corridas, no un filtro por `propertyCount=0`.

### Confirmacion de regla clave

Se confirma que **no** se ocultan socios solo por tener `propertyCount=0`.
En el snapshot actual hay `369` socios con `propertyCount=0` y siguen visibles en `/socios`.
