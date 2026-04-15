import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { CTASection } from "@/components/sections/CTASection";

export const metadata: Metadata = {
  title: "Capacitación",
  description:
    "Formación continua para socios Redalia: buenas prácticas, herramientas y actualización para corredoras y agentes en Chile.",
};

const ejes = [
  {
    title: "Práctica comercial",
    text: "Negociación, calificación de clientes, seguimiento de oportunidades y estándares de atención.",
  },
  {
    title: "Herramientas y operación",
    text: "Uso ordenado de plataformas de publicación y seguimiento, alineado a la operación diaria de la red.",
  },
  {
    title: "Normativa y contexto",
    text: "Actualización sobre aspectos relevantes del marco legal y las buenas prácticas del rubro.",
  },
];

export default function CapacitacionPage() {
  return (
    <div>
      <section className="border-b border-brand-navy/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-deep">Redalia</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
            Capacitación continua
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            La red apuesta por el desarrollo permanente de sus socios: mejor formación significa mejores resultados para
            las corredoras, los agentes y los clientes finales.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          title="Formación que acompaña el negocio"
          description="Las instancias de aprendizaje están pensadas para aplicarse de inmediato en terreno, no como contenido genérico desconectado de la realidad del corretaje en Chile."
        />
      </section>

      <section className="border-y border-brand-navy/10 bg-brand-navy-soft/50 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader align="center" title="Ejes de contenido" />
          <ul className="mt-10 grid gap-6 sm:grid-cols-3">
            {ejes.map((e) => (
              <li key={e.title} className="rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-sm">
                <div className="mb-3 h-1 w-10 rounded-full bg-gradient-to-r from-brand-gold to-brand-gold-deep" />
                <h3 className="text-base font-semibold text-brand-navy">{e.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{e.text}</p>
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted">
            El calendario y el formato (presencial, online o mixto) se comunican a los socios según cada ciclo. Para
            conocer el alcance según tu plan,{" "}
            <Link href="/contacto" className="font-medium text-brand-gold-deep underline-offset-2 hover:underline">
              escribinos
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <CTASection
          title="¿Querés sumarte y acceder a la formación de la red?"
          description="Te contamos cómo es el proceso de ingreso y qué incluye tu nivel de participación."
          primaryHref="/unete"
          primaryLabel="Postular a la red"
          secondaryHref="/planes"
          secondaryLabel="Ver planes"
        />
      </section>
    </div>
  );
}
