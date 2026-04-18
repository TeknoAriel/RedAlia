# KiteProp — credenciales (una secret, varios usos)

Referencia única para Redalia + MCP. **No commitear** valores reales.

## Variable recomendada (una sola en Vercel / `.env.local`)

| Variable | Rol |
|----------|-----|
| **`KITEPROP_API_SECRET`** | Mismo valor `kp_…` que usás en KiteProp. Si está definida, **completa** cualquier caso donde falte la variable específica (ver tabla abajo). |

Podés seguir usando solo las variables “clásicas”; no es obligatorio definir `KITEPROP_API_SECRET` si ya tenés las otras.

## Cómo la usa el código (precedencia: específica → `KITEPROP_API_SECRET`)

| Caso | Variable 1 (preferida) | Variable 2 (fallback) | Cabecera HTTP en Redalia |
|------|------------------------|----------------------|---------------------------|
| `GET /profile`, `X-API-Key` | `KITEPROP_API_KEY` | `KITEPROP_API_SECRET` | `X-API-Key` |
| `GET /properties`, `GET /users`, Bearer | `KITEPROP_ACCESS_TOKEN` | `KITEPROP_API_SECRET` | `Authorization: Bearer` |
| Mismo GET con **Bearer + key** (`KITEPROP_REST_BEARER_WITH_API_KEY=1`) | Bearer: token estático **o** JWT vía `KITEPROP_API_USER` + `KITEPROP_API_PASSWORD` (login) | `KITEPROP_API_KEY` o secret | `Authorization: Bearer` **y** `X-API-Key` |
| POST leads (`KITEPROP_LEAD_POST_URL`) | `KITEPROP_API_TOKEN` | `KITEPROP_API_SECRET` | `Authorization: Bearer` |

Implementación: `lib/kiteprop/env-credentials.ts` + `lib/kiteprop/client.ts` + `lib/kiteprop/resolve-rest-bearer.ts` + `lib/lead-dispatch.ts`.

## MCP (Cursor) — mismo valor, otro archivo

| Dónde | Variable en `~/.cursor/mcp.json` |
|-------|-----------------------------------|
| Servidor `github:kiteprop/crm-mcp` | `KITEPROP_API_TOKEN` (nombre que pide el paquete MCP) + `KITEPROP_API_URL` |

El **valor** suele ser el mismo `kp_…` que `KITEPROP_API_SECRET` en Redalia; el MCP arma las cabeceras que corresponda al hablar con KiteProp.

## URLs útiles

| Qué | URL |
|-----|-----|
| Login web | [https://www.kiteprop.com/auth/login](https://www.kiteprop.com/auth/login) |
| API REST base (Redalia) | `https://www.kiteprop.com/api/v1` (override: `KITEPROP_API_BASE_URL`) |
| Repo MCP | [https://github.com/kiteprop/crm-mcp](https://github.com/kiteprop/crm-mcp) |

## Qué **no** es lo mismo (solo nombre)

- **`KITEPROP_PROPERTIES_URL`**: URL pública del JSON de difusión — **no** es la secret `kp_…`.

## Red / AINA (misma fuente que el producto en producción)

Credenciales y paths: **`docs/kiteprop-network-aina.md`**. Variables típicas: `KITEPROP_API_USER`, `KITEPROP_API_PASSWORD`, `KITEPROP_NETWORK_ID`, `KITEPROP_NETWORK_TOKEN`, más las ya existentes `KITEPROP_API_BASE_URL`, `KITEPROP_ACCESS_TOKEN` / `KITEPROP_API_SECRET`.

## Más doc en el repo

- Pruebas API: `docs/kiteprop-api-1.md`, `docs/kiteprop-api-properties-investigation.md`
- Red AINA: `docs/kiteprop-network-aina.md`
- Modelo de datos / directorio: `docs/kiteprop-data-model.md`
- Señales MCP → Home (snapshot): `docs/kiteprop-mcp-redalia-mvp.md`
