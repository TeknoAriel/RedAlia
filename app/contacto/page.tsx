import type { Metadata } from "next";
import Link from "next/link";
import { SectionLogoMark } from "@/components/brand/SectionLogoMark";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { Field, LeadForm } from "@/components/forms/LeadForm";
import { siteConfig } from "@/lib/site-config";
import { getWhatsappContact } from "@/lib/public-contact";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contacto Redalia: correo, WhatsApp y formulario para coordinar reunión inicial o presentación.",
};

const confianza = [
  "Respuesta por el canal que indiques, en días hábiles y con tono profesional.",
  "Conversación comercial sin compromiso de ingreso hasta alinear expectativas y encaje.",
  "Propuesta clara de alcance y próximos pasos después de la primera reunión, sin cifras genéricas en el aire.",
];

export default function ContactoPage() {
  const wa = getWhatsappContact();

  return (
    <div className="bg-background">
      <PageHero
        variant="navy-gradient"
        prepend={<SectionLogoMark size="sm" className="mb-5 opacity-95" />}
        eyebrow="Contacto"
        title="Coordinemos una reunión inicial"
        lead="Presentaciones, consultas sobre Redalia o evaluación junto a tu corredora. El equipo responde con criterio comercial y transparencia sobre proceso, membresía y comunidad."
        footnote="Si preferís un primer contacto breve, usá el formulario o los canales de la izquierda; tratamos cada caso con la misma seriedad."
        contentClassName="py-20 sm:py-24"
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
          <div className="lg:border-r lg:border-brand-navy/10 lg:pr-12">
            <SectionHeader
              eyebrow="Confianza"
              title="Por qué conviene escribirnos ahora"
              description="Trabajamos con corredoras y agentes que buscan claridad, no promesas vacías. Este contacto es el canal natural para avanzar con rigor."
              titleVariant="display"
            />
            <ul className="mt-8 space-y-4 text-sm leading-relaxed text-muted">
              {confianza.map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-brand-gold-deep">✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <h2 className="redalia-h2-section mt-12">Canales directos</h2>
            <ul className="mt-5 space-y-5 text-sm leading-relaxed text-muted">
              <li>
                <span className="font-medium text-brand-navy">Correo</span>
                <br />
                <a href={`mailto:${siteConfig.contact.email}`} className="text-brand-gold-deep hover:underline">
                  {siteConfig.contact.email}
                </a>
              </li>
              {wa ? (
                <li>
                  <span className="font-medium text-brand-navy">WhatsApp</span>
                  <br />
                  <a
                    href={wa.href}
                    className="text-brand-gold-deep hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {wa.display}
                  </a>
                </li>
              ) : (
                <li className="text-muted">
                  <span className="font-medium text-brand-navy">WhatsApp</span>
                  <br />
                  Escribinos por correo; si publicamos un número, también figurará en esta página.
                </li>
              )}
              <li>
                <span className="font-medium text-brand-navy">Horario</span>
                <br />
                {siteConfig.contact.schedule}
              </li>
            </ul>
            <Link href="/planes" className="btn-redalia-outline-on-light mt-10 inline-flex">
              Ver membresía
            </Link>
          </div>
          <div className="card-elevated rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-sm ring-1 ring-brand-navy/[0.04] sm:p-8">
            <p className="redalia-eyebrow redalia-eyebrow--muted !mb-0">Consulta</p>
            <h2 className="redalia-h2-section mt-2">Enviar mensaje</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Contanos tu corredora, zona y qué querés resolver: presentación, canje o membresía. A mayor concreción,
              más útil será nuestra respuesta en el mismo tono institucional con el que opera la comunidad.
            </p>
            <div className="mt-6">
              <LeadForm kind="contact" submitLabel="Enviar consulta">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nombre" name="nombre" required />
                  <Field label="Apellido" name="apellido" required />
                </div>
                <Field label="Empresa o corredora" name="empresa" />
                <Field label="Email" name="email" type="email" required />
                <Field label="Teléfono" name="telefono" type="tel" />
                <Field label="Mensaje" name="mensaje" rows={5} required />
              </LeadForm>
            </div>
            <p className="mt-4 text-xs text-muted">
              Al enviar, aceptás que usemos estos datos solo para contactarte en relación con Redalia.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
