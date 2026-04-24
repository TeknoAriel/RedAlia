import "server-only";

/**
 * Cierre de paginación **sin** confiar en `last_page` de la API (a veces viene mal y corta a la 1.ª página).
 * - Página vacía → fin.
 * - Lote más chico que el 1.º no vacío (páginas > 1) → última página.
 */
export function firstBatchSizeOrKeep(
  pageItemsLength: number,
  firstNonEmptyBatchSize: number | null,
): number | null {
  if (pageItemsLength === 0) return firstNonEmptyBatchSize;
  if (firstNonEmptyBatchSize == null) return pageItemsLength;
  return firstNonEmptyBatchSize;
}

export function shouldStopNetworkPagination(args: {
  pageIndex1Based: number;
  pageItemsLength: number;
  firstNonEmptyBatchSize: number | null;
}): boolean {
  if (args.pageItemsLength === 0) return true;
  if (
    args.firstNonEmptyBatchSize != null &&
    args.pageIndex1Based > 1 &&
    args.pageItemsLength < args.firstNonEmptyBatchSize
  ) {
    return true;
  }
  return false;
}
