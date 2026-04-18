# Flujos de deploy y reglas de control

## Flujo automático

### `ci.yml` — calidad y build (sin cola innecesaria)

| Momento | Qué corre |
|--------|------------|
| **PR y push a `main`** | Un solo job **`CI — listo para merge`**: `npm ci` **una vez**, luego ESLint → TypeScript → `next build`. Menos minutos que tres jobs con tres instalaciones. |
| **Push a `main`** (tras CI OK) | **Vercel CLI (opcional)** solo si están `VERCEL_TOKEN`, `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID`. Al terminar el deploy CLI, **smoke HTTP** opcional con `PRODUCTION_URL` (sin sleeps: solo `curl` con reintentos cortos). |

### `verify-deployment.yml` — alineado al deploy real (integración Git)

Cuando Vercel (u otro integrador) notifica a GitHub un **`deployment_status`** en *success* y envía **`environment_url`**, corre un **smoke HTTP** contra esa URL. Así la verificación no adelanta al hosting ni queda “atrasada” por lógica propia: sigue al evento de deploy.

- Si tu proyecto **no** emite `deployment_status` con URL, este workflow no hace nada dañino (sale con *notice*).
- Con **solo integración Git Vercel** (sin CLI en Actions): confiá en este workflow + checks de Vercel en el commit; no hace falta `PRODUCTION_URL` en CI salvo que uses deploy por CLI.

### Concurrencia

- **PR:** cancela el run anterior del mismo PR (`cancel-in-progress: true`).
- **Vercel CLI:** grupo `vercel-production-deploy`, `cancel-in-progress: false`, para no pisar despliegues.

## Alinear el repo local con `origin/main`

```bash
npm run sync:pull   # fetch + pull --rebase (sin push)
npm run sync        # sync:pull + push (solo si tenés permiso y querés subir)
```

## Reglas en GitHub (branch protection)

1. Rama **`main`**: exigir PR (según política del equipo).
2. **Require status checks:** como mínimo **`CI — listo para merge`**.
3. (Opcional) **Require deployments to succeed** si usás el entorno `production` con aprobaciones en el job de Vercel CLI.
4. Forks: en PR desde fork no hay secretos; el job de CLI no aplica en PR de todas formas.

## Variables y secretos (Actions)

| Nombre | Tipo | Uso |
|--------|------|-----|
| `PRODUCTION_URL` | Variable | URL pública. Se usa **solo** tras un deploy **por CLI** en Actions (smoke inmediatamente después). |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | Secret | Deploy por Actions; si faltan, se asume **solo** integración Git de Vercel. |

**No duplicar producción:** o integración Git de Vercel, o CLI con secretos — no ambos para el mismo `main`.

## Vercel (panel)

- **Build:** `npm run build` · **Install:** `npm ci` (`vercel.json`).
- Variables típicas: **`KITEPROP_PROPERTIES_URL`** (JSON catálogo), opcional **`KITEPROP_API_SECRET`** (misma secret `kp_…` para pruebas REST y leads si aplica). Detalle: `docs/kiteprop-credentials.md`.

## Los cambios no aparecen en la web

1. **¿Están en GitHub?** Si solo editaste en local, Vercel no ve nada hasta **`git push`**. Comprobá en [github.com/TeknoAriel/RedAlia](https://github.com/TeknoAriel/RedAlia) que el último commit sea el tuyo.
2. **Vercel:** en el dashboard del proyecto, pestaña **Deployments**: debe aparecer un build para ese commit (1–3 minutos).
3. **Preview de PR:** las URLs `*.vercel.app` de revisión se generan al abrir/actualizar el PR contra `main`, no por commits solo locales.

## Checklist rápido

- [ ] Ruleset en `main` exige **`CI — listo para merge`**.
- [ ] Sin secretos `VERCEL_*` si ya desplegás con Git en Vercel (o al revés, desactivá el auto-deploy duplicado en Vercel).
- [ ] `PRODUCTION_URL` solo si usás deploy por CLI y querés smoke post-deploy.
- [ ] `npm run sync:pull` antes de trabajar para alinear con `main`.
