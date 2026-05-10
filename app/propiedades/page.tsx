import type { Metadata } from "next";
import { CatalogListingPage } from "@/components/catalog/CatalogListingPage";

/** ISR de la ruta; alineado con default de `REDALIA_CATALOG_REVALIDATE_SECONDS` en docs. El data cache de `getProperties` sigue leyendo env. */
export const revalidate = 1800;
/**
 * Mismo razonamiento que `app/socios/page.tsx`: el primer lambda cold puede tardar
 * 30–60 s en poblar la cache de catálogo (in-memory + `unstable_cache` + Upstash).
 * Permitimos hasta 60 s para que la función no se mate antes de cachear, y los
 * requests siguientes resuelvan en sub-segundo.
 */
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
