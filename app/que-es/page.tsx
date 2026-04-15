import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { CTASection } from "@/components/sections/CTASection";

export const metadata: Metadata = {
  title: "Qué es Redalia",
  description:
    "Red inmobiliaria colaborativa en Chile: canje, visibilidad compartida, capacitación y estructura profesional para corredoras y agentes.",
};

const pilares = [
  {
    title: "Colaboración con reglas claras",
    text: "Coordinación entre corredoras y agentes para compartir oportunidades sin perder control de cada operación.",
  },
  {
    title: "Canje y circulación de oferta",
    text: "Más propiedades para ofrecer a tus clientes y más ejecutivos moviendo tu cartera, con criterios profesionales.",
  },
  {
    title: "Visibilidad compartida",
    text: "Tu marca y tus publicaciones dentro de un entorno pensado para el negocio inmobiliario, no para el ruido genérico.",
  },
  {
    title: "Formación y estándares",
    text: "Capacitación continua y buenas prácticas para elevar la calidad frente a clientes y entre socios.",
  },
];

export default function QueEsPage() {
  return (
    <div>
      <PageHero
        variant="navy-solid"
        eyebrow="Posicionamiento"
        title="Qué es Redalia"
        lead="Una red inmobiliaria colaborativa para Chile: unimos corredoras y agentes para generar más negocios con confianza, orden comercial y respaldo institucional."
      />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          title="Una comunidad profesional, no solo una vitrina"
          description="Redalia nace para que quienes están en terreno accedan a más oportunidades reales: colaboración entre pares, canje de carteras cuando corresponde y herramientas que ordenan la operación diaria."
          titleVariant="display"
        />
        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted">
          La tecnología es soporte: lo central es la red humana y los acuerdos comerciales. Trabajamos con estándares que
          protegen a los socios y dan previsibilidad a clientes y contrapartes.
        </p>
      </section>

      <section className="border-y border-brand-navy/10 bg-brand-navy-soft/50 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="card-elevated rounded-2xl border border-brand-navy/10 bg-white p-8 sm:p-10">
            <h2 className="text-xl font-bold text-brand-navy">Una propuesta actual para el corretaje en Chile</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              El mercado exige velocidad, transparencia y profesionalismo. Redalia se plantea como alternativa fuerte y
              moderna: seria en el trato entre socios, ordenada en la operación y clara en el valor para la corredora —
              sin depender de eslóganos del pasado ni de promesas vacías de «comunidad» sin negocio detrás.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          align="center"
          title="Pilares de la red"
          description="Lo que sostiene la propuesta de valor para corredoras y agentes que eligen trabajar juntos."
        />
        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
          {pilares.map((p) => (
            <li key={p.title} className="card-elevated rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-sm">
              <div className="mb-3 h-1 w-10 rounded-full bg-gradient-to-r from-brand-gold to-brand-gold-deep" />
              <h3 className="text-lg font-semibold text-brand-navy">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-brand-navy/10 bg-brand-navy-soft/40 p-8 shadow-sm sm:p-10">
          <h2 className="text-xl font-bold text-brand-navy">Para quién está pensada</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Para corredoras que quieren escalar resultados sin diluir su marca, y para agentes que necesitan más stock,
            más respaldo y una red seria con la que coordinar visitas y cierres. Si tu operación valora el trabajo
            profesional y la confidencialidad entre socios, Redalia encaja en esa lógica.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/colaboracion"
              className="inline-flex rounded-full bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-mid"
            >
              Colaboración y canje
            </Link>
            <Link
              href="/capacitacion"
              className="inline-flex rounded-full border border-brand-navy/20 px-5 py-2.5 text-sm font-semibold text-brand-navy hover:bg-white"
            >
              Capacitación
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <CTASection
          title="¿Querés profundizar con el equipo?"
          description="Coordinamos una presentación acotada a tu zona y tu tipo de operación, con foco comercial."
          primaryHref="/contacto"
          primaryLabel="Solicitar reunión"
          secondaryHref="/planes"
          secondaryLabel="Ver planes"
          tertiaryHref="/unete"
          tertiaryLabel="Postular a la red"
          footnote="Sin compromiso de ingreso: primero claridad, después decisión."
        />
      </section>
    </div>
  );
}
