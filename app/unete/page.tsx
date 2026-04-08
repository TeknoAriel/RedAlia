import type { Metadata } from "next";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { Field, LeadForm } from "@/components/forms/LeadForm";

export const metadata: Metadata = {
  title: "Únete",
  description:
    "Postulá a formar parte de Redalia: red de alianzas inmobiliarias con foco en negocios reales y acompañamiento profesional.",
};

export default function UnetePage() {
  return (
    <div>
      <section className="border-b border-brand-navy/10 bg-brand-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">Únete</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            Sumate a una red orientada a oportunidades reales
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/88">
            Si sos corredor o parte de una corredora y buscás más circulación de negocios, visibilidad y
            vínculos con otros profesionales serios, este es el punto de partida.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeader
              title="Por qué unirse"
              description="Redalia ofrece una propuesta que combina cercanía, tecnología y efectividad comercial —sin reemplazar tu marca ni tu criterio."
            />
            <ul className="mt-6 space-y-3 text-sm text-muted">
              <li className="flex gap-2">
                <span className="text-brand-gold">•</span>
                Más exposición ordenada de tu oferta y acceso a flujos de la red.
              </li>
              <li className="flex gap-2">
                <span className="text-brand-gold">•</span>
                Networking con foco en negocio: menos ruido, más conversaciones útiles.
              </li>
              <li className="flex gap-2">
                <span className="text-brand-gold">•</span>
                Proceso de incorporación claro, con acompañamiento según tu perfil.
              </li>
            </ul>
            <h2 className="mt-10 text-lg font-semibold text-brand-navy">A quién está dirigido</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Agentes inmobiliarios independientes, equipos de venta y corredoras que quieren escalar
              resultados con una estructura común y estándares compartidos.
            </p>
          </div>
          <div className="rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-brand-navy">Postulación</h2>
            <p className="mt-2 text-sm text-muted">
              Completá el formulario. Más adelante podrás enlazar envíos con e-mail, CRM o API de
              KiteProp según tu stack.
            </p>
            <div className="mt-6">
              <LeadForm kind="join" submitLabel="Enviar postulación">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nombre" name="nombre" required />
                  <Field label="Apellido" name="apellido" required />
                </div>
                <Field label="Empresa o corredora" name="empresa" required />
                <Field label="Cargo o rol" name="cargo" />
                <Field label="Ciudad" name="ciudad" required />
                <Field label="Email" name="email" type="email" required />
                <Field label="Teléfono" name="telefono" type="tel" required />
                <Field label="Mensaje" name="mensaje" rows={4} placeholder="Contanos tu interés y zona de operación" />
              </LeadForm>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
