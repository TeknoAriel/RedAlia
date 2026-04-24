/**
 * Muchas respuestas REST envuelven la ficha en `property` / `listing` / `detail`.
 * Misma heurística que `loadPublicCatalogFromNetwork`.
 * Las imágenes a veces vienen solo en el nodo anidado o solo en la raíz vacía: priorizamos el primer arreglo no vacío.
 */
function firstImageLikeArray(
  a: unknown,
  b: unknown,
): unknown {
  if (Array.isArray(a) && a.length > 0) return a;
  if (Array.isArray(b) && b.length > 0) return b;
  if (Array.isArray(a)) return a;
  if (Array.isArray(b)) return b;
  return a ?? b;
}

export function coerceNetworkPropertyRecord(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const r = raw as Record<string, unknown>;
  const nested = r.property ?? r.listing ?? r.listing_object ?? r.detail;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const n = nested as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...r, ...n };
    merged.images = firstImageLikeArray(n.images, r.images);
    merged.images_list = firstImageLikeArray(n.images_list, r.images_list);
    merged.imagesList = firstImageLikeArray(n.imagesList, r.imagesList);
    merged.photos = firstImageLikeArray(n.photos, r.photos);
    merged.gallery = firstImageLikeArray(n.gallery, r.gallery);
    merged.multimedia = firstImageLikeArray(n.multimedia, r.multimedia);
    merged.media = firstImageLikeArray(n.media, r.media);
    return merged;
  }
  return raw;
}
