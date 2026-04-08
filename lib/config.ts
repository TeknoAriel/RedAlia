/**
 * URL del feed JSON de KiteProp (difusión). Si no está definida, se usa `data/kiteprop-sample.json`.
 * En Vercel: agregar KITEPROP_PROPERTIES_URL en Environment Variables.
 */
export function getKitepropPropertiesUrl(): string | null {
  const fromEnv =
    process.env.KITEPROP_PROPERTIES_URL?.trim() ||
    process.env.NEXT_PUBLIC_KITEPROP_PROPERTIES_URL?.trim();
  return fromEnv || null;
}
