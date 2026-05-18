import Link from "next/link";
import { Suspense } from "react";
import {
  CatalogListingData,
  CatalogListingDataFallback,
} from "@/components/catalog/CatalogListingData";

type Props = {
  basePath: "/propiedades" | "/catalogo";
  searchParams: Record<string, string | string[] | undefined>;
};

/** Shell estático + listado streameado en `CatalogListingData`. */
export function CatalogListingPage({ basePath, searchParams }: Props) {
  return (
    <div>
      <section className="border-b border-brand-navy/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <p className="redalia-eyebrow redalia-eyebrow--onLight">Catálogo</p>
          <h1 className="font-display mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-brand-navy sm:text-4xl">
            Oportunidades publicadas
          </h1>
          <p className="mt-4 max-w-2xl text-muted">
            Listado para que corredoras y agentes compartan y cierren más operaciones. Las fichas se actualizan según
            la operación de la comunidad; si necesitas una búsqueda específica,{" "}
            <Link href="/contacto" className="font-medium text-brand-gold-deep underline-offset-2 hover:underline">
              escríbenos
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <Suspense fallback={<CatalogListingDataFallback />}>
          <CatalogListingData basePath={basePath} searchParams={searchParams} />
        </Suspense>
      </section>
    </div>
  );
}
