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
| `KITEPROP_PROPERTIES_URL` | JSON de **difusión** KiteProp (catálogo + inmobiliarias/socios); **no** es el REST `/api/v1/properties`. Si falta en env, el código usa un feed por defecto en `lib/config.ts`; si el fetch falla, `data/kiteprop-sample.json`. |
| `KITEPROP_PROPERTIES_SOURCE` | Opcional: `json` (default si se omite), `network` o `network_fallback_json`. Para volver al feed JSON: definí `KITEPROP_PROPERTIES_URL` y **no** pongas `network` como fuente. |
| `KITEPROP_API_SECRET` | Opcional: **una** secret `kp_…` para API REST + mismo valor que usa el MCP (fallback de key/Bearer/leads). Ver **`docs/kiteprop-credentials.md`**. |
| `LEADS_WEBHOOK_URL` | Opcional: POST de formularios Contacto / Únete |

Copiá `.env.example` como referencia. Credenciales KiteProp / MCP: **`docs/kiteprop-credentials.md`**.

## Feed JSON (jerarquía agencia)

- **Agencia matriz / red** (p. ej. Aina): claves soportadas `aina`, `master_agency`, `network_agency`, `parent_agency`, `head_agency`, etc. Se muestra en la ficha y en tarjetas como “Matriz”; **no** genera tarjeta en `/socios` ni filtro `?socio=`.
- **Inmobiliaria operativa**: `agency`, `corredora`, `inmobiliaria`, `office`, `branch_agency`, `local_agency`, `operating_agency`… Es la capa que alimenta la grilla de socios, el filtro por corredora y el bloque “Inmobiliaria” cuando hay matriz.
- **Agente / subagente / anunciante**: sin cambios; siguen en la ficha y en filtros con su clave (`agent:…`, etc.).

## Deploy y CI

- **GitHub Actions:** **`CI — listo para merge`** (`npm ci` + lint + typecheck + build). Opcional: deploy **Vercel CLI** con secretos `VERCEL_*` + verificación `npm run verify:deploy` usando variable **`PRODUCTION_URL`**.
- **Post-deploy:** **`verify-deployment.yml`** corre `scripts/deploy-readiness.mjs` cuando Vercel envía `deployment_status` + `environment_url` (rutas `/`, `/propiedades`, `/socios`, `/contacto`). Manual: workflow **Deploy readiness (manual)** en Actions, o `DEPLOY_READINESS_URL=… npm run verify:deploy`.
- **Proteger `main`:** con secreto `BRANCH_PROTECTION_TOKEN` + workflow **Aplicar branch protection** (o `npm run repo:apply-branch-protection`) según [`.github/SETUP_BRANCH_PROTECTION.md`](.github/SETUP_BRANCH_PROTECTION.md); alternativa manual en la misma guía.
- **Solo producción en Vercel:** en `vercel.json`, `ignoreCommand` ejecuta `scripts/vercel-ignore-non-main.sh`: **solo la rama `main`** encola build (menos previews y menos desalineación con la URL pública). Trabajá en `main` con `npm run sync:pull` antes de commitear; borrá ramas remotas viejas desde GitHub o con `git push origin --delete <rama>` cuando ya estén mergeadas.
- Reglas recomendadas (autodeploy, readiness, branch protection, Vercel): **[`.github/DEPLOYMENT.md`](.github/DEPLOYMENT.md)**.
- Conectá el repo a [Vercel](https://vercel.com): root = raíz del repo, framework **Next.js**.
