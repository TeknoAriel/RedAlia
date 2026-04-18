# Branch protection y checks en `main`

Objetivo: que **nada entre a `main` sin CI verde** (y, si activás la opción automática, **PR obligatorio**) sin depender de clics manuales en Settings después de la configuración inicial del token.

## Opción C — Automática (recomendada)

GitHub **no** permite que el `GITHUB_TOKEN` de Actions modifique branch protection. La alternativa es un **PAT** (o fine-grained token) del dueño del repo con permiso de **administración** del repositorio, guardado como secreto. El repo ya incluye:

| Recurso | Rol |
|--------|-----|
| [`scripts/apply-branch-protection.mjs`](../scripts/apply-branch-protection.mjs) | Llama a la API REST, detecta el nombre del check en el último run de `main` (o usa `CHECK_CONTEXT`) y hace `PUT` idempotente. |
| [`.github/workflows/apply-branch-protection.yml`](./workflows/apply-branch-protection.yml) | `workflow_dispatch` + **cron semanal** (lunes ~08:45 UTC): reaplica la política si alguien la aflojó. |
| `npm run repo:apply-branch-protection` | Mismo script en local (requiere `BRANCH_PROTECTION_TOKEN` o `GH_TOKEN`). |

### Una sola intervención en GitHub (dueño del repo)

1. Creá un token:
   - **Fine-grained:** acceso solo a este repositorio → permiso **Administration** → **Read and write**.
   - **Classic:** scope **`repo`** (dueño del repo).
2. En el repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:
   - Nombre: **`BRANCH_PROTECTION_TOKEN`**
   - Valor: el token.
3. **Actions** → workflow **Aplicar branch protection** → **Run workflow** (una vez). Con el cron, las semanas siguientes se revalida solo.

### Variables opcionales (workflow o local)

| Variable | Default | Uso |
|----------|---------|-----|
| `CHECK_CONTEXT` | autodetectado | Si la API rechaza el nombre del check, forzá el string exacto que ves en la regla de rama (a veces `CI / CI — listo para merge`). |
| `REQUIRE_PR` | `1` | `0` para permitir merge/push directo sin PR (no recomendado en equipo). |
| `STRICT_UP_TO_DATE` | `1` | `0` si no querés “branch up to date before merging”. |
| `ENFORCE_ADMINS` | `1` | `0` si los admins pueden ignorar checks. |
| `DRY_RUN` | — | `1` imprime el JSON del `PUT` sin llamar a la API (con token también puede leer estado). |

### Límites (honestidad técnica)

- **Sin ningún secreto con permiso de admin**, nadie puede cambiar branch protection por API: es decisión de GitHub.
- La **primera** vez hace falta crear el token y el secreto (o ejecutar local `npm run repo:apply-branch-protection` con `GH_TOKEN`). Después puede ser **sin tocar la UI** gracias al workflow + cron.

---

## Opción A — Reglas de rama (solo UI, clásico)

1. Repo → **Settings** → **Branches** → **Add branch protection rule** (o editá la de `main`).
2. **Branch name pattern:** `main`
3. Activá según política del equipo:
   - **Require a pull request before merging** (recomendado si trabajás en equipo).
   - **Require status checks to pass before merging** → **Add checks** y buscá exactamente el nombre que muestre GitHub (suele ser **`CI — listo para merge`** o **`CI / CI — listo para merge`**, según cómo liste Actions).
   - **Require branches to be up to date before merging** (opcional).
4. **Do not allow bypassing the above settings** para administradores, salvo emergencia.
5. Guardá la regla.

## Opción B — Repository rules (UI nueva)

**Settings** → **Rules** → **Rulesets** → **New ruleset** → **Target branches** `main` → **Require status checks to pass** y elegí el mismo check que en la opción A.

## Sobre “Verificar deploy”

El workflow **`Verificar deploy`** (`verify-deployment.yml`) se dispara con **`deployment_status`**. **No** suele ser check obligatorio en el merge del PR: corre **después** del deploy.

- Para **merge seguro de código**: alcanza con el job de **`ci.yml`** (nombre en YAML: **`CI — listo para merge`**).
- Para **“prod lista”**: revisá **Actions** o **Deploy readiness (manual)**.

## Comprobar que el nombre del check exista

1. **Actions** → un run reciente de **CI** en un PR o en `main`.
2. El job debe llamarse **`CI — listo para merge`** (definido en [`.github/workflows/ci.yml`](./workflows/ci.yml)).
3. Ese string (o `Workflow name / job name`) es el que exige la protección.

Si cambiás el `name:` del job en `ci.yml`, actualizá el script (`CHECK_CONTEXT`) o volvé a correr el workflow para que redetecte.

## Forks y secretos

Los PR desde forks no reciben secretos de Actions por defecto. No habilites “pass secrets to forks” salvo necesidad extrema.

## Después de configurar

- Un PR de prueba debe exigir el check verde antes de mergear.
- Si el check no aparece en la lista de la UI, empujá un commit para que GitHub registre el workflow.
