import "server-only";

/**
 * Credenciales KiteProp alineadas a **una sola secret** (`KITEPROP_API_SECRET`, típ. `kp_…`)
 * reutilizable en MCP y en REST, con distintas cabeceras según el endpoint.
 *
 * Precedencia: variable **específica** del caso → si falta, `KITEPROP_API_SECRET`.
 * Así los despliegues viejos (solo `KITEPROP_API_KEY` / `ACCESS_TOKEN` / `API_TOKEN`) siguen igual.
 */

function trimEnv(name: string): string | null {
  const v = process.env[name]?.trim();
  return v || null;
}

/** Secret única opcional (mismo valor que en MCP `KITEPROP_API_TOKEN` si aplica). */
export function getKitepropSharedSecretOrNull(): string | null {
  return trimEnv("KITEPROP_API_SECRET");
}

/** `GET /profile` y rutas con `X-API-Key`. */
export function resolveProfileXApiKeyOrNull(): string | null {
  return trimEnv("KITEPROP_API_KEY") ?? getKitepropSharedSecretOrNull();
}

/** `GET /properties`, `GET /users`, etc. con `Authorization: Bearer`. */
export function resolveRestBearerTokenOrNull(): string | null {
  return trimEnv("KITEPROP_ACCESS_TOKEN") ?? getKitepropSharedSecretOrNull();
}

/** POST de leads con `Authorization: Bearer` (`lib/lead-dispatch.ts`). */
export function resolveLeadBearerTokenOrNull(): string | null {
  return trimEnv("KITEPROP_API_TOKEN") ?? getKitepropSharedSecretOrNull();
}

/**
 * Si es `1`, los GET REST tipo `GET /properties` y `GET /users` envían **Bearer + `X-API-Key`**:
 * Bearer desde `KITEPROP_ACCESS_TOKEN` / secret **o** JWT de login (`KITEPROP_API_USER` + `KITEPROP_API_PASSWORD`);
 * clave en `KITEPROP_API_KEY` o fallback `KITEPROP_API_SECRET`.
 */
export function isKitepropRestBearerWithApiKeyEnabled(): boolean {
  return trimEnv("KITEPROP_REST_BEARER_WITH_API_KEY") === "1";
}
