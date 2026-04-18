# Branch protection y checks (hacer en GitHub)

Objetivo: que **nada entre a `main` sin CI verde** y reducir “deploys rotos” por merges apurados.

## Opción A — Reglas de rama (clásico)

1. Abrí el repo → **Settings** → **Branches** → **Add branch protection rule** (o editá la de `main`).
2. **Branch name pattern:** `main`
3. Activá según política del equipo:
   - **Require a pull request before merging** (recomendado si trabajás en equipo).
   - **Require status checks to pass before merging** → **Add checks** y buscá exactamente:
     - **`CI — listo para merge`**
       (es el `name:` del job en `.github/workflows/ci.yml`; debe aparecer después de al menos un PR/push que haya corrido Actions).
   - **Require branches to be up to date before merging** (opcional, evita merges sobre `main` viejo).
4. **Do not allow bypassing the above settings** para administradores, salvo que un admin deba romper emergencia.
5. Guardá la regla.

## Opción B — Repository rules (UI nueva)

**Settings** → **Rules** → **Rulesets** → **New ruleset** → **Target branches** `main` → en **Rules** activá **Require status checks to pass** y elegí **`CI — listo para merge`**.

Ventaja: más claro con varias ramas y excepciones.

## Sobre “Verificar deploy”

El workflow **`Verificar deploy`** (`verify-deployment.yml`) se dispara con **`deployment_status`** (p. ej. cuando Vercel termina). **No** suele aparecer como check obligatorio en el merge del PR: corre **después** del deploy, no en cada push al PR.

- Para **merge seguro de código**: alcanza con **`CI — listo para merge`**.
- Para **“prod lista”**: mirá en la pestaña **Actions** que **Verificar deploy** sea verde tras el deploy, o usá **Deploy readiness (manual)** con la URL.

## Comprobar que el nombre del check exista

1. **Actions** → abrí un run reciente de **CI** en un PR o en `main`.
2. En la columna izquierda, el job debe llamarse **`CI — listo para merge`**.
3. Ese string es el que tenés que marcar en branch protection.

Si cambiás el `name:` del job en `ci.yml`, actualizá la regla en GitHub.

## Forks y secretos

Los PR desde forks no reciben secretos de Actions por defecto: el CI sigue corriendo en el fork con su propia configuración o con permisos limitados. No habilites “pass secrets to forks” salvo necesidad extrema y revisión legal/técnica.

## Después de configurar

- Hacé un PR de prueba pequeño: debe exigirte el check verde antes de mergear.
- Si el check no aparece en la lista, empujá un commit a un PR para que GitHub registre el workflow.
