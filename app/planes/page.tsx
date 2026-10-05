import type { Metadata } from "next";
import Link from "next/link";
import { SectionLogoMark } from "@/components/brand/SectionLogoMark";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { CTASection } from "@/components/sections/CTASection";
import {
  MembershipPricingGrid,
  MembershipValueBar,
} from "@/components/sections/MembershipPricingGrid";
import { formatMembershipUf, membershipPlans } from "@/lib/membership-plans";

export const metadata: Metadata = {
  title: "Membresía y precios",
  description:
    "Planes de membresía Redalia en UF: Light, Single, Essential y Basic. CRM KiteProp, publicación en portales, canje, capacitación y prueba gratis por 7 días.",
};

const pasos = [
  { title: "Conversación inicial", text: "Entendemos tu operación, zona y objetivos comerciales." },
  { title: "Elige tu plan", text: "Light, Single, Essential o Basic, con precios publicados en UF y add-ons claros." },
  { title: "Prueba 7 días", text: "Activas la membresía, validas CRM, portales y canje sin compromiso de largo plazo." },
  { title: "Operación continua", text: "Colaboración entre socios, difusión y capacitación según el plan contratado." },
];

export default function PlanesPage() {
  const fromPrice = formatMembershipUf(membershipPlans[0].priceUf);

  return (
    <div className="bg-background">
      <PageHero
        variant="light"
        prepend={<SectionLogoMark size="sm" className="mb-5" />}
        eyebrow="Suscripciones y precios"
        title="Planes de membresía Redalia"
        lead={`Elige la modalidad que mejor se adapte a tu corredora. Precios desde ${fromPrice} al mes, con prueba gratis de 7 días, CRM KiteProp y publicación en portales.`}
        footnote="Valores en UF. Add-ons de usuarios y propiedades disponibles en todos los planes."
        contentClassName="py-20 sm:py-24"
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeader
          eyebrow="Planes"
          title="Suscripciones con precio publicado"
          description="Todos los planes incluyen comisión 100% para el agente, CRM KiteProp, micro sitio, bolsa de canje, capacitación mensual y respaldo legal. Cambia el cupo de usuarios y propiedades según el nivel."
          titleVariant="display"
        />
        <MembershipPricingGrid />
        <div className="mt-12 flex justify-center">
          <Link href="/contacto" className="btn-redalia-outline-on-light px-10 py-3.5 text-center text-sm font-semibold">
            Hablar con Redalia
          </Link>
        </div>
      </section>

      <section className="bg-brand-navy py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <MembershipValueBar />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="card-elevated rounded-2xl border border-brand-navy/10 bg-brand-navy-soft/40 p-8 sm:p-10">
          <p className="redalia-eyebrow redalia-eyebrow--muted !mb-0">Criterio Redalia</p>
          <h2 className="font-display mt-2 text-xl font-bold text-brand-navy sm:text-2xl">
            Membresía con foco en negocios reales
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
            Redalia es una comunidad profesional en Chile: orden, honestidad y transparencia entre socios, tecnología al
            servicio de la operación y respeto por la marca de cada corredora. El valor está en la claridad comercial, en
            el proceso de ingreso y en resultados que se puedan sostener en el tiempo.
          </p>
        </div>
      </section>

      <section className="border-y border-brand-navy/10 bg-brand-navy-soft/50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Incorporación"
            title="Proceso de ingreso a la membresía"
            description="Etapas transparentes para que la decisión se tome con información, sin presión indebida."
            titleVariant="display"
          />
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pasos.map((s) => (
              <li key={s.title} className="card-elevated rounded-2xl border border-brand-navy/10 bg-white p-6">
                <div className="redalia-card-accent" />
                <p className="font-display text-sm font-semibold text-brand-navy">{s.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <SectionLogoMark size="sm" className="mx-auto mb-5" />
        <CTASection
          title="¿Quieres activar la prueba de 7 días?"
          description="Completa la postulación con el plan que te interesa. Coordinamos la activación, accesos KiteProp y los próximos pasos con el mismo tono institucional de la red."
          primaryHref="/unete"
          primaryLabel="Probar gratis"
          secondaryHref="/contacto"
          secondaryLabel="Hablar con Redalia"
          footnote="Los precios publicados están en UF. El plan Essential es la referencia habitual para equipos en crecimiento."
        />
      </section>
    </div>
  );
}
