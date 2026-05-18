import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SectionLogoMark } from "@/components/brand/SectionLogoMark";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { CTASection } from "@/components/sections/CTASection";
import {
  SociosPageContent,
  SociosPageContentFallback,
} from "@/components/socios/SociosPageContent";

/**
 * `force-dynamic` evita que Next intente generar HTML estático para `/socios`
 * (sin query params) y caiga en un flujo ISR donde el primer cold paga 60 s
 * de ingest y termina en 504. Como la página depende de `searchParams` y de
 * `getProperties`, no hay valor real en cachear el HTML por ruta.
 *
 * `maxDuration = 60` queda como cinturón de seguridad para el primer cold
 * lambda que aún tenga que poblar la cache (in-memory + Upstash).
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Socios",
  description:
    "Directorio institucional de la comunidad Redalia: socios con publicaciones en el catálogo, criterios de pertenencia y colaboración profesional en Chile.",
};

const perfilCards = [
  {
    title: "Corredoras y estudios",
    text: "Equipos que amplían canales con criterio, ordenan la colaboración entre oficinas y acceden a oportunidades fuera de la cartera inmediata, sin perder su marca.",
  },
  {
    title: "Agentes y ejecutivos",
    text: "Profesionales con más stock para ofrecer, respaldo institucional y una red seria para coordinar visitas y cierres con transparencia frente al cliente.",
  },
  {
    title: "Operaciones con varias marcas",
    text: "Estructuras que valoran la independencia comercial y, al mismo tiempo, un marco común de canje, estándares y capacitación continua.",
  },
];

const estandares = [
  {
    title: "Admisión conversada",
    text: "El ingreso implica alinear perfil comercial, zona y expectativas con el equipo de Redalia —no es un alta automática masiva.",
  },
  {
    title: "Visibilidad profesional",
    text: "Los socios exponen marca y contacto en un directorio pensado para generar negocio entre pares, no para exposición superficial.",
  },
  {
    title: "Colaboración con trazabilidad",
    text: "Canje y referencias de propiedades se apoyan en criterios de la comunidad y en el trabajo directo entre corredores.",
  },
  {
    title: "Pertenencia con prestigio",
    text: "Formar parte de Redalia comunica que tu operación se mueve en un circuito serio, actual y orientado a resultados.",
  },
];

export default async function SociosPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};

  return (
    <div className="bg-background">
      <PageHero
        variant="navy-solid"
        prepend={<SectionLogoMark size="sm" className="mb-5 opacity-95" />}
        eyebrow="Socios"
        title="Comunidad con presencia verificable en Chile"
        lead="Corredoras, oficinas y anunciantes que hoy publican en el catálogo público. Cada ficha refleja operación real en la red: perfil institucional y acceso al listado filtrado. El ingreso formal siempre se conversa con el equipo comercial."
        footnote="Los datos del directorio se derivan de publicaciones activas y criterios de visibilidad de la comunidad —sin exposición superficial."
        contentClassName="py-20 sm:py-24"
      />

      <section className="strip-navy border-b border-white/10 py-12 text-white">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <p className="redalia-eyebrow redalia-eyebrow--onNavy mx-auto max-w-xl text-center !mb-0">
            Marco de pertenencia
          </p>
          <h2 className="redalia-h2-band mx-auto mt-3 max-w-3xl text-center">
            Por qué importa ser socio de Redalia
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
            No es solo aparecer en un listado: es formar parte de una comunidad que cierra negocios con estándares,
            transparencia y visibilidad profesional entre pares.
          </p>
          <ul className="mt-10 grid gap-6 text-left sm:grid-cols-2">
            {estandares.map((e) => (
              <li
                key={e.title}
                className="rounded-2xl border border-white/15 bg-white/[0.06] px-6 py-6 backdrop-blur-sm"
              >
                <div className="redalia-card-accent" />
                <h3 className="font-display text-base font-semibold text-white">{e.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/78">{e.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeader
          eyebrow="Perfiles"
          title="Quiénes conviven en la comunidad"
          description="Distintas escalas, mismo estándar de seriedad comercial y disposición a colaborar con criterio y rigor frente al mercado."
          titleVariant="display"
        />
        <ul className="mt-10 grid gap-6 sm:grid-cols-3">
          {perfilCards.map((c) => (
            <li
              key={c.title}
              className="card-elevated rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-sm"
            >
              <div className="redalia-card-accent" />
              <h3 className="font-display text-base font-semibold text-brand-navy">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-10 max-w-3xl text-sm leading-relaxed text-muted">
          El ingreso se coordina con el equipo de Redalia. Para el detalle del proceso comercial, revisa{" "}
          <Link href="/unete" className="font-semibold text-brand-gold-deep underline-offset-2 hover:underline">
            Postulación
          </Link>{" "}
          o{" "}
          <Link href="/planes" className="font-semibold text-brand-gold-deep underline-offset-2 hover:underline">
            Membresía
          </Link>
          .
        </p>
      </section>

      <Suspense fallback={<SociosPageContentFallback />}>
        <SociosPageContent searchParams={sp} />
      </Suspense>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionLogoMark size="sm" className="mx-auto mb-5" />
        <CTASection
          title="¿Quieres sumar tu corredora al directorio y a la comunidad?"
          description="Coordinamos una reunión para revisar admisión, visibilidad y plan de membresía —sin compromiso y con el mismo tono profesional que en el resto de la red."
          primaryHref="/planes"
          primaryLabel="Ver membresía"
          secondaryHref="/unete"
          secondaryLabel="Postular como socio"
          footnote="Si ya operas con la comunidad, el equipo te indicará los pasos para visibilidad pública cuando corresponda."
        />
      </section>
    </div>
  );
}
