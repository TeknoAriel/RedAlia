# Flujos de deploy y reglas de control

## Límites Vercel (Hobby) y errores que **no** son del código

- **Deployments por día (plan Hobby):** según la [documentación oficial de planes](https://vercel.com/docs/plans/hobby), el límite publicado para Hobby es **100 deployments por día** (incluye previews de PRs y producción). Los números pueden cambiar: **siempre verificá** en **Vercel → tu team → Usage / Billing** y el correo que recibas (algunos avisos antiguos o de otros productos hablan de **~25/día** u otra cifra).
- **Cuota / rate limit agotado:** el build en Vercel puede **no encolarse** o fallar en el panel con mensaje de límite; las peticiones HTTP a previews a veces responden **429**. Eso **no** indica que `next build` o las rutas de la app estén rotas por el último commit.
- **Smoke `deploy-readiness.mjs`:** si **todas** las rutas devuelven **429**, el script sale con **código 0** y un mensaje explícito `vercel_rate_limit_or_quota` en el resumen JSON (`DEPLOY_READINESS_JSON_SUMMARY=1`), para **no** confundir cuota de plataforma con fallo de CI por aplicación (igual criterio que con **401** por Deployment Protection).
- **Qué hacer:** esperar reset diario del contador, reducir pushes/PRs que disparen preview, fusionar menos ramas ruidosas, o **subir a Pro** si el equipo necesita más throughput de deploys. Si el equipo **solo quiere builds en `main`**, configurá **Ignored Build Step** (sección [Vercel — solo builds en main](#vercel-solo-builds-en-main-sin-preview-por-rama) más abajo).

## Por qué “Production” queda atrás de muchos deploys “Preview Ready”

Vercel **no promueve** automáticamente Preview → Production. **Production** sigue el último commit desplegable en **`main`** (integración Git o CLI). Los commits en ramas `feat/*`, Dependabot o `preview` generan **Preview “Ready”**, pero **no mueven `main`**: hasta que esos cambios entren por **merge a `main`**, el deploy de producción seguirá en el SHA anterior. No es un fallo del “ready”: es el modelo Git + protección de rama (PR + CI obligatorio).

**Qué hacer:** mergear PRs a `main` (o activar auto-merge / cola de merge). Para Dependabot, ver workflow **Dependabot auto-merge** abajo. Para alinear **`preview`** con **`main`**: merge o fast-forward (`git checkout preview && git merge origin/main && git push`).

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
| **PR y push a `main`** | Un solo job **`CI — listo para merge`**: `npm ci` **una vez**, luego ESLint → TypeScript → `next build` (Node **24** en Actions). |
| **Push a `main`** (tras CI OK) | **Vercel CLI (opcional)** solo si están `VERCEL_TOKEN`, `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID`. Al terminar el deploy CLI, **smoke HTTP** opcional con `PRODUCTION_URL` (sin sleeps: solo `curl` con reintentos cortos). |

### `verify-deployment.yml` — alineado al deploy real (integración Git)

Cuando Vercel (u otro integrador) notifica a GitHub un **`deployment_status`** en *success* y envía **`environment_url`**, corre un **smoke HTTP** contra esa URL. Así la verificación no adelanta al hosting ni queda “atrasada” por lógica propia: sigue al evento de deploy.

- Si tu proyecto **no** emite `deployment_status` con URL, este workflow no hace nada dañino (sale con *notice*).
- Con **solo integración Git Vercel** (sin CLI en Actions): confiá en este workflow + checks de Vercel en el commit; no hace falta `PRODUCTION_URL` en CI salvo que uses deploy por CLI.

### Concurrencia

- **PR:** cancela el run anterior del mismo PR (`cancel-in-progress: true`).
- **Vercel CLI:** grupo `vercel-production-deploy`, `cancel-in-progress: false`, para no pisar despliegues.

### `deploy-ready-after-ci.yml` — «ready» tras CI en `main` (sin depender solo de Vercel)

Cuando el workflow **CI** termina **en éxito** por **push** a **`main`**, corre **`deploy-readiness`** contra la variable **`PRODUCTION_URL`** (misma lógica que `verify:deploy`), con **reintentos** ante 502/503/504 y red inestable.

- Si **`PRODUCTION_URL`** no está definida, el job termina con *notice* (no falla): en ese caso el «ready» lo da solo **`verify-deployment.yml`** si Vercel envía `deployment_status` + URL.
- Con **Vercel Git + `PRODUCTION_URL` definida**, tenés **dos señales** de readiness (deploy event + post-CI); podés quedarte con una sola desactivando la variable o el workflow si preferís menos ruido.

### `repo-branch-alignment.yml` — ramas remotas vs `main` (sin tocar Git)

Semanal (martes) o **Run workflow**: genera una tabla en el **Summary** del run con, por cada rama remota, cuántos commits va **atrás** de `origin/main` y cuántos **adelante**. Sirve para ver PRs desactualizados. Local: `git fetch origin && npm run repo:branch-alignment`.

### `branch-drift-daily.yml` — drift `preview` (u otras) vs `main`

Diario (~12:30 UTC) + manual: tabla de cuántos commits lleva **`preview`** (o ramas en variable `REPO_DRIFT_BRANCHES`, coma-separadas) **atrás** de `main`. No modifica Git; solo avisa en el Summary si hay desalineación. Incluye el mismo informe amplio que `repo-branch-alignment`.

### `dependabot-auto-merge.yml` — menos cola de PRs de deps

En PRs abiertos por **dependabot[bot]** contra `main`, activa **`gh pr merge --auto --merge`** (omite **semver-major**). Requiere en el repo: **Settings → General → Pull Requests → Allow auto-merge**, y que las reglas de `main` permitan merge sin revisión humana en esos PRs (o actor de bypass). Si no se cumple, el paso falla o no hace nada útil: revisá reglas y logs del workflow.

### `pr-automerge-trusted-branches.yml` — merge sin etiqueta (ramas `feat/*`, `fix/*`, …)

En PRs **del mismo repo** (no forks) hacia `main`, si la rama de origen empieza por **`feat/`**, **`fix/`**, **`chore/`**, **`docs/`**, **`hotfix/`** o **`refactor/`**, encola **`gh pr merge --auto --squash`** al abrir o actualizar el PR. **No hace falta** poner la etiqueta `automerge`.

- **Bloqueo manual:** agregá la etiqueta **`no-automerge`** al PR para que este workflow no haga nada (útil para cambios sensibles).
- **Ramas fuera de la lista** (ej. `preview/…`, `ci/…`): seguí usando la etiqueta **`automerge`** con `pr-automerge-label.yml`, o renombrá la rama al prefijo admitido.

### Cadena “cero clics” recomendada (merge + deploy)

1. **Push** a una rama `feat/…` / `fix/…` y abrí PR a `main` (o dejá que la herramienta lo abra).
2. **CI** (`CI — listo para merge`) debe ser check requerido en `main`.
3. Con **Allow auto-merge** activo, **`pr-automerge-trusted-branches`** (y/o etiqueta `automerge`) encolan el merge al pasar el CI.
4. **Vercel** (integración Git): al mergearse a `main`, se construye y publica **Production** solo. No hace falta tocar Vercel a mano salvo cuota o errores de build.
5. **Variables de entorno** siguen viviendo en el panel de Vercel; no hay forma segura de “inyectarlas” desde Git sin un secreto de deploy (CLI/Terraform). Si querés automatizar env, usá **Vercel CLI** o API en un workflow con secretos de organización.

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
| `PRODUCTION_URL` | Variable | URL base **https** pública. Tras deploy **por CLI**, post-CI (`deploy-ready-after-ci`) y smoke manual. |
| `DEPLOY_READINESS_ATTEMPTS` | Variable (opc.) | Reintentos por ruta ante 5xx/red (default **5** en script; el workflow post-CI usa **6** si no definís esta var). |
| `DEPLOY_READINESS_RETRY_MS` | Variable (opc.) | Pausa entre reintentos en ms (default **3500**). |
| `REPO_ALIGN_EXCLUDE_PREFIXES` | Variable (opc.) | Prefijos de ramas a omitir en el informe (default `dependabot/`). |
| `REPO_DRIFT_BRANCHES` | Variable (opc.) | Ramas a vigilar frente a `main` en **Drift ramas vs main** (default `preview`). Ej: `preview,staging`. |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | Secret | Deploy por Actions; si faltan, se asume **solo** integración Git de Vercel. |
| `BRANCH_PROTECTION_TOKEN` | Secret | PAT con **Administration** del repo (fine-grained) o `repo` (classic). Usa [`.github/workflows/apply-branch-protection.yml`](./workflows/apply-branch-protection.yml) / `scripts/apply-branch-protection.mjs`. Si no existe, el workflow se omite. |

**No duplicar producción:** o integración Git de Vercel, o CLI con secretos — no ambos para el mismo `main`.

## Vercel (panel)

- **Build:** `npm run build` · **Install:** `npm ci` (`vercel.json`).
- Variables típicas: **`KITEPROP_PROPERTIES_URL`** (JSON catálogo), opcional **`KITEPROP_API_SECRET`** (misma secret `kp_…` para pruebas REST y leads si aplica). Detalle: `docs/kiteprop-credentials.md`.

### Vercel: solo builds en `main` (sin Preview por rama)

Si querés que **solo los pushes a `main`** encolen un deploy en Vercel (y **no** haya Preview por cada `feat/*`, `fix/*`, Dependabot, etc.):

1. En el proyecto: **Settings** → **Git** (o **Build & Deployment**) → **Ignored Build Step**.
2. Comando recomendado (usa el script versionado en el repo):

   ```bash
   bash scripts/vercel-ignore-non-main.sh
   ```

   Equivalente en una sola línea:

   ```bash
   if [ "${VERCEL_GIT_COMMIT_REF:-}" = "main" ]; then exit 1; else exit 0; fi
   ```

   - **`exit 1`** → Vercel **sí** construye.
   - **`exit 0`** → Vercel **omite** el build (no cuenta como deploy útil para cuota de la misma forma que un build completo; el panel puede mostrar el intento como omitido).

**Trade-off:** no vas a tener URL de **Preview** de Vercel en PRs hasta mergear a `main`. Seguí usando ramas y PRs en GitHub; el cambio es solo **política de build** en Vercel. La **Production Branch** del proyecto debe seguir siendo **`main`**.

## Los cambios no aparecen en la web

1. **¿Están en GitHub?** Si solo editaste en local, Vercel no ve nada hasta **`git push`**. Comprobá en [github.com/TeknoAriel/RedAlia](https://github.com/TeknoAriel/RedAlia) que el último commit sea el tuyo.
2. **Vercel:** en el dashboard del proyecto, pestaña **Deployments**: debe aparecer un build para ese commit (1–3 minutos).
3. **Preview de PR:** las URLs `*.vercel.app` de revisión se generan al abrir/actualizar el PR contra `main`, no por commits solo locales. Si activaste **Ignored Build Step** solo para `main`, **no** habrá previews de Vercel en esas ramas.

## Checklist rápido

- [ ] Ruleset en `main` exige **`CI — listo para merge`**.
- [ ] Sin secretos `VERCEL_*` si ya desplegás con Git en Vercel (o al revés, desactivá el auto-deploy duplicado en Vercel).
- [ ] `PRODUCTION_URL` (variable del repo) para **Deploy ready (post-CI main)** y/o readiness tras CLI.
- [ ] Tras un deploy importante: **`Verificar deploy`** (evento Vercel) y/o **`Deploy ready (post-CI main)`** en verde.
- [ ] Opcional: **Informe alineación ramas** (Actions) para ver ramas atrasadas respecto de `main`.
- [ ] Local: `DEPLOY_READINESS_URL=https://tu-preview.vercel.app npm run verify:deploy`
- [ ] `npm run sync:pull` antes de trabajar para alinear con `main`.
