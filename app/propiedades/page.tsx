import type { Metadata } from "next";
import { CatalogListingPage } from "@/components/catalog/CatalogListingPage";

/**
 * `force-dynamic` evita el flujo ISR (que en `/propiedades` sin params tendía
 * a timeoutear 504 en el primer cold). La cache real vive en `getProperties`
 * (in-memory + Upstash) y el rendering de la lista filtrada es siempre por
 * request, según `searchParams`.
 *
 * `maxDuration = 60` cubre el primer cold lambda donde haya que rehidratar
 * desde Upstash o ingestar como último recurso.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Propiedades",
  description:
    "Publicaciones del catálogo Redalia: venta, arriendo y otras operaciones. Consultá oportunidades y derivá consultas con criterio profesional.",
};

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  return <CatalogListingPage basePath="/propiedades" searchParams={sp} />;
}
