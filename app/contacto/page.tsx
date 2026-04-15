import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { Field, LeadForm } from "@/components/forms/LeadForm";
import { siteConfig } from "@/lib/site-config";
import { getWhatsappContact } from "@/lib/public-contact";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contacto comercial Redalia: correo, WhatsApp y formulario para coordinar reunión o presentación.",
};

const confianza = [
  "Respuesta por el canal que indiques, en días hábiles.",
  "Conversación comercial sin compromiso de ingreso hasta alinear expectativas.",
  "Propuesta clara de alcance y próximos pasos después de la primera reunión.",
];

export default function ContactoPage() {
  const wa = getWhatsappContact();

  return (
    <div>
      <PageHero
        variant="navy-gradient"
        eyebrow="Contacto comercial"
        title="Hablemos de encaje comercial y próximos pasos"
        lead="Presentaciones, dudas sobre la red o evaluación con tu corredora. El equipo responde con criterio comercial y transparencia sobre proceso y membresía."
      />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-brand-navy">Por qué conviene escribirnos ahora</h2>
            <ul className="mt-6 space-y-3 text-sm text-muted">
              {confianza.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="mt-0.5 font-semibold text-brand-gold-deep">✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <h2 className="mt-10 text-lg font-semibold text-brand-navy">Canales directos</h2>
            <ul className="mt-4 space-y-4 text-sm text-muted">
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
            <Link
              href="/planes"
              className="mt-8 inline-flex rounded-full border border-brand-navy/20 px-5 py-2.5 text-sm font-semibold text-brand-navy hover:bg-brand-navy-soft"
            >
              Revisar planes antes de escribir
            </Link>
          </div>
          <div className="card-elevated rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-brand-navy">Enviar mensaje</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Contanos brevemente tu corredora, zona y qué te gustaría resolver (presentación, canje, planes). Cuanto más
              concreto el mensaje, más útil será nuestra respuesta.
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
