/**
 * URL del feed JSON de KiteProp (difusión). Si no está definida, se usa `data/kiteprop-sample.json`.
 * En Vercel: agregar KITEPROP_PROPERTIES_URL en Environment Variables.
 *
 * Opcional — excluir la agencia matriz/globalizadora (ej. Aina) si el nombre en el feed no coincide con los alias por defecto:
 * - KITEPROP_MASTER_AGENCY_NAMES: nombres separados por coma (comparación normalizada, sin acentos).
 * - KITEPROP_MASTER_AGENCY_IDS: ids numéricos separados por coma.
 * Ver `lib/master-agency.ts`.
 */
export function getKitepropPropertiesUrl(): string | null {
  const fromEnv =
    process.env.KITEPROP_PROPERTIES_URL?.trim() ||
    process.env.NEXT_PUBLIC_KITEPROP_PROPERTIES_URL?.trim();
  return fromEnv || null;
}
