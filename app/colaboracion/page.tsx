import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { CTASection } from "@/components/sections/CTASection";

export const metadata: Metadata = {
  title: "Canje y colaboración",
  description:
    "Cómo Redalia ordena el canje y la colaboración en la comunidad inmobiliaria chilena: oportunidades reales, transparencia y foco en cierres.",
};

const puntos = [
  {
    title: "Más oferta para cada cliente",
    text: "Accedés a propiedades de otros socios bajo reglas explícitas, para ampliar alternativas sin depender solo de grupos informales o cadenas interminables.",
  },
  {
    title: "Tu cartera en movimiento",
    text: "Otros ejecutivos presentan tus publicaciones a compradores y arrendatarios calificados, con coordinación previa y respeto por tu marca.",
  },
  {
    title: "Cooperación con trato profesional",
    text: "Transparencia en comisiones y roles cuando la operación lo requiere, y prioridad al diálogo directo entre corredores.",
  },
  {
    title: "Menos fricción operativa",
    text: "Criterios comunes para difusión y seguimiento liberan tiempo para visitas, negociación y cierre —donde está el margen.",
  },
];

const transformacion = [
  {
    title: "De lo informal a lo institucional",
    text: "Las conversaciones entre colegas pasan a apoyarse en una red con estándares, contacto comercial y seguimiento —sin perder agilidad.",
  },
  {
    title: "De la exposición suelta a la circulación con intención",
    text: "Las publicaciones se mueven hacia socios que pueden ejecutar, no solo hacia más vistas sin conversión.",
  },
  {
    title: "Del aislamiento al negocio compartido",
    text: "Cada socio sigue siendo dueño de su relación con el cliente; la red suma brazos comerciales y criterio de colaboración.",
  },
];

export default function ColaboracionPage() {
  return (
    <div>
      <PageHero
        variant="navy-gradient"
        eyebrow="Canje y colaboración"
        title="Canje y colaboración que ordenan el negocio compartido"
        lead="El corazón de la comunidad es que corredoras y agentes se respalden para cerrar más y mejor: circulación de oportunidades, cooperación en visitas y un marco profesional que reemplaza la informalidad dispersa."
      >
        <div className="flex flex-wrap gap-3">
          <Link href="/contacto" className="btn-redalia-gold-solid">
            Coordinar conversación comercial
          </Link>
          <Link href="/planes" className="btn-redalia-outline-on-navy">
            Ver membresía
          </Link>
        </div>
      </PageHero>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          title="Canje con sentido comercial"
          description="Compartir una ficha no basta: hace falta ponerla frente a ejecutivos que pueden moverla, con criterios de calificación y seguimiento acordes a un mercado serio."
          titleVariant="display"
        />
        <div className="mt-8 rounded-2xl border border-brand-gold/25 bg-brand-navy-soft/50 p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-brand-navy">No es networking sin operación detrás</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Redalia separa el encuentro social del trabajo comercial: acá se priorizan acuerdos que llevan a visitas,
            ofertas y cierres concretos. Si buscás solo ampliar agenda sin ejecutar, hay otros espacios más adecuados.
          </p>
        </div>
      </section>

      <section className="border-y border-brand-navy/10 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            align="center"
            title="Qué ganás al colaborar en Redalia"
            description="Resultados prácticos para quien está en terreno todos los días."
            titleVariant="display"
          />
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {puntos.map((p) => (
              <li
                key={p.title}
                className="card-elevated rounded-2xl border border-brand-navy/10 bg-brand-navy-soft/40 p-6"
              >
                <div className="redalia-card-accent" />
                <h3 className="text-lg font-semibold text-brand-navy">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          title="Cómo transformamos relaciones informales en red seria"
          description="El mismo espíritu de ayuda entre colegas, con estructura que protege a todos los involucrados."
          titleVariant="display"
        />
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {transformacion.map((t) => (
            <li key={t.title} className="rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-sm">
              <div className="redalia-card-accent" />
              <h3 className="text-base font-semibold text-brand-navy">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-brand-navy/10 bg-brand-navy-soft/50 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-brand-gold/30 bg-white p-8 sm:p-10">
            <h2 className="redalia-h2-section">Cómo se vive en la práctica</h2>
            <ol className="mt-6 list-decimal space-y-4 pl-5 text-sm leading-relaxed text-muted">
              <li>
                <strong className="text-brand-navy">Ingreso y alineación:</strong> definimos perfil, zona y expectativas
                con el equipo de la red.
              </li>
              <li>
                <strong className="text-brand-navy">Circulación de oportunidades:</strong> publicaciones y contactos
                disponibles para socios según las reglas de participación.
              </li>
              <li>
                <strong className="text-brand-navy">Coordinación en la operación:</strong> visitas, propuestas y cierres
                con claridad sobre roles y comisiones cuando corresponda.
              </li>
            </ol>
            <p className="mt-6 text-sm text-muted">
              El detalle contractual y comercial se ajusta a cada corredora; desde el primer día sabés cómo colaborar
              dentro de Redalia.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <CTASection
          title="¿Querés ordenar el canje de tu equipo con la comunidad?"
          description="Coordinamos una reunión para mapear oportunidades, transparencia en la colaboración y el nivel de membresía que mejor calce."
          primaryHref="/contacto"
          primaryLabel="Coordinar conversación comercial"
          secondaryHref="/propiedades"
          secondaryLabel="Ver catálogo"
          tertiaryHref="/unete"
          tertiaryLabel="Postular como socio"
        />
      </section>
    </div>
  );
}
