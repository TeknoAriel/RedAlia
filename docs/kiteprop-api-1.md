# KiteProp API — Fase 1 (conectividad y `/profile`)

## Objetivo de esta fase

Validar de forma **server-only** que la API Key de KiteProp es aceptada por la API REST v1, usando el endpoint **`GET /profile`**, **sin** modificar el catálogo público actual (que sigue alimentándose por el JSON de difusión vía `KITEPROP_PROPERTIES_URL`).

## Variables de entorno

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| **`KITEPROP_API_SECRET`** | No (recomendada si querés **una** variable) | Mismo `kp_…` que en MCP; se usa como fallback de `X-API-Key` y de Bearer. Ver **`docs/kiteprop-credentials.md`**. |
| `KITEPROP_API_KEY` | Una de API_KEY / API_SECRET | Header `X-API-Key` para `/profile`. **Nunca** exponer en cliente, logs o respuestas HTTP. |
| `KITEPROP_API_BASE_URL` | No | Base de la API. Default: `https://www.kiteprop.com/api/v1` (sin barra final en la lógica interna). |
| `KITEPROP_ENABLE_API_TEST` | No (pero ver abajo) | Debe ser exactamente **`1`** para habilitar rutas de prueba **server-only**. Si no es `1` → **404** en `/api/test-kiteprop` y `/api/test-kiteprop-properties`. |

El feed de propiedades públicas **no** usa estas variables; sigue usando `KITEPROP_PROPERTIES_URL` (JSON público).

## Endpoint KiteProp usado

- **Método:** `GET`
- **Path (relativo a base):** `/profile`
- **URL completa típica:** `https://www.kiteprop.com/api/v1/profile`
- **Header requerido:** `X-API-Key:` valor de `KITEPROP_API_KEY` o `KITEPROP_API_SECRET` (misma secret, ver `lib/kiteprop/env-credentials.ts`)
- **Header adicional:** `Accept: application/json`

## Código relevante

- `lib/kiteprop/env-credentials.ts` — resolución de secret única vs variables por cabecera.
- `lib/kiteprop/client.ts` — cliente HTTP, timeout (~15 s), errores tipados, sin logs de secretos.
- `lib/kiteprop/get-profile.ts` — `getKitePropProfile()`.
- `lib/kiteprop/api-test-enabled.ts` — flag `KITEPROP_ENABLE_API_TEST`.
- `app/api/test-kiteprop/route.ts` — prueba `GET /profile` (solo si flag = `1`).
- `app/api/test-kiteprop-properties/route.ts` — muestra estructural de `GET /properties` (Bearer); ver `docs/kiteprop-api-properties-investigation.md`.

## Cómo probar en local

1. En `.env.local` (no commitear):

   ```bash
   # Opción A — una sola variable (mismo kp_… que en MCP):
   KITEPROP_API_SECRET=tu_kp_token
   # Opción B — variables por cabecera (pueden repetir el mismo valor):
   # KITEPROP_API_KEY=...   # X-API-Key /profile
   # KITEPROP_ACCESS_TOKEN=...   # Bearer /properties
   KITEPROP_ENABLE_API_TEST=1
   ```

2. `npm run dev`

3. `curl -sS http://localhost:3000/api/test-kiteprop | jq`

4. (Opcional) `curl -sS http://localhost:3000/api/test-kiteprop-properties | jq` — requiere Bearer; no devuelve PII en claro.

## Cómo probar en Vercel

1. **Environment Variables:** `KITEPROP_API_SECRET` (o `KITEPROP_API_KEY`), y temporalmente `KITEPROP_ENABLE_API_TEST=1`.
2. Deploy / redeploy si hace falta.
3. `GET https://<proyecto>.vercel.app/api/test-kiteprop`
4. **Tras validar:** quitar `KITEPROP_ENABLE_API_TEST` o ponerla en `0` para que la ruta vuelva a responder **404** y no quede expuesta.

## Respuestas esperadas de `/api/test-kiteprop`

### Caso feliz (API Key válida y `/profile` OK)

HTTP **200**, cuerpo JSON aproximado:

```json
{
  "ok": true,
  "status": 200,
  "message": "KiteProp API connection successful",
  "dataShape": ["id", "name", "..."]
}
```

`dataShape` son solo **nombres de claves** del JSON devuelto por KiteProp (ordenadas), no valores.

### Ruta deshabilitada (`KITEPROP_ENABLE_API_TEST` ≠ `1`)

HTTP **404**, cuerpo vacío. No se llama a KiteProp.

### Sin API key configurada

HTTP **503**, cuerpo JSON con `ok: false`, `message` genérico, sin detalles internos.

### Timeout hacia KiteProp

HTTP **504**, `ok: false`, mensaje genérico de timeout.

### Error HTTP upstream (401, 403, 5xx de KiteProp, etc.)

HTTP **502**, `ok: false`. El campo `status` en el JSON refleja el **código HTTP devuelto por KiteProp** cuando `errorCode` es `HTTP_ERROR` (útil para diagnosticar 401/403 sin exponer la key).

### Respuesta no JSON o vacía en éxito HTTP

HTTP **502**, `INVALID_JSON`.

## Significado de códigos HTTP (ruta de prueba y upstream)

| Código | Origen típico | Significado |
|--------|----------------|-------------|
| **200** | Next `/api/test-kiteprop` | Prueba OK; perfil recibido y parseado. |
| **404** | Next | Prueba deshabilitada por flag; comportamiento intencional. |
| **401 / 403** | KiteProp (reflejado en JSON `status` con HTTP 502 en la ruta) | Key inválida, revocada o sin permiso para `/profile`. |
| **502** | Next | Fallo de integración o error HTTP/parseo upstream (ver `message` y `status` en cuerpo). |
| **503** | Next | Falta credencial para `/profile`: `KITEPROP_API_KEY` o `KITEPROP_API_SECRET`. |
| **504** | Next | Timeout del cliente hacia KiteProp (~15 s). |

## Qué aporta `/profile` como prueba

Sin asumir un contrato público fijo: en integraciones típicas, `/profile` suele devolver un **objeto JSON** con datos del **usuario o cuenta** asociada a la API Key (p. ej. identificadores, nombre, email). Sirve para:

- Confirmar que la **key es aceptada** y que la **base URL** es correcta.
- Inspeccionar **solo el shape** (`dataShape` en nuestra ruta) sin volcar el payload en respuestas públicas.

Para confirmar que la key “es la cuenta correcta”, comparar en backend (o en documentación interna) los campos que KiteProp exponga con la cuenta esperada — **no** publicar esos valores en la ruta de test.

## Siguiente fase sugerida (API-2: propiedades)

**No implementada aún** — el catálogo público sigue siendo el JSON de difusión.

1. **Descubrir el endpoint exacto** en la documentación oficial de KiteProp API v1 para listar publicaciones/propiedades (path, query de paginación, límites).
2. **Prueba acotada server-only:** nuevo handler o ruta protegida similar (con flag propio si aplica), `limit` bajo (p. ej. 5–10 ítems), medir **shape real** del JSON.
3. **Archivos previstos:**
   - `lib/kiteprop/get-properties-api.ts` — GET paginado, reutilizando `kitepropGetJson` o un wrapper con query params.
   - `lib/kiteprop/map-api-property-to-normalized.ts` (o nombre equivalente) — mapeo hacia el modelo ya usado por `normalizeKitePropProperty` / `NormalizedProperty` donde sea posible, o capa intermedia documentada.
4. **Comparación:** script o test que compare una muestra API vs ítems del feed JSON (ids, campos críticos) para validar paridad antes de cualquier switch de fuente.
5. **Solo cuando esté validado:** valorar feature flag o variable (`KITEPROP_PROPERTIES_SOURCE=api|json`) para alternar fuente **sin** romper el default actual (`json`).

## Troubleshooting (producción)

- Si `GET /api/test-kiteprop` devuelve **HTML** de error y cabeceras tipo `x-matched-path: /404`, suele significar que **el despliegue no incluye** el route handler (código viejo) o que la URL no coincide. Hacé **redeploy** desde la rama que tiene `app/api/test-kiteprop/route.ts` y volvé a probar.
- Con el handler activo y **`KITEPROP_ENABLE_API_TEST=1`**, la respuesta debe ser **JSON** (éxito o error controlado), no la página 404 del sitio.
- Con el handler activo y **flag apagado**, la respuesta es **404 con cuerpo vacío** (no se llama a KiteProp).

## Referencias internas

- Catálogo actual: `lib/get-properties.ts`, `KITEPROP_PROPERTIES_URL`.
- Cliente API: `lib/kiteprop/client.ts`.
- Modelo público socios / entidades / API Bearer: `docs/kiteprop-data-model.md`.
