import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { CTASection } from "@/components/sections/CTASection";

export const metadata: Metadata = {
  title: "Planes",
  description:
    "Niveles de participación en Redalia: flexibilidad, personalización y orientación al valor. Montos según perfil y alcance.",
};

const plans = [
  {
    name: "Plan inicial",
    pitch: "Pensado para comenzar con presencia en la red y circulación básica de oportunidades.",
    bullets: [
      "Participación en la red y acceso a flujos definidos",
      "Visibilidad acorde al nivel",
      "Acompañamiento para incorporación",
    ],
    cta: "Consultar",
  },
  {
    name: "Plan profesional",
    pitch: "Para equipos que ya operan y buscan más difusión, coordinación y foco comercial.",
    bullets: [
      "Mayor exposición dentro de la red",
      "Herramientas y criterios de difusión ampliados",
      "Soporte comercial más cercano",
    ],
    cta: "Solicitar propuesta",
    featured: true,
  },
  {
    name: "Plan corporativo",
    pitch: "Estructura a medida para corredoras con varias sucursales o marcas que requieren alcance coordinado.",
    bullets: [
      "Diseño según perfil y territorio",
      "Coordinación con equipos y marcas",
      "Plan a medida y según alcance",
    ],
    cta: "Coordinar reunión",
  },
];

export default function PlanesPage() {
  return (
    <div>
      <section className="border-b border-brand-navy/10 bg-gradient-to-b from-brand-navy-soft/80 to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-deep">Planes</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
            Participación flexible, orientada al valor
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            Los montos y alcances se definen según perfil, zona y objetivos comerciales. No publicamos
            cifras genéricas: preferimos una propuesta clara, a medida.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          title="Tres niveles de referencia"
          description="Podés usarlos como guía en la conversación con el equipo de Redalia. El detalle contractual y comercial se ajusta a cada caso."
        />
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-2xl border p-8 ${
                plan.featured
                  ? "border-brand-gold/50 bg-white shadow-lg ring-1 ring-brand-gold/25"
                  : "border-brand-navy/10 bg-white"
              }`}
            >
              {plan.featured && (
                <span className="mb-3 inline-flex w-fit rounded-full bg-brand-navy px-3 py-1 text-xs font-semibold text-white">
                  Recomendado para equipos en crecimiento
                </span>
              )}
              <h2 className="text-xl font-bold text-brand-navy">{plan.name}</h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{plan.pitch}</p>
              <p className="mt-6 text-2xl font-semibold text-brand-navy">Según perfil y alcance</p>
              <p className="text-sm text-muted">Valores y alcance a coordinar en asesoría.</p>
              <ul className="mt-6 space-y-2 text-sm text-brand-navy/90">
                {plan.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-brand-gold">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                href="/contacto"
                className={`mt-8 inline-flex justify-center rounded-full px-5 py-3 text-center text-sm font-semibold transition ${
                  plan.featured
                    ? "bg-brand-gold text-brand-navy hover:bg-[#d4b82e]"
                    : "border border-brand-navy/20 text-brand-navy hover:bg-brand-navy-soft"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <CTASection
          title="¿Querés una propuesta acotada a tu operación?"
          description="En una reunión breve alineamos objetivos, territorio y expectativas. Sin cifras inventadas: transparencia y valor."
          primaryHref="/contacto"
          primaryLabel="Pedir asesoramiento"
          secondaryHref="/unete"
          secondaryLabel="Postular desde Únete"
        />
      </section>
    </div>
  );
}
