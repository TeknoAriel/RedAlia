import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { CTASection } from "@/components/sections/CTASection";

export const metadata: Metadata = {
  title: "Servicios",
  description:
    "Servicios y acompañamiento para socios Redalia: asesoría comercial, difusión, estructura de red y respaldo operativo.",
};

const servicios = [
  {
    title: "Asesoría de incorporación",
    text: "Alineación de expectativas, territorio y modelo de participación antes y durante el ingreso a la red.",
  },
  {
    title: "Estructura de colaboración",
    text: "Marco para canje, circulación de oportunidades y coordinación entre corredoras y agentes.",
  },
  {
    title: "Visibilidad y difusión",
    text: "Criterios para que las publicaciones lleguen a socios con capacidad de ejecutar, no solo a listados pasivos.",
  },
  {
    title: "Respaldo operativo",
    text: "Soporte para ordenar la operación diaria con herramientas profesionales del sector, sin que eso sustituya el protagonismo de la red humana.",
  },
];

export default function ServiciosPage() {
  return (
    <div>
      <section className="border-b border-brand-navy/10 bg-brand-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">Redalia</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">Servicios para la red</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/88">
            Más allá del listado de propiedades, Redalia ofrece estructura comercial, acompañamiento y servicios
            pensados para que la colaboración entre socios sea sostenible.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          title="Qué incluye el acompañamiento"
          description="Los alcances exactos dependen del perfil y del plan acordado; estos pilares describen la lógica de valor que ofrecemos a las corredoras y agentes que forman parte de la red."
        />
        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
          {servicios.map((s) => (
            <li key={s.title} className="rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-brand-navy">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm text-muted">
          Para un detalle acotado a tu corredora o equipo, revisá también la sección{" "}
          <Link href="/planes" className="font-medium text-brand-gold-deep underline-offset-2 hover:underline">
            Planes
          </Link>{" "}
          o coordiná una reunión en{" "}
          <Link href="/contacto" className="font-medium text-brand-gold-deep underline-offset-2 hover:underline">
            Contacto
          </Link>
          .
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <CTASection
          title="¿Necesitás una propuesta a medida?"
          description="Evaluamos tu operación y te entregamos el alcance comercial claro, sin cifras genéricas."
          primaryHref="/contacto"
          primaryLabel="Pedir reunión"
          secondaryHref="/que-es"
          secondaryLabel="Qué es Redalia"
        />
      </section>
    </div>
  );
}
