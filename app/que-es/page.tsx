import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { CTASection } from "@/components/sections/CTASection";

export const metadata: Metadata = {
  title: "Qué es Redalia",
  description:
    "Comunidad profesional de negocios inmobiliarios en Chile: negocios reales, canje, transparencia, capacitación y tecnología al servicio de más y mejores cierres.",
};

const pilares = [
  {
    title: "Negocios reales",
    text: "Prioridad a operaciones concretas: visitas, propuestas y cierres —no a la apariencia de movimiento sin resultado.",
  },
  {
    title: "Comunidad profesional",
    text: "Corredoras y agentes que comparten un estándar de rigurosidad comercial y respeto mutuo en cada paso.",
  },
  {
    title: "Canje y colaboración eficiente",
    text: "Oportunidades que circulan con reglas claras, coordinación seria y foco en ejecutar entre socios.",
  },
  {
    title: "Honestidad y transparencia",
    text: "Acuerdos y roles que se entienden desde el inicio, con trato franco frente al mercado y dentro de la red.",
  },
  {
    title: "Profesionalismo",
    text: "Cuidado de la reputación de cada marca y de la relación directa con comprador o arrendatario.",
  },
  {
    title: "Capacitación continua",
    text: "Formación aplicable al terreno y a la negociación, alineada a la realidad del corretaje en Chile.",
  },
  {
    title: "Tecnología al servicio de la comunidad",
    text: "Herramientas que ordenan difusión y operación sin sustituir el criterio del corredor ni la confianza entre pares.",
  },
  {
    title: "Más y mejores cierres",
    text: "Meta explícita: que la comunidad ayude a cerrar mejor, no solo a exponer más fichas.",
  },
];

export default function QueEsPage() {
  return (
    <div>
      <PageHero
        variant="navy-solid"
        title="Qué es Redalia"
        lead="Una comunidad profesional de negocios inmobiliarios en Chile: unimos corredoras y agentes para más y mejores cierres, con canje ordenado, transparencia entre socios y tecnología al servicio de quien ejecuta en terreno."
      />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          title="Comunidad orientada al negocio, no solo otra vitrina"
          description="Redalia reúne a quienes están en terreno para acceder a más oportunidades reales: colaboración entre pares, canje cuando corresponde y marco claro que ordena la operación diaria."
          titleVariant="display"
        />
        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted">
          La tecnología es soporte serio: lo central es la confianza entre profesionales y los acuerdos comerciales con
          honestidad. Trabajamos con estándares que protegen a los socios y dan previsibilidad a clientes y
          contrapartes.
        </p>
      </section>

      <section className="border-y border-brand-navy/10 bg-brand-navy-soft/50 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="card-elevated rounded-2xl border border-brand-navy/10 bg-white p-8 sm:p-10">
            <h2 className="redalia-h2-section">Una propuesta sobria para el corretaje en Chile</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              El mercado pide rigor, transparencia y profesionalismo. Redalia se plantea como comunidad concreta: trato
              serio entre socios, operación ordenada y valor claro para quien vende —sin promesas vacías de
              innovación ni de comunidad sin cierres detrás.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          align="center"
          title="Pilares de Redalia"
          description="Lo que sostiene la propuesta para corredoras y agentes que eligen colaborar con criterio en Chile."
          titleVariant="display"
        />
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pilares.map((p) => (
            <li key={p.title} className="card-elevated rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-sm">
              <div className="redalia-card-accent" />
              <h3 className="text-lg font-semibold text-brand-navy">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-brand-navy/10 bg-brand-navy-soft/40 p-8 shadow-sm sm:p-10">
          <h2 className="redalia-h2-section">Para quién está pensada</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Para corredoras que quieren escalar resultados sin diluir su marca, y para agentes que necesitan más oferta
            real, más respaldo y una comunidad seria con la que coordinar visitas y cierres. Si valorás el trabajo
            profesional y la confianza entre socios, Redalia encaja en esa lógica.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/colaboracion"
              className="inline-flex rounded-full bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-mid"
            >
              Canje y colaboración
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
          primaryHref="/planes"
          primaryLabel="Ver membresía"
          secondaryHref="/unete"
          secondaryLabel="Postular como socio"
          footnote="Sin compromiso de ingreso: primero claridad, después decisión."
        />
      </section>
    </div>
  );
}
