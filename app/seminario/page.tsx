import type { Metadata } from "next";
import Link from "next/link";
import { SectionLogoMark } from "@/components/brand/SectionLogoMark";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { Field, LeadForm } from "@/components/forms/LeadForm";
import { siteConfig } from "@/lib/site-config";
import { getWhatsappContact } from "@/lib/public-contact";
import {
  formatMembershipUf,
  membershipIncludedFeatures,
  membershipJoinHref,
  membershipPlans,
} from "@/lib/membership-plans";
import { seminarioPromo } from "@/lib/campaign-seminario";

export const metadata: Metadata = {
  title: "Invitación seminario",
  description:
    "Invitación Redalia para oficinas y corredoras: prueba 7 días, planes en UF y mesa de incorporación preferente.",
};

export default function SeminarioPage() {
  const wa = getWhatsappContact();

  return (
    <div className="bg-background">
      <PageHero
        variant="navy-solid"
        prepend={<SectionLogoMark size="sm" className="mb-5 opacity-95" />}
        eyebrow={seminarioPromo.badge}
        title={seminarioPromo.hook}
        lead={seminarioPromo.lead}
        footnote={seminarioPromo.offerBody}
        contentClassName="py-20 sm:py-24"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          {wa ? (
            <a
              href={wa.href}
              className="btn-redalia-gold-solid px-8 py-3.5"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp {wa.display}
            </a>
          ) : null}
          <Link href="/unete?from=seminario" className="btn-redalia-outline-on-navy px-8 py-3.5">
            Activar prueba 7 días
          </Link>
        </div>
      </PageHero>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Por qué Redalia"
          title="Una red para oficinas que ya operan en grande"
          description="Canje con reglas, catálogo compartido, CRM KiteProp, publicación en portales y 100% de comisión para el agente. Tu marca permanece al frente."
          titleVariant="display"
        />
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {membershipIncludedFeatures.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-brand-navy">
              <span className="text-brand-gold">✓</span>
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-muted">
          Hoy el catálogo público supera las 3.000 propiedades y las 600 corredoras y anunciantes. Los equipos mayores
          conversan un plan a medida; la grilla publicada cubre desde operación individual hasta oficinas de 50
          propiedades.
        </p>
      </section>

      <section className="border-y border-brand-navy/10 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            align="center"
            eyebrow="Membresía"
            title="Planes en UF"
            description="Misma base en todos los niveles. Cambia usuarios y propiedades."
            titleVariant="display"
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {membershipPlans.map((plan) => (
              <article
                key={plan.key}
                className={`rounded-2xl border p-6 ${
                  plan.featured ? "border-brand-gold/60 bg-brand-navy text-white" : "border-brand-navy/10 bg-white"
                }`}
              >
                {plan.featured ? (
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-brand-gold">Más popular</p>
                ) : null}
                <h3 className="font-display text-lg font-bold">{plan.name}</h3>
                <p className="mt-2 font-display text-2xl font-bold">
                  {formatMembershipUf(plan.priceUf)}
                  <span className={`ml-1 font-sans text-sm font-medium ${plan.featured ? "text-white/70" : "text-muted"}`}>
                    / mes
                  </span>
                </p>
                <p className={`mt-2 text-sm ${plan.featured ? "text-white/80" : "text-muted"}`}>
                  {plan.users === 1 ? "1 usuario" : `${plan.users} usuarios`} · {plan.properties} propiedades
                </p>
                <Link
                  href={`${membershipJoinHref(plan)}&from=seminario`}
                  className={`mt-5 inline-flex text-sm font-semibold ${
                    plan.featured ? "text-brand-gold" : "text-brand-gold-deep"
                  } hover:underline`}
                >
                  Probar 7 días →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeader
              eyebrow="Incorporación"
              title="Deja tus datos y activamos la prueba"
              description="Mesa preferente para quienes vienen del seminario. Respuesta en días hábiles."
              titleVariant="display"
            />
          </div>
          <div className="card-elevated rounded-2xl border border-brand-navy/10 bg-white p-6 sm:p-8">
            <LeadForm kind="join" submitLabel="Solicitar prueba de 7 días">
              <input type="hidden" name="origen" value="seminario" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre" name="nombre" required />
                <Field label="Apellido" name="apellido" required />
              </div>
              <Field label="Empresa o corredora" name="empresa" required />
              <Field label="Ciudad" name="ciudad" required />
              <Field label="Email" name="email" type="email" required />
              <Field label="Teléfono" name="telefono" type="tel" required />
              <Field label="Mensaje" name="mensaje" rows={3} placeholder="Tamaño del equipo, zonas y plan de interés" />
            </LeadForm>
            <p className="mt-4 text-xs text-muted">
              También puedes escribir a {siteConfig.contact.email}
              {wa ? ` o por WhatsApp ${wa.display}` : ""}.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
