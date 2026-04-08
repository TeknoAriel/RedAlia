import type { Metadata } from "next";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { CTASection } from "@/components/sections/CTASection";

export const metadata: Metadata = {
  title: "Socios",
  description:
    "Miembros de Redalia forman parte de una red de alto valor: alianzas, circulación de oportunidades y visibilidad comercial.",
};

const placeholderPartners = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  name: "Socio de la red",
  city: "Ciudad",
  type: "Corredora" as const,
}));

export default function SociosPage() {
  return (
    <div className="bg-background">
      <section className="border-b border-brand-navy/10 bg-brand-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">Socios</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            Un ecosistema profesional con estándares compartidos
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/88">
            Los socios de Redalia son parte de una red orientada a oportunidades reales: trabajo
            colaborativo, respaldo comercial y comunidad que suma sin reemplazar tu identidad.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
        <SectionHeader
          title="Qué significa ser socio"
          description="Ser miembro implica acceder a una estructura de alto valor: circulación de oferta, criterios de difusión, espacios de encuentro y seguimiento cercano según tu perfil."
        />
        <div className="prose prose-slate mt-8 max-w-none text-muted">
          <p>
            Las oportunidades circulan con reglas claras y foco comercial. La visibilidad se potencia
            con herramientas y canales alineados a la red. El networking no es un fin en sí mismo: es
            un medio para concretar negocios con profesionales que trabajan en serio.
          </p>
        </div>
      </section>

      <section className="border-y border-brand-navy/10 bg-white py-14 sm:py-18">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            align="center"
            eyebrow="Próximamente fichas"
            title="Red de socios"
            description="Aquí podrás cargar logo, nombre, ciudad, tipo de miembro y una breve descripción. Mientras tanto, mostramos placeholders institucionales sin datos inventados."
          />
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {placeholderPartners.map((p) => (
              <li
                key={p.id}
                className="flex flex-col rounded-2xl border border-brand-navy/10 bg-brand-navy-soft/35 p-6 text-center"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-brand-navy/15 bg-white text-xs font-semibold text-brand-navy/50">
                  Logo
                </div>
                <h3 className="mt-4 text-lg font-semibold text-brand-navy">{p.name}</h3>
                <p className="text-sm text-muted">{p.city}</p>
                <span className="mt-2 inline-flex justify-center rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-navy ring-1 ring-brand-navy/10">
                  {p.type}
                </span>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  Espacio reservado para una breve descripción del socio cuando dispongas del contenido.
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
        <CTASection
          title="¿Te interesa sumarte como socio?"
          description="Conversemos sobre tu corredora o tu operación y cómo encaja en la red."
          primaryHref="/unete"
          primaryLabel="Completar postulación"
          secondaryHref="/contacto"
          secondaryLabel="Contacto directo"
        />
      </section>
    </div>
  );
}
