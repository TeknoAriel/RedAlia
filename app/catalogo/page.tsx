import type { Metadata } from "next";
import { CatalogListingPage } from "@/components/catalog/CatalogListingPage";

/** Misma política que `/propiedades`: HTML por request; cache en `getProperties`. */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Catálogo de propiedades",
  description:
    "Mismo catálogo público que Propiedades, con filtros y paginación en el servidor. Redalia · Chile.",
};

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  return <CatalogListingPage basePath="/catalogo" searchParams={sp} />;
}
