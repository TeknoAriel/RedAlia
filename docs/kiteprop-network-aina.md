# KiteProp — red AINA / misma fuente que el producto en producción

Integración **server-only** para alinearse con lo que hoy consume **AINA** contra la API de KiteProp (no el JSON de difusión). El catálogo público, el buscador, el MCP y la Home **no** cambian en esta fase: solo hay **cliente**, **mapeo hacia el modelo público** y **ruta de auditoría** opcional.

## Variables de entorno

### Contrato mínimo (AINA / red)

| Variable | Rol |
|----------|-----|
| **`KITEPROP_API_BASE_URL`** | Base REST (default en código: `https://www.kiteprop.com/api/v1`). |
| **`KITEPROP_API_USER`** | Email o usuario para `POST …/auth/login`. |
| **`KITEPROP_API_PASSWORD`** | Contraseña para login. **Nunca** en frontend. |
| **`KITEPROP_NETWORK_ID`** | Identificador de red (sustituye `{networkId}` en paths por defecto). |
| **`KITEPROP_NETWORK_TOKEN`** | Token de red (cabecera configurable; opcionalmente Bearer si flag abajo). |
| **`KITEPROP_NETWORK_AUDIT_ENABLED`** | Debe ser `1` para habilitar `GET /api/test-kiteprop-network-audit`. |
| **`KITEPROP_AUTH_LOGIN_PATH`** | Default `auth/login`. |
| **`KITEPROP_NETWORK_ORGANIZATIONS_PATH`** | Path relativo opcional; puede incluir `{networkId}`. Si falta y hay `NETWORK_ID`: default `/networks/{networkId}/organizations`. |
| **`KITEPROP_NETWORK_PROPERTIES_PATH`** | Idem; default `/networks/{networkId}/properties`. |

### Opcionales adicionales (ya soportados en código)

| Variable | Rol |
|----------|-----|
| **`KITEPROP_NETWORK_TOKEN_AS_BEARER`** | Si es exactamente `1`, el Bearer de las peticiones GET de red es `KITEPROP_NETWORK_TOKEN`. Por defecto **no**: se espera JWT de login (o `KITEPROP_ACCESS_TOKEN` / secret vía Bearer de env). |
| **`KITEPROP_AUTH_LOGIN_USER_FIELD`** / **`KITEPROP_AUTH_LOGIN_PASSWORD_FIELD`** | Nombres de campos del JSON de login (default `email` / `password`). |
| **`KITEPROP_NETWORK_ID_HEADER`** / **`KITEPROP_NETWORK_TOKEN_HEADER`** | Nombres de cabecera (default `X-Network-Id`, `X-Network-Token`). |
| **`KITEPROP_ACCESS_TOKEN`** / **`KITEPROP_API_SECRET`** | Bearer alternativo si no hay login por password. Ver `lib/kiteprop/env-credentials.ts`. |

**No hardcodear** credenciales en el repo. Los defaults de **path** son plantillas razonables; si AINA usa otros paths, copiarlos del código de AINA a las variables `…_PATH`.

## Auth flow

1. Si `KITEPROP_NETWORK_TOKEN_AS_BEARER=1` y hay `KITEPROP_NETWORK_TOKEN` → Bearer = ese token (+ cabecera de id de red si aplica).
2. Si no: si hay `KITEPROP_API_USER` y `KITEPROP_API_PASSWORD` → `POST` login (`KITEPROP_AUTH_LOGIN_PATH`), extraer `access_token` / `token` / anidados comunes; cache en memoria del proceso (~50 min).
3. Si no: Bearer desde `KITEPROP_ACCESS_TOKEN` o `KITEPROP_API_SECRET` (`resolveRestBearerTokenOrNull`).
4. Peticiones GET de red: `Authorization: Bearer …` + cabeceras `X-Network-Id` / `X-Network-Token` cuando las variables están definidas (salvo token usado solo como Bearer en el paso 1).

## Endpoints consumidos (plantilla)

- `POST {base}/{KITEPROP_AUTH_LOGIN_PATH}` — cuerpo `{ [userField]: user, [passwordField]: pass }`.
- `GET {base}/{organizationsPath}` — lista de organizaciones de red.
- `GET {base}/{propertiesPath}` — lista de propiedades de red.

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
| **`properties`** | Conteos, `firstPropertyKeyNames`, `nestedOnFirstProperty` (claves bajo `advertiser` / `organization` / …), `organizationLinkHints`, `advertiserObjectKeyNames`, `advertiserIdHints`, `mappedAdvertiserDraftSample`, `socioResolutionSample`, `advertiserScan`. |
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

## Archivos

- `lib/kiteprop-network/*` — cliente, extracción de anunciante, shape-audit, `redalia-socio-network-model.ts`.
- `lib/kiteprop/client.ts` — `kitepropPostJson`, `bearerOverride`, `extraHeaders` en GET, auth `none` en POST.
- `app/api/test-kiteprop-network-audit/route.ts` — auditoría controlada.
- `scripts/kiteprop-network-audit.mjs` — script `npm run audit:kiteprop-network`.
