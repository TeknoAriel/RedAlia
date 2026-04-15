import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { Field, LeadForm } from "@/components/forms/LeadForm";

export const metadata: Metadata = {
  title: "Únete",
  description:
    "Postulá a formar parte de Redalia: red colaborativa inmobiliaria en Chile, con foco en canje, visibilidad y acompañamiento profesional.",
};

const despues = [
  "Revisamos tu postulación y, si hay encaje, te contactamos por correo o teléfono en días hábiles.",
  "Coordinamos una conversación para conocer tu operación y responder dudas sobre colaboración, planes y proceso.",
  "Si ambas partes avanzan, te guiamos en la incorporación: alineación comercial, accesos y próximos pasos concretos.",
];

const incentivos = [
  "Evaluación seria de encaje: la red crece con socios alineados, no con altas masivas.",
  "Acceso a colaboración y canje bajo el marco que acordemos en tu plan.",
  "Visibilidad y formación acorde al nivel de membresía que corresponda a tu operación.",
];

export default function UnetePage() {
  return (
    <div>
      <PageHero
        variant="navy-solid"
        eyebrow="Incorporación"
        title="Postulá a una red que prioriza el negocio compartido"
        lead="Si sos corredor o parte de una corredora y buscás más circulación de oportunidades, visibilidad entre profesionales y un marco serio para colaborar, este es el punto de partida."
      >
        <Link
          href="/contacto"
          className="inline-flex text-sm font-semibold text-brand-gold underline-offset-2 hover:underline"
        >
          Preferís hablar antes de completar el formulario → Contacto
        </Link>
      </PageHero>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeader
              title="Por qué vale la pena completar la postulación"
              description="Es el camino más rápido para que el equipo evalúe encaje territorial, perfil comercial y expectativas —y te devuelva una respuesta fundamentada."
              titleVariant="display"
            />
            <ul className="mt-6 space-y-3 text-sm text-muted">
              {incentivos.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="font-semibold text-brand-gold-deep">✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <h2 className="mt-10 text-lg font-semibold text-brand-navy">A quién está dirigido</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Agentes inmobiliarios independientes, equipos de venta y corredoras que quieren escalar resultados con una
              estructura común y estándares compartidos.
            </p>
            <h2 className="mt-10 text-lg font-semibold text-brand-navy">Qué sucede después de enviar</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
              {despues.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </div>
          <div className="card-elevated rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-brand-navy">Formulario de postulación</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Los datos nos permiten preparar la primera conversación con información. Incluí ciudad, tipo de operación y,
              si podés, volumen aproximado de equipo.
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
                <Field label="Mensaje" name="mensaje" rows={4} />
              </LeadForm>
            </div>
            <p className="mt-4 text-xs text-muted">
              Si necesitás urgencia o tema sensible, complementá con un correo directo desde la página de{" "}
              <Link href="/contacto" className="font-medium text-brand-gold-deep underline-offset-2 hover:underline">
                contacto
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
