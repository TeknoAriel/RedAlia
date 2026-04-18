import type { Metadata } from "next";
import { Suspense } from "react";
import { PropertiesExplorer } from "@/components/properties/PropertiesExplorer";
import { getProperties } from "@/lib/get-properties";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Propiedades",
  description:
    "Publicaciones del catálogo Redalia: venta, arriendo y otras operaciones. Consultá oportunidades y derivá consultas con criterio profesional.",
};

export default async function PropiedadesPage() {
  const result = await getProperties();

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
            la operación de la comunidad; si necesitás una búsqueda específica,{" "}
            <Link href="/contacto" className="font-medium text-brand-gold-deep underline-offset-2 hover:underline">
              escribinos
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        {result.ok && result.usedSampleFallback && (
          <div className="mb-6 rounded-2xl border border-brand-navy/15 bg-brand-navy-soft/50 px-5 py-4 text-sm text-brand-navy">
            <p className="font-medium">Listado referencial</p>
            <p className="mt-1 text-muted">
              Mostramos una selección de ejemplo mientras se restablece la conexión con el catálogo actualizado. Para
              publicaciones vigentes y prioridades comerciales, contactá al equipo de Redalia.
            </p>
          </div>
        )}
        {!result.ok && (
          <div className="mb-8 rounded-2xl border border-brand-navy/15 bg-brand-navy-soft/50 px-5 py-6 text-center text-brand-navy">
            <p className="font-medium">No pudimos mostrar el catálogo en este momento</p>
            <p className="mt-2 text-sm text-muted">
              Podés volver a intentar más tarde o coordinar con nosotros por correo y te orientamos.
            </p>
            <Link
              href="/contacto"
              className="mt-4 inline-flex rounded-full bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-mid"
            >
              Contacto
            </Link>
          </div>
        )}
        {result.ok && result.properties.length === 0 && (
          <div className="mb-8 rounded-2xl border border-brand-navy/15 bg-brand-navy-soft/50 px-6 py-12 text-center text-brand-navy">
            <p className="font-medium">No hay publicaciones disponibles por ahora</p>
            <p className="mt-2 text-sm text-muted">
              Si querés conocer cómo incorporar oferta o recibir novedades de la red, dejanos un mensaje.
            </p>
            <Link
              href="/contacto"
              className="mt-4 inline-flex rounded-full border border-brand-navy/25 px-5 py-2.5 text-sm font-semibold text-brand-navy hover:bg-white"
            >
              Escribir a Redalia
            </Link>
          </div>
        )}
        {result.ok && result.properties.length > 0 && (
          <Suspense
            fallback={
              <div
                className="mx-auto max-w-6xl animate-pulse rounded-2xl border border-brand-navy/10 bg-brand-navy-soft/40"
                style={{ minHeight: "12rem" }}
              />
            }
          >
            <PropertiesExplorer properties={result.properties} />
          </Suspense>
        )}
      </section>
    </div>
  );
}
