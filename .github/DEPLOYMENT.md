# Flujos de deploy y reglas de control

## Sistema de deploy seguro (resumen)

1. **Un solo camino a producción** — O bien Vercel despliega desde Git (recomendado), o bien Actions usa `VERCEL_*` + `amondnet/vercel-action`. No actives los dos para el mismo `main` (doble deploy y estados confusos).
2. **Calidad antes de publicar** — La rama `main` debe pasar **`CI — listo para merge`** (`npm ci` → lint → typecheck → `next build`). **Automático:** secreto `BRANCH_PROTECTION_TOKEN` + workflow [`.github/workflows/apply-branch-protection.yml`](./workflows/apply-branch-protection.yml) o `npm run repo:apply-branch-protection` (ver [`.github/SETUP_BRANCH_PROTECTION.md`](./SETUP_BRANCH_PROTECTION.md)). **Manual en UI:** misma guía, opciones A/B.
3. **Comprobar que el deploy esté “ready”** — Tras éxito del hosting, GitHub recibe `deployment_status` → workflow **`Verificar deploy`** ejecuta `scripts/deploy-readiness.mjs` contra `environment_url` (home, propiedades, socios, contacto). Si **todas** las rutas devuelven **HTTP 401** (p. ej. **Vercel Deployment Protection** en preview), el script termina **OK** a propósito: no es fallo del código. Para ingest de la **API de red AINA** (sin depender del deploy), usá **`npm run verify:network-ingest`** o el workflow **Verificar ingest API red** (manual).
4. **Verificación manual** — Actions → **Deploy readiness (manual)** → indicá la URL base. O local: `DEPLOY_READINESS_URL=https://… npm run verify:deploy`.
5. **Secretos** — `VERCEL_TOKEN`, credenciales KiteProp y URLs sensibles solo en **GitHub Secrets / Vercel Environment**; nunca en commits. PRs desde forks no reciben secretos de Actions.
6. **Variables de entorno** — Documentación en `README.md` y `docs/kiteprop-credentials.md`; producción y preview separados en Vercel cuando aplique.

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
| `PRODUCTION_URL` | Variable | URL base **https** pública. Tras deploy **por CLI**, se usa en `npm run verify:deploy` (mismo script que `verify-deployment.yml`). |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | Secret | Deploy por Actions; si faltan, se asume **solo** integración Git de Vercel. |
| `BRANCH_PROTECTION_TOKEN` | Secret | PAT con **Administration** del repo (fine-grained) o `repo` (classic). Usa [`.github/workflows/apply-branch-protection.yml`](./workflows/apply-branch-protection.yml) / `scripts/apply-branch-protection.mjs`. Si no existe, el workflow se omite. |

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
- [ ] `PRODUCTION_URL` (variable del repo) si usás deploy por CLI — habilita **deploy readiness** al final del job Vercel.
- [ ] Tras un deploy importante: revisar que **`Verificar deploy`** haya quedado verde en GitHub (o ejecutar **Deploy readiness (manual)**).
- [ ] Local: `DEPLOY_READINESS_URL=https://tu-preview.vercel.app npm run verify:deploy`
- [ ] `npm run sync:pull` antes de trabajar para alinear con `main`.
