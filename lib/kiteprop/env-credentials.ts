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
