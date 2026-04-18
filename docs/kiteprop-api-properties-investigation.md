# KiteProp API `GET /properties` — investigación técnica (fase comparativa)

**Objetivo:** evaluar si la API REST puede reforzar la relación propiedad ↔ inmobiliaria/organización ↔ “socio” en Redalia **sin** reemplazar el feed JSON ni usar la API en vistas públicas.

**Fuentes:** código en `lib/kiteprop/*`, sonda HTTP anónima abril 2026, documentación interna previa (`docs/kiteprop-data-model.md`). La URL pública agregada en el repo (`https://www.kiteprop.com/docs/api/v1/index`) **respondió 404** al intentar recuperarla desde el entorno de análisis; no se asume contrato más allá de lo verificable.

---

## A. Endpoint y método confirmados

| Aspecto | Valor verificable |
|--------|-------------------|
| **Método** | `GET` |
| **Path (relativo a la base)** | `/properties` |
| **Base por defecto en código** | `https://www.kiteprop.com/api/v1` (`KITEPROP_API_BASE_URL` opcional) |
| **URL completa de ejemplo** | `https://www.kiteprop.com/api/v1/properties?page=1&limit=15` |
| **Query enviada por el cliente** | `page` (≥ 1), `limit` ∈ **{15, 30, 50}** (validación en `lib/kiteprop/get-properties-api.ts`; otros valores se fuerzan a 15). `status` opcional si viene definido. |
| **Confirmación de existencia del path** | Petición **sin** credenciales devolvió cuerpo JSON con `success: false` y mensaje de no autenticado (ver sección “Sonda” abajo). |

**No confirmado aquí con certeza absoluta:** parámetros adicionales documentados en un portal que no pudo cargarse (404); cualquier extensión debe contrastarse con documentación oficial o con respuestas reales autenticadas.

---

## B. Autenticación

| Recurso | En código Redalia |
|--------|-------------------|
| `GET /profile` | `X-API-Key:` — `KITEPROP_API_KEY` o fallback `KITEPROP_API_SECRET` |
| `GET /properties` | `Authorization: Bearer` — `KITEPROP_ACCESS_TOKEN` o fallback `KITEPROP_API_SECRET` (`kitepropGetJson`) |

**Importante:** en muchos tenants el **mismo** `kp_…` sirve en ambos headers; Redalia lo soporta vía `KITEPROP_API_SECRET` o repitiendo el valor en las variables específicas (`docs/kiteprop-credentials.md`).

---

## C. Sonda sin credenciales (solo comportamiento HTTP)

```bash
curl -sS "https://www.kiteprop.com/api/v1/properties?page=1&limit=15" -H "Accept: application/json"
```

**Observado:** HTTP **500** con cuerpo JSON:

```json
{"success":false,"data":null,"errorMessage":"Unauthenticated.","details":[]}
```

Interpretación: el endpoint está vivo y exige autenticación; el envelope puede incluir `success` / `data` / `errorMessage` (útil al parsear errores). **No** usar 401 como supuesto: el código upstream puede responder 500 con mensaje semántico.

---

## D. Prueba controlada en el repo (server-only, no UI pública)

**Ruta:** `GET /api/test-kiteprop-properties`  
**Habilitación:** misma que `/api/test-kiteprop`: variable `KITEPROP_ENABLE_API_TEST=1` (cualquier otro valor → **404** vacío, no se llama a KiteProp).

**Requisitos:** Bearer configurado: `KITEPROP_ACCESS_TOKEN` o `KITEPROP_API_SECRET`.

**Respuesta:** JSON con:

- Claves de primer nivel del envelope.
- Tipo del payload tras `unwrap` (`{ success, data }` vía `unwrapKitepropSuccessData`).
- Longitud de la lista extraída heurísticamente.
- Hasta **5** muestras de ítem: solo `topLevelKeys`, rutas con “hints” de socio/organización, rutas cuyo último segmento parece PII (**solo nombres de path**, sin valores).
- **Agregados** de comparación feed vs API (si el catálogo feed cargó): conteos de coincidencias de id y de etiqueta heurística vs `agency` y vs `kitePrimaryPartnerRecord` — **sin** devolver nombres en claro.

**Archivos:**

- `lib/kiteprop/get-properties-api.ts` — request paginado.
- `lib/kiteprop/extract-property-list-from-api.ts` — extracción de array desde envelope u objetos anidados comunes.
- `lib/kiteprop/summarize-properties-api-shape.ts` — shape seguro + comparación agregada.
- `lib/kiteprop/fetch-properties-api-sample-for-analysis.ts` — orquestación.
- `app/api/test-kiteprop-properties/route.ts` — endpoint de prueba.

**Límites de muestra:** el cliente actual no envía `limit=10` ni `20`; usa **15** por defecto (valor permitido). Para 20 habría que ampliar `{15,30,50}` **solo** tras confirmar en documentación oficial que 20 es legal.

---

## E. Campos esperables relacionados a inmobiliaria / socio (heurística de análisis)

El analizador marca rutas donde un segmento coincide con patrones como: `organization`, `agency`, `advertiser`, `agent`, `office`, `broker`, `user`, etc. Los **nombres reales** de claves dependen del JSON autenticado: hay que ejecutar la ruta de prueba o inspeccionar una captura interna (no commitear JSON con PII).

La documentación ya anotada en `docs/kiteprop-data-model.md` menciona ejemplos con `user` y `organization` en detalle de propiedad API — tratarlos como **sensibles** hasta política explícita.

---

## F. Comparación contra el feed JSON (`NormalizedProperty`)

La función `compareApiSampleToFeedCatalog`:

1. Indexa el feed por `externalNumericId`.
2. Por cada ítem API (hasta 20): obtiene id heurístico y una **etiqueta** con `tryPickApiPartnerDisplayLabelForComparison` (orden: `organization.name`, `agency.name`, `advertiser.name`, `user.full_name`, etc.).
3. Cuenta coincidencias de nombre normalizado con `agency.name` y con `kitePrimaryPartnerRecord(p).name`.

**Limitaciones:**

- Si los ids del API no coinciden con `externalNumericId` del feed, los agregados serán bajos sin implicar que la API sea mala.
- La etiqueta API puede ser **persona** (`user.full_name`) mientras el feed expone **marca** (`agency`): mismatch “correcto” semánticamente.

---

## G. ¿Sirve la API para mejorar el campo “socio”?

**Criterio:** solo después de ejecutar `/api/test-kiteprop-properties` con token válido y revisar `itemShapeSamples` + `feedVersusApiAggregates`.

| Hipótesis | Comentario |
|-----------|------------|
| **Mejora** | Si aparece un objeto **organización** estable (id + nombre) alineado con la corredora y poco ruido PII, podría homologar mejor que heurísticas sobre `agency`/`agent` del feed. |
| **Complemento** | Uso **offline** o en job server-only para enriquecer mapeo Redalia ↔ KiteProp, sin exponer `user` en web. |
| **No aporta** | Si la lista API es idéntica al feed en socios visibles o si el canal útil es solo difusión JSON acordado comercialmente. |

Sin respuesta autenticada **no** se cierra esta pregunta en este documento.

---

## H. Regla sugerida (solo si los datos la justifican)

**Borrador condicional** — aplicar solo tras validar shape e ids:

1. Si existe **`organization`** (o equivalente estable) con nombre no vacío y **no** es la matriz filtrada por reglas Redalia → usarlo como **canónico interno** para “inmobiliaria responsable”.
2. Si no → `agency` del API si existe y es consistente con el feed.
3. Si no → `advertiser` API.
4. Si no → mantener **socio derivado del feed** (`extractSociosGridCatalog` / `propertyFichaInmobiliariaOperativa`).

**Nunca** promover a web pública campos `user.*` con email/teléfono sin política y sin saneo equivalente al feed.

---

## I. Riesgos de PII y operativos

- Objetos **`user`** en API suelen traer email, teléfono, nombre completo — **no** aptos para frontend público tal cual.
- Exponer la ruta `/api/test-kiteprop-properties` en producción con `KITEPROP_ENABLE_API_TEST=1` amplía superficie: deshabilitar tras pruebas (404).
- Tokens en env: rotación, scopes, y auditoría de quién puede listar `/properties`.

---

## J. Recomendación de fase (hasta nueva evidencia)

1. **Mantener el feed JSON** como única fuente del catálogo público hasta tener matrix de paridad id/campo y revisión legal de PII.
2. Usar **`GET /properties` + esta ruta de análisis** para documentar shape real y decidir si la API **complementa** homologación interna.
3. **No migrar** vistas públicas a la API hasta: (a) shape estable, (b) política PII, (c) feature flag documentado (`docs/kiteprop-api-1.md` ya sugiere `KITEPROP_PROPERTIES_SOURCE` a futuro).

---

## K. Archivos tocados o añadidos (esta entrega)

| Archivo | Rol |
|---------|-----|
| `lib/kiteprop/extract-property-list-from-api.ts` | Extracción de lista desde respuesta API. |
| `lib/kiteprop/summarize-properties-api-shape.ts` | Shape seguro + comparación agregada vs feed. |
| `lib/kiteprop/fetch-properties-api-sample-for-analysis.ts` | Orquestación de la muestra. |
| `app/api/test-kiteprop-properties/route.ts` | Endpoint de prueba acotado. |
| `docs/kiteprop-api-properties-investigation.md` | Este informe. |

*(Los archivos `lib/kiteprop/client.ts`, `get-properties-api.ts`, `unwrap-envelope.ts` ya existían.)*
