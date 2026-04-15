import "server-only";

/**
 * La ruta `/api/test-kiteprop` solo debe estar activa cuando se necesita validar la integración.
 * En producción: dejar sin definir o distinto de "1" para no exponer el endpoint.
 *
 * Vercel: `KITEPROP_ENABLE_API_TEST=1` solo mientras corrés pruebas; luego eliminar o poner en 0.
 */
export function isKitePropApiTestEnabled(): boolean {
  return process.env.KITEPROP_ENABLE_API_TEST?.trim() === "1";
}
