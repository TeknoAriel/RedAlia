import type { Metadata } from "next";
import Link from "next/link";
import { Field, LeadForm } from "@/components/forms/LeadForm";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contacto comercial Redalia: email, WhatsApp y formulario para coordinar reunión o presentación.",
};

export default function ContactoPage() {
  return (
    <div>
      <section className="border-b border-brand-navy/10 bg-gradient-to-br from-brand-navy via-brand-navy-mid to-brand-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            Hablemos de tu próximo paso en la red
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/88">
            Canal directo para coordinar una presentación, resolver dudas o evaluar encaje con tu
            operación. Respuesta con criterio comercial, sin promesas vacías.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-brand-navy">Datos de contacto</h2>
            <ul className="mt-6 space-y-4 text-sm text-muted">
              <li>
                <span className="font-medium text-brand-navy">Email</span>
                <br />
                <a href={`mailto:${siteConfig.contact.email}`} className="text-brand-gold-deep hover:underline">
                  {siteConfig.contact.email}
                </a>
              </li>
              <li>
                <span className="font-medium text-brand-navy">WhatsApp</span>
                <br />
                <a href={siteConfig.contact.whatsappHref} className="text-brand-gold-deep hover:underline">
                  {siteConfig.contact.whatsappDisplay}
                </a>
                <span className="block text-xs text-muted/90">Número de ejemplo — reemplazar al publicar.</span>
              </li>
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
              Ver planes y niveles
            </Link>
          </div>
          <div className="rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-brand-navy">Enviar mensaje</h2>
            <p className="mt-2 text-sm text-muted">
              Los envíos pasan por <code className="rounded bg-brand-navy-soft px-1 text-xs">/api/leads</code>.
              En Vercel configurá <code className="rounded bg-brand-navy-soft px-1 text-xs">LEADS_WEBHOOK_URL</code>{" "}
              o credenciales KiteProp según{" "}
              <a
                href="https://www.kiteprop.com/docs/api/v1"
                className="font-medium text-brand-gold-deep underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                la documentación oficial
              </a>
              .
            </p>
            <div className="mt-6">
              <LeadForm kind="contact" submitLabel="Enviar consulta">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nombre" name="nombre" required />
                  <Field label="Apellido" name="apellido" required />
                </div>
                <Field label="Empresa" name="empresa" />
                <Field label="Email" name="email" type="email" required />
                <Field label="Teléfono" name="telefono" type="tel" />
                <Field label="Mensaje" name="mensaje" rows={5} required placeholder="Contanos qué necesitás" />
              </LeadForm>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
