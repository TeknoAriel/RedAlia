import type { Metadata } from "next";
import { CatalogListingPage } from "@/components/catalog/CatalogListingPage";

/**
 * Dinámico por `searchParams`. La cache del catálogo vive en `getProperties`
 * (memoria + Upstash); la red AINA solo corre en cron.
 * `maxDuration` acotado: sin cold ingest de red en request de usuario.
 */
export const dynamic = "force-dynamic";
/** 120s: cubre cold JSON→Data Cache si Upstash está en cuota (sin paginar red). */
export const maxDuration = 120;

export const metadata: Metadata = {
  title: "Propiedades",
  description:
    "Publicaciones del catálogo Redalia: venta, arriendo y otras operaciones. Consulta oportunidades y deriva consultas con criterio profesional.",
};

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  return <CatalogListingPage basePath="/propiedades" searchParams={sp} />;
}
