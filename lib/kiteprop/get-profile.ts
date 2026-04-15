import "server-only";

import { kitepropGetJson } from "@/lib/kiteprop/client";

/**
 * GET `/profile` en la API v1 de KiteProp (autenticación con `X-API-Key`).
 */
export function getKitePropProfile() {
  return kitepropGetJson<unknown>("/profile");
}
