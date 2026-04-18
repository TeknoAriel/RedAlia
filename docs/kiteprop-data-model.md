# KiteProp — fuentes de datos, entidades y modelo público Redalia

Documentación técnica breve (abril 2026). Fuentes: código del repo, feed JSON ya normalizado, documentación pública agregada en [KiteProp API v1](https://www.kiteprop.com/docs/api/v1/index), y resumen en context7 (`kiteprop_api_v1`). **Credenciales unificadas:** `docs/kiteprop-credentials.md`. **MCP `user-kiteprop`:** en el entorno de desarrollo analizado el servidor MCP reportó error (`mcps/user-kiteprop/STATUS.md`); no se listaron tools MCP desde archivos descriptor — auditar tools cuando el servidor esté operativo. **MVP web:** snapshot agregado opcional → `docs/kiteprop-mcp-redalia-mvp.md` y `lib/kiteprop-mcp/*`.

---

## 1. Fuentes disponibles

| Fuente | Autenticación | Uso en Redalia hoy |
|--------|----------------|-------------------|
| **JSON de difusión** (`KITEPROP_PROPERTIES_URL` o `data/kiteprop-sample.json`) | Público / archivo | **Catálogo de propiedades**, extracción de **agencias / anunciantes / agentes** por propiedad, **directorio Socios**, métricas de hero en `/socios`. |
| **`GET /api/v1/profile`** | Header **`X-API-Key`** (`KITEPROP_API_KEY` o `KITEPROP_API_SECRET`) | Conectividad (`getKitePropProfile`, ruta opcional `/api/test-kiteprop`). **No** se usa aún para UI pública. |
| **`GET /api/v1/users`** | Documentación: header **`Authorization: Bearer`** | `getKitePropUsersPage` con `KITEPROP_ACCESS_TOKEN` o `KITEPROP_API_SECRET`. **No** probado en esta entrega; shape de respuesta no modelado. |
| **`GET /api/v1/properties`** | **Bearer** (`KITEPROP_ACCESS_TOKEN` o `KITEPROP_API_SECRET`) | `getKitePropPropertiesApiPage`; prueba `GET /api/test-kiteprop-properties`. Informe: `docs/kiteprop-api-properties-investigation.md`. **No** sustituye al feed hasta validar paridad y PII. |
| **Detalle de propiedad (API)** | Ejemplos con `success` + `data` | Incluye anidados `user` (id, email, phone, full_name, …) y `organization` (name). **Datos sensibles** — no aptos para copiar tal cual a web pública sin política explícita. |
| **Red AINA (organizaciones / propiedades de red)** | Ver `docs/kiteprop-network-aina.md` | Cliente server-only en `lib/kiteprop-network/*`; **no** alimenta aún el catálogo ni el directorio. Auditoría opcional: `GET /api/test-kiteprop-network-audit` con `KITEPROP_NETWORK_AUDIT_ENABLED=1`. |

**Importante:** la documentación pública mezcla ejemplos con `Authorization: Bearer` para listados; la integración vigente de **profile** usa **`X-API-Key`**. No asumir que la misma key sirve para todos los paths hasta probarlo con KiteProp.

---

## 2. Inventario de entidades (real / derivable)

### Desde el feed JSON (ya mapeado en `lib/kiteprop-adapter.ts` → `NormalizedProperty`)

- **Inmobiliaria / corredora operativa:** `NormalizedProperty.agency` (`PropertyPartner`: id, name, logoUrl, email, phone, mobile, whatsapp, webUrl).
- **Anunciante / socio publicante:** `advertiser`.
- **Agente / oficina asociada a la ficha:** `agentAgency`, `subAgentAgency`.
- **Capa matriz / red en feed:** `masterAgency` — en UI Redalia se filtra u omite según reglas (`master-agency.ts`).
- **Propiedad:** `NormalizedProperty` (incluye `city`, `region`, `zone`, `lastUpdate`, etc.).

**Relación usuario ↔ inmobiliaria en el feed:** no hay “usuario” como entidad de cuenta; hay **objetos contacto** anidados en roles (agency, advertiser, agent…). La relación es **implícita por publicación**.

### Desde API (documentación / ejemplos — no modelado fino en UI)

- **Usuario API:** objeto `user` en detalle de propiedad (id, email, phone, full_name, …).
- **Organización:** objeto `organization` con al menos `name` en ejemplo.
- **Lista `/users`:** entidad “usuario de plataforma” paginada — **respuesta exacta no descrita** en el fragmento consultado.
- **Entidad “socio Redalia”:** **no existe** en KiteProp como tal; “socio” en el sitio es **rol de negocio Redalia** mapeado a **agencia/anunciante** del feed (y filtros de matriz).

---

## 3. Modelo público Redalia (implementado)

Definido en `lib/public-data/types.ts`:

- **`PublicPartnerDirectoryEntry`**: fila del directorio público.
  - `partnerKey`, `publicSlug`, `scope`, `displayName`, `roleLabel`, `listingCtaLabel`, `logoUrl`, `propertyCount`, contactos saneados, `coverageLabels` (hasta 4 ubicaciones por socio).
- **`PublicDirectorySnapshot`**: `entries` (orden final), `featured` (subconjunto para Home), `stats` (`totalListings`, `directoryCount`, `geographicDistinctCount`, `geographicPresenceLabels`).

Construcción: `buildPublicPartnerDirectoryFromFeed` y `buildPublicDirectorySnapshot` en `lib/public-data/from-properties-feed.ts` (catálogo interno vía `extractSociosGridCatalog` + reglas de calidad en `directory-order.ts`, `sanitize-entry.ts`, `labels.ts`).

**No se inventan campos:** solo lo presente en `SocioCatalogEntry` / normalizado o deducible por agregación de ubicaciones en fichas vinculadas.

---

## 4. Capa de adaptación (archivos)

| Archivo | Rol |
|---------|-----|
| `lib/public-data/types.ts` | Tipos del modelo público. |
| `lib/public-data/map-socio-catalog-to-public.ts` | `SocioCatalogEntry` → `PublicPartnerDirectoryEntry`. |
| `lib/public-data/from-properties-feed.ts` | Directorio final + snapshot (featured + stats). |
| `lib/public-data/directory-order.ts` | Normalización de nombre, orden institucional. |
| `lib/public-data/sanitize-entry.ts` | Filtro mínimo de contactos dudosos / inválidos. |
| `lib/public-data/labels.ts` | Textos de rol y CTA sin importar `agencies` en la UI. |
| `lib/public-data/index.ts` | Barrel. |
| `components/public-directory/PartnerDirectoryCard.tsx` | Tarjeta solo con modelo público. |
| `components/public-directory/PartnerProfileView.tsx` | Ficha institucional `/socios/[slug]`. |
| `components/sections/PartnerDirectoryPreview.tsx` | Bloque Home. |
| `app/socios/[slug]/page.tsx` | Ruta de ficha; `notFound` si slug inválido. |
| `lib/public-data/public-slug.ts` | Construcción de `publicSlug`. |
| `lib/public-data/partner-detail.ts` | `PublicPartnerDetail` + texto institucional neutro. |
| `lib/public-data/partner-properties.ts` | Filtro y preview de propiedades por `partnerKey`. |
| `lib/public-data/find-partner.ts` | Resolución slug → entrada. |
| `lib/kiteprop/client.ts` | Soporte opcional **`Authorization: Bearer`** además de **`X-API-Key`**. |
| `lib/kiteprop/get-users.ts` | `GET /users` con Bearer. |
| `lib/kiteprop/get-properties-api.ts` | `GET /properties` con Bearer. |
| `lib/kiteprop/unwrap-envelope.ts` | Helper `{ success, data }` sin tipar `data`. |
| `lib/kiteprop/map-feed-partner-to-public.ts` | Re-export de conveniencia. |

---

## 5. Qué puede mostrarse ya / qué no

### Ya apto (y usado)

- **Directorio Socios:** marcas y contactos **que el propio feed publica**; conteo de publicaciones; cobertura geográfica resumida derivada del catálogo.
- **Home / otras páginas:** conteo de oportunidades y enlaces a catálogo (como antes), reforzados por datos reales del feed cuando hay URL configurada.

### No conviene publicar todavía sin definición explícita

- Payload completo de **`GET /profile`** (puede incluir email/cuenta).
- **`user` de API** con emails/teléfonos de operadores internos.
- **Lista `/users`** hasta conocer permisos, PII y consentimiento.
- **Sustituir el feed por API** sin script de comparación de ids/campos (ver `docs/kiteprop-api-1.md` fase sugerida API-2).

### Para un directorio “institucional serio” faltaría

- Criterio editorial de **quién** entra al directorio (no solo presencia en feed).
- Texto / **descripción** aprobada por cada socio (no existe en el modelo actual).
- **Logos** consistentes (dependen del feed).
- Opcional: endpoint o tabla **Redalia** propia para socios homologados independiente del shape KiteProp.

---

## 6. Variables de entorno nuevas / relevantes

### Una sola secret, distintos “envíos” (MCP vs REST vs POST)

En muchos tenants de KiteProp la **misma** credencial (`kp_…`) sirve para el CRM/MCP y para llamadas HTTP a la API; **no** son dos productos distintos, sino el **mismo secreto** con distinto mecanismo de envío:

| Contexto | Dónde configurás | Cómo viaja el secreto (en Redalia o en el cliente MCP) |
|----------|------------------|--------------------------------------------------------|
| **MCP Cursor** (`github:kiteprop/crm-mcp`) | `~/.cursor/mcp.json` → `KITEPROP_API_TOKEN` | Lo que defina el servidor MCP (p. ej. cabecera tipo la que mostraste en captura; el paquete habla con KiteProp por su cuenta). |
| **`GET /profile`** | `KITEPROP_API_KEY` **o** `KITEPROP_API_SECRET` en `.env` / Vercel | Header **`X-API-Key`**: `lib/kiteprop/env-credentials.ts` + `client.ts`. |
| **`GET /properties`**, **`GET /users`**, etc. | `KITEPROP_ACCESS_TOKEN` **o** `KITEPROP_API_SECRET` | **`Authorization: Bearer …`**. |
| **POST leads** (`KITEPROP_LEAD_POST_URL`) | `KITEPROP_API_TOKEN` **o** `KITEPROP_API_SECRET` | **`Authorization: Bearer …`** en `lib/lead-dispatch.ts`. |

Si tu instancia usa **un solo** `kp_…` para todo, lo más simple es definir **`KITEPROP_API_SECRET`** una vez en Vercel/`.env.local` (y el mismo valor en MCP como `KITEPROP_API_TOKEN`); las variables específicas son opcionales.

| Variable | Uso |
|----------|-----|
| **`KITEPROP_API_SECRET`** | **Una sola secret** opcional; fallback para perfil (como key), Bearer REST y Bearer de leads. Ver `docs/kiteprop-credentials.md`. |
| `KITEPROP_ACCESS_TOKEN` | Bearer para `getKitePropUsersPage` / `getKitePropPropertiesApiPage` si no usás solo `KITEPROP_API_SECRET`. **Server-only**. |
| `KITEPROP_API_KEY` | `X-API-Key` para `/profile` si no usás solo `KITEPROP_API_SECRET`. |
| `KITEPROP_API_TOKEN` | Bearer en POST de leads cuando hay `KITEPROP_LEAD_POST_URL`, si no usás solo `KITEPROP_API_SECRET`. |
| `NEXT_PUBLIC_WHATSAPP_*` | Sigue pudiendo sobreescribir WhatsApp; por defecto el sitio usa `siteConfig.contact.whatsapp*`. |

---

## 7. Siguiente paso técnico recomendado

1. Ejecutar **`GET /api/test-kiteprop-properties`** (con `KITEPROP_ENABLE_API_TEST=1` y `KITEPROP_ACCESS_TOKEN` o `KITEPROP_API_SECRET`) y archivar **solo estructura** (keys / agregados), no JSON con PII en el repo — ver **`docs/kiteprop-api-properties-investigation.md`**.
2. Obtener **respuesta real** de `GET /users?page=1&limit=5` con Bearer válido; misma política de no volcar PII.
3. Decidir política de **PII** antes de cualquier UI que consuma API.
4. Revisar **MCP KiteProp** cuando esté estable: listar tools y contrastar con esta matriz.

---

## 8. Directorio institucional en la web (criterio)

### Inclusión

- Filas **`agency`**, **`advertiser`**, **`agent`** y **`sub_agent`** del feed normalizado que pasan `extractSociosGridCatalog` (excluye la **matriz** cuando `partnerIsObviousMatrizBrandForListing` aplica).
- Una fila por clave `partnerKey` (sin duplicados: el catálogo interno agrupa por socio).

### Exclusión / saneo

- Nombres vacíos o solo espacios tras `normalizePublicDisplayName` → se descarta la fila.
- Email sin `@` o demasiado corto; `webUrl` sin `http(s)://`; teléfonos con menos de 8 dígitos útiles → campo anulado (no se muestra ruido).
- No se muestran claves técnicas ni JSON en la UI.

### Orden

1. Mayor cantidad de publicaciones asociadas (`propertyCount` descendente).
2. **Inmobiliaria** (`agency`) antes que **anunciante** (`advertiser`) a igual conteo.
3. Nombre alfabético (`es`, base insensitive).

### Qué se muestra públicamente

- Nombre, rol legible, logo si existe en el feed, cobertura por ubicaciones deducidas de fichas, conteo de publicaciones, contactos que pasan saneo, CTA al listado filtrado por socio.

### Señales agregadas (solo feed)

- Total de publicaciones en el catálogo cargado.
- Cantidad de entradas del directorio.
- Cantidad **distinta** de etiquetas de ubicación en fichas de esos socios; texto de apoyo con hasta 12 etiquetas ordenadas.

### Qué no se muestra

- Payload crudo, IDs internos de KiteProp en titulares, estructuras `agency`/`advertiser` en bruto.
- API REST para armar el directorio en esta fase.

### Próximos pasos posibles

- Lista curada “socios homologados Redalia” desacoplada del solo feed.
- Descripciones institucionales por socio aprobadas por comercial (sustituyen o complementan el bloque neutro actual).

---

## 9. Ficha de socio `/socios/[slug]` (implementado)

### URL y slug

- Cada entrada del directorio incluye **`publicSlug`**: `nombre-normalizado-inmobiliaria|anunciante-fingerprint(partnerKey)`.
- **`fingerprintPartnerKey`**: `partnerKey` con caracteres no seguros reemplazados por `-` (estable y único por socio en el feed).
- Resolución: `findPartnerEntryByPublicSlug(entries, slug)`; si no hay coincidencia → **404** (`notFound()`).

### Modelo

- **`PublicPartnerDetail`**: `PublicPartnerDirectoryEntry` + `institutionalBlock` (títulos y párrafos neutros generados en `buildPublicPartnerDetail`, sin marketing inventado).
- La UI de la ficha **no** lee el JSON crudo: solo `PublicPartnerDetail` + lista de `NormalizedProperty` filtrada por `partnerKey`.

### Propiedades asociadas

- `filterPropertiesForPartnerKey` / `selectPartnerPropertiesPreview` (`lib/public-data/partner-properties.ts`) reutilizan `propertyMatchesPartnerKey` (mismo criterio que `?socio=` en `/propiedades`).
- La ficha muestra hasta **6** publicaciones recientes y un CTA al **listado completo filtrado**.

### Qué no se publica

- Misma política que el directorio: sin API REST de usuarios, sin PII dudosa, sin métricas inventadas.

### Escalado futuro

- Metadata OG por socio, JSON-LD, o tabla Redalia de “perfil homologado” enlazada por `publicSlug`.
