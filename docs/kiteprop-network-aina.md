# KiteProp — red AINA / misma fuente que el producto en producción

Integración **server-only** para alinearse con lo que hoy consume **AINA** contra la API de KiteProp (no el JSON de difusión). El catálogo público, el buscador, el MCP y la Home **no** cambian en esta fase: solo hay **cliente**, **mapeo hacia el modelo público** y **ruta de auditoría** opcional.

## Variables de entorno

### Contrato mínimo (AINA / red)

| Variable | Rol |
|----------|-----|
| **`KITEPROP_API_BASE_URL`** | Base REST (default en código: `https://www.kiteprop.com/api/v1`). |
| **`KITEPROP_API_USER`** | Email o usuario para `POST …/auth/login`. |
| **`KITEPROP_API_PASSWORD`** | Contraseña para login. **Nunca** en frontend. |
| **`KITEPROP_NETWORK_ID`** | Id de red (segmento de URL, mismo que AINA `network_id`). |
| **`KITEPROP_NETWORK_TOKEN`** | Token de red: en los **defaults AINA** va en el **path** (`…/networks/{id}/{token}/…`), no como Bearer. Opcionalmente cabecera si usás paths custom sin token en URL. |
| **`KITEPROP_NETWORK_AUDIT_ENABLED`** | Debe ser `1` para habilitar `GET /api/test-kiteprop-network-audit`. |
| **`KITEPROP_PROPERTIES_SOURCE`** | `json` (default, feed difusión). `network` / `aina`: **solo** API de red para propiedades (sin fallback al feed JSON). `network_fallback_json`: red primero, luego feed JSON si falla o 0 ítems. Detalle: `docs/catalog-operaciones.md`. |
| **`KITEPROP_AUTH_LOGIN_PATH`** | Default `auth/login`. |
| **`KITEPROP_NETWORK_ORGANIZATIONS_PATH`** | Opcional. Placeholders `{networkId}` y `{networkToken}`. Si falta: `GET /networks/{id}/{token}/organizations` (relativo a `KITEPROP_API_BASE_URL`). |
| **`KITEPROP_NETWORK_PROPERTIES_PATH`** | Opcional. Si falta: `GET /properties/network/{id}/{token}` + query fija `status=active` (igual que AINA). |

### Opcionales adicionales (ya soportados en código)

| Variable | Rol |
|----------|-----|
| **`KITEPROP_NETWORK_TOKEN_AS_BEARER`** | Si es `1`, el Bearer de las GET de red es `KITEPROP_NETWORK_TOKEN` (caso raro; AINA usa JWT de login + token en path). |
| **`KITEPROP_AUTH_LOGIN_USER_FIELD`** / **`KITEPROP_AUTH_LOGIN_PASSWORD_FIELD`** | Nombres de campos del JSON de login (default `email` / `password`). |
| **`KITEPROP_NETWORK_ID_HEADER`** / **`KITEPROP_NETWORK_TOKEN_HEADER`** | Solo si el token **no** va en la URL: cabeceras (default `X-Network-Id`, `X-Network-Token`). Con defaults AINA suelen ir **vacías**. |
| **`KITEPROP_ACCESS_TOKEN`** / **`KITEPROP_API_SECRET`** | Bearer alternativo si no hay login por password. Ver `lib/kiteprop/env-credentials.ts`. |

**No hardcodear** credenciales en el repo. Los defaults de **path** son plantillas razonables; si AINA usa otros paths, copiarlos del código de AINA a las variables `…_PATH`.

## Auth flow (AINA / `KitePropApi`)

1. Si `KITEPROP_NETWORK_TOKEN_AS_BEARER=1` y hay `KITEPROP_NETWORK_TOKEN` → Bearer = ese token.
2. Si no: si hay `KITEPROP_API_USER` y `KITEPROP_API_PASSWORD` → `POST` login, leer **`data.access_token`** (y otros formatos compatibles); cache en memoria del proceso (~50 min).
3. Si no: Bearer desde `KITEPROP_ACCESS_TOKEN` o `KITEPROP_API_SECRET` (`resolveRestBearerTokenOrNull`).
4. GET de red: **`Authorization: Bearer <JWT>`** (mismo patrón que `Http::withToken` en Laravel). Con paths por defecto AINA, **no** se envían `X-Network-*` porque `network_id` y `network_token` ya van en la URL.

## Endpoints consumidos (AINA)

Relativos a `{base}` = `KITEPROP_API_BASE_URL` (default `https://www.kiteprop.com/api/v1`):

- `POST {base}/auth/login` — JSON `{ "email": "…", "password": "…" }` (nombres configurables).
- `GET {base}/networks/{networkId}/{networkToken}/organizations`
- `GET {base}/properties/network/{networkId}/{networkToken}?status=active`

El **shape real** depende del contrato desplegado: usar la ruta de auditoría con credenciales reales y revisar `firstPropertyKeyNames` / `unmappedFirstKeys`.

## Shape resumido (heurística en código)

- **Organizaciones:** se intenta extraer un array desde `{ success, data }`, o el primer array encontrado en `data`. Campos probados para mapeo a `PublicPartnerDirectoryRowDraft`: `id`, `name`, logos y contactos bajo nombres frecuentes (`logo_url`, `email`, …).
- **Propiedades:** misma extracción de array. Para enlace a organización, `extractOrganizationLinkHints` revisa claves como `organization_id`, `agency_id`, `organization`, etc.
- **Anunciante:** `extractAdvertiserObject` busca en la propiedad claves como `advertiser`, `announcer`, `publisher` (objeto). La auditoría devuelve solo **nombres de claves** del primer objeto encontrado y un barrido de hasta 30 ítems (`advertiserScan`).

## Respuesta de `GET /api/test-kiteprop-network-audit` (sin secretos)

Cuando `KITEPROP_NETWORK_AUDIT_ENABLED=1` y el servidor Next tiene las credenciales cargadas:

| Campo raíz | Contenido |
|------------|-------------|
| **`ok`** | `true` si organizaciones y propiedades respondieron sin error de cliente. |
| **`auth`** | `{ ok, bearerConfigured, extraHeaderNames }` o `{ ok: false, error }`. **No** incluye el token. |
| **`organizations`** | Conteos, `httpStatus`, `firstOrganizationKeyNames` (solo claves), `mappedDraftSample` (`partnerKey`, `displayName`, `scope`). |
| **`properties`** | Conteos, `firstPropertyKeyNames`, `nestedOnFirstProperty` (claves bajo `advertiser` / `organization` / …), `organizationLinkHints`, `advertiserObjectKeyNames`, `advertiserIdHints`, `mappedAdvertiserDraftSample`, `socioResolutionSample`, `advertiserScan`, **`socioResolutionStats`** (conteo en N primeras fichas: `advertiser` / `organization_only` / `unmapped`). |
| **`note`** | Recordatorio de no volcar PII; pegar JSON agregado en esta doc o ticket. |

## Relación propiedad ↔ anunciante ↔ organización (modelo Redalia)

1. **Ficha canónica “Socio” (directorio / solapa Socios):** priorizar **anunciante** → `partnerKey` = `kpnet:advertiser:{id}` (`resolveSocioFromNetworkProperty` en `lib/kiteprop-network/redalia-socio-network-model.ts`). Es la granularidad alineada con “cada propiedad trae anunciante”.
2. **Organización / agencia anidada en la propiedad:** **contexto** (matriz, branding institucional); se mapea a otro borrador `kpnet:org:{id}` cuando el objeto existe bajo `organization` o `agency`.
3. **Fallback:** sin anunciante parseable pero con `organization` o `agency` → socio único desde organización (`organization_only`).
4. **Ligar propiedad → socio público:** usar la misma resolución que para Socios (`advertiser` primero; si no, org). El `partnerKey` canónico queda estable para joins con el catálogo cuando se enriquezca desde red.

## Auditoría real (rellenar tras ejecutar con credenciales)

**No commitear** tokens ni payloads con PII. Tras `npm run dev` + `npm run audit:kiteprop-network` (o `curl` a la URL de preview con el flag), pegar aquí **solo**:

- `firstOrganizationKeyNames`
- `firstPropertyKeyNames`, `nestedOnFirstProperty`, `advertiserScan`
- `organizationLinkHints`, `advertiserIdHints` (estructura sin valores si aplica)
- `mappedDraftSample` / `mappedAdvertiserDraftSample` / `socioResolutionSample`

Si el shape difiere (p. ej. anunciante bajo otra clave), ajustar `ADVERTISER_OBJECT_KEYS` en `extract-advertiser.ts` y documentar el cambio.

## Campos útiles vs sensibles

- **Útiles para modelo público:** nombre visible, id estable, logo URL pública, teléfonos/correos **ya pensados para difusión** (el mapper pasa por la misma lógica de calidad que el feed cuando se integre).
- **Sensibles / internos:** tokens, emails personales de operadores, payloads completos de cuenta. **No** exponer en la ruta de auditoría ni en la UI; la ruta solo devuelve **nombres de claves** y conteos.

## Mapeo a Redalia

- `mapUnknownNetworkOrganizationToPublicDraft` → `PublicPartnerDirectoryRowDraft` con `partnerKey` prefijado `kpnet:org:{id}` para no chocar con claves del feed.
- `mapUnknownNetworkAdvertiserToPublicDraft` → mismo tipo con `kpnet:advertiser:{id}` y `scope: "advertiser"`.
- La UI debe seguir consumiendo solo tipos de `lib/public-data/*`; en esta fase **no** se cablea el directorio público a esta fuente.

## Estrategia de migración (recomendación)

| Área | Recomendación |
|------|----------------|
| **Socios / directorio** | Tratar la **red API** como **fuente principal de socios/publicadores** cuando el producto lo habilite: deduplicar por `partnerKey` canónico del anunciante; usar organización solo como contexto o fallback. |
| **Catálogo público de propiedades** | Mantener el **feed JSON** como **fuente principal** visible (buscador, listados, MCP sin cambios en esta fase). Enriquecer ítems con datos de red **por id estable** cuando exista mapeo (galería, badges, socio resuelto), sin reemplazar el feed de golpe. |
| **Feature flag / comparación** | **Sí** conviene un flag (p. ej. origen directorio = `feed` \| `network` \| `merge`) y, antes de producción, una corrida de **comparación** conteos + muestra de `partnerKey` resueltos vs feed para detectar huecos de anunciante. |

## Recomendación operativa

1. Configurar env según AINA y llamar `GET /api/test-kiteprop-network-audit` (solo con flag `1`).
2. Ejecutar `npm run audit:kiteprop-network` contra local o preview (`AUDIT_BASE_URL`).
3. Comparar `organizationLinkHints` y keys de la primera propiedad con el modelo del feed (`NormalizedProperty` / socios).
4. Si los paths por defecto fallan (404), sobreescribir `KITEPROP_NETWORK_*_PATH` con los paths exactos de AINA.
5. Volcar en la sección **Auditoría real** arriba el shape agregado (solo claves y muestras no sensibles).
6. Cuando el shape sea estable, activar **feature flag** de origen del directorio (sin tocar MCP, Home, buscador ni UI pública hasta decisión explícita).

## Verificar ingest (propiedades + inmobiliarias) sin levantar Next

Script **standalone** (misma auth y paths que el código en `lib/kiteprop-network`):

```bash
npm run verify:network-ingest
```

Cargá antes las variables (`KITEPROP_API_USER`, `KITEPROP_API_PASSWORD`, `KITEPROP_NETWORK_ID`, `KITEPROP_NETWORK_TOKEN`, opcional `KITEPROP_API_BASE_URL`). Imprime JSON con conteos y sale con código **1** si falla login, HTTP de listados o si los conteos quedan por debajo de `NETWORK_VERIFY_MIN_PROPERTIES` / `NETWORK_VERIFY_MIN_ORGANIZATIONS` (default **1** cada uno).

En GitHub: workflow **Verificar ingest API red** (`network-ingest-verify.yml`), manual, usando los mismos secretos/variables que documenta la tabla de arriba.

## Archivos

- `lib/kiteprop-network/*` — cliente, extracción de anunciante, shape-audit, `redalia-socio-network-model.ts`.
- `lib/kiteprop/client.ts` — `kitepropPostJson`, `bearerOverride`, `extraHeaders` en GET, auth `none` en POST.
- `app/api/test-kiteprop-network-audit/route.ts` — auditoría controlada.
- `scripts/kiteprop-network-audit.mjs` — script `npm run audit:kiteprop-network`.
