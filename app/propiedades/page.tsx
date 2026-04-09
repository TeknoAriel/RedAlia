import type { Metadata } from "next";
import { PropertiesExplorer } from "@/components/properties/PropertiesExplorer";
import { getProperties } from "@/lib/get-properties";

export const metadata: Metadata = {
  title: "Propiedades",
  description:
    "Propiedades publicadas en Redalia, alimentadas desde el feed JSON de KiteProp: venta, arriendo y más.",
};

export default async function PropiedadesPage() {
  const result = await getProperties();

  return (
    <div>
      <section className="border-b border-brand-navy/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-deep">Propiedades</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
            Oportunidades conectadas a la red
          </h1>
          <p className="mt-4 max-w-2xl text-muted">
            Catálogo orientado a <strong className="font-medium text-brand-navy">resultados reales</strong>: datos
            desde el JSON de difusión de <strong className="font-medium text-brand-navy">KiteProp</strong>. Con{" "}
            <code className="rounded bg-brand-navy-soft px-1 text-xs">KITEPROP_PROPERTIES_URL</code> en Vercel
            cargás el feed completo; sin URL, fichas de muestra desde el repo.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        {result.ok && result.source === "sample" && (
          <div className="mb-6 rounded-2xl border border-brand-gold/40 bg-brand-navy-soft/60 px-5 py-4 text-sm text-brand-navy">
            <p className="font-medium">Modo muestra</p>
            <p className="mt-1 text-muted">
              Estás viendo <strong>data/kiteprop-sample.json</strong> (liviano). Para el catálogo completo,
              definí la variable de entorno del JSON de difusión en el panel de Vercel.
            </p>
          </div>
        )}
        {!result.ok && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
            <p className="font-medium">No se pudieron cargar las propiedades.</p>
            <p className="mt-1 text-amber-900/90">{result.error}</p>
          </div>
        )}
        {result.ok && result.properties.length === 0 && (
          <div className="mb-8 rounded-2xl border border-brand-navy/15 bg-brand-navy-soft/50 px-6 py-12 text-center text-brand-navy">
            <p className="font-medium">No hay publicaciones disponibles por ahora.</p>
            <p className="mt-2 text-sm text-muted">Probá más tarde o revisá la URL del feed en configuración.</p>
          </div>
        )}
        {result.ok && result.properties.length > 0 && (
          <PropertiesExplorer properties={result.properties} />
        )}
      </section>
    </div>
  );
}
