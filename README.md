# Redalia — Red de Alianzas Inmobiliarias

Sitio institucional (Next.js 16, App Router, Tailwind).

## Desarrollo

```bash
npm ci
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Variables de entorno (Vercel)

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_SITE_URL` | URL pública (ej. `https://redalia.vercel.app`) |
| `KITEPROP_PROPERTIES_URL` | JSON de difusión KiteProp. Si falta, se usa `data/kiteprop-sample.json` |
| `KITEPROP_API_SECRET` | Opcional: **una** secret `kp_…` para API REST + mismo valor que usa el MCP (fallback de key/Bearer/leads). Ver **`docs/kiteprop-credentials.md`**. |
| `LEADS_WEBHOOK_URL` | Opcional: POST de formularios Contacto / Únete |

Copiá `.env.example` como referencia. Credenciales KiteProp / MCP: **`docs/kiteprop-credentials.md`**.

## Feed JSON (jerarquía agencia)

- **Agencia matriz / red** (p. ej. Aina): claves soportadas `aina`, `master_agency`, `network_agency`, `parent_agency`, `head_agency`, etc. Se muestra en la ficha y en tarjetas como “Matriz”; **no** genera tarjeta en `/socios` ni filtro `?socio=`.
- **Inmobiliaria operativa**: `agency`, `corredora`, `inmobiliaria`, `office`, `branch_agency`, `local_agency`, `operating_agency`… Es la capa que alimenta la grilla de socios, el filtro por corredora y el bloque “Inmobiliaria” cuando hay matriz.
- **Agente / subagente / anunciante**: sin cambios; siguen en la ficha y en filtros con su clave (`agent:…`, etc.).

## Deploy y CI

- **GitHub Actions:** un solo job **`CI — listo para merge`** (`npm ci` + lint + typecheck + build). En `main`, **Vercel CLI** opcional si hay secretos `VERCEL_*`; smoke con `PRODUCTION_URL` solo **después** de ese deploy. **`verify-deployment.yml`** hace smoke cuando GitHub recibe `deployment_status` con URL (alineado al deploy de Vercel por Git).
- **Repo alineado con `main`:** `npm run sync:pull` (o `npm run sync` si además querés push).
- Reglas recomendadas (branch protection, secretos, no duplicar Vercel): **[`.github/DEPLOYMENT.md`](.github/DEPLOYMENT.md)**.
- Conectá el repo a [Vercel](https://vercel.com): root = raíz del repo, framework **Next.js**.
