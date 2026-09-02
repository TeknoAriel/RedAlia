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
  membershipJoinHref,
  membershipPlans,
} from "@/lib/membership-plans";
import {
  redaliaBenefits,
  redaliaFeatures,
  seminarioPromo,
} from "@/lib/campaign-seminario";

export const metadata: Metadata = {
  title: "Sumate a Redalia · 20% de descuento",
  description:
    "Registrate en Redalia con 20% de descuento en tu primer trimestre. Red de alianzas para corredoras e inmobiliarias en Chile.",
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
        footnote={seminarioPromo.offerFinePrint}
        contentClassName="py-20 sm:py-24"
      >
        <p className="font-display text-2xl font-bold text-brand-gold sm:text-3xl">{seminarioPromo.offerTitle}</p>
        <p className="mt-2 text-sm text-white/80">
          Código <span className="font-semibold tracking-wide">{seminarioPromo.offerCode}</span>
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
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
            Registrarme ahora
          </Link>
        </div>
      </PageHero>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="La red"
          title="Características de Redalia"
          description="Todo lo que entra a tu operación al sumarte: canje, tecnología, difusión y respaldo institucional."
          titleVariant="display"
        />
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {redaliaFeatures.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-brand-navy">
              <span className="text-brand-gold">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-brand-navy/10 bg-brand-navy-soft/40 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Beneficios"
            title="Qué gana tu oficina"
            titleVariant="display"
          />
          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {redaliaBenefits.map((item) => (
              <li key={item.title} className="rounded-2xl border border-brand-navy/10 bg-white p-6">
                <h3 className="font-display text-lg font-bold text-brand-navy">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            align="center"
            eyebrow="Referencia"
            title="Planes en UF"
            description="A título informativo. Al registrarte con REDALIA20 aplica 20% el primer trimestre."
            titleVariant="display"
          />
          <div className="mx-auto mt-8 max-w-3xl overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-navy/15 text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 font-semibold">Plan</th>
                  <th className="py-2 font-semibold">UF / mes</th>
                  <th className="py-2 font-semibold">Cupo</th>
                  <th className="py-2 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {membershipPlans.map((plan) => (
                  <tr key={plan.key} className="border-b border-brand-navy/10">
                    <td className="py-3 font-semibold text-brand-navy">
                      {plan.name}
                      {plan.featured ? " · popular" : ""}
                    </td>
                    <td className="py-3">{formatMembershipUf(plan.priceUf)}</td>
                    <td className="py-3 text-muted">
                      {plan.users === 1 ? "1 usuario" : `${plan.users} usuarios`} · {plan.properties} prop.
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`${membershipJoinHref(plan)}&from=seminario`}
                        className="text-sm font-semibold text-brand-gold-deep hover:underline"
                      >
                        Elegir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeader
              eyebrow="Registro"
              title="Sumate ahora con 20% de descuento"
              description="Completá el formulario con el código REDALIA20. Coordinamos la activación en días hábiles."
              titleVariant="display"
            />
          </div>
          <div className="card-elevated rounded-2xl border border-brand-navy/10 bg-white p-6 sm:p-8">
            <LeadForm kind="join" submitLabel="Quiero el 20% y sumarme">
              <input type="hidden" name="origen" value="seminario REDALIA20" />
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
              {seminarioPromo.offerFinePrint} También {siteConfig.contact.email}
              {wa ? ` o WhatsApp ${wa.display}` : ""}.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
