import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { CTASection } from "@/components/sections/CTASection";

export const metadata: Metadata = {
  title: "Planes",
  description:
    "Membresía Redalia: niveles de participación para corredoras y agentes. Propuesta comercial clara sin precios genéricos en web.",
};

const plans = [
  {
    key: "inicial",
    name: "Plan inicial",
    pitch: "Presencia en la red y circulación básica de oportunidades para equipos que validan el modelo.",
    bullets: [
      "Participación en flujos de colaboración definidos",
      "Visibilidad acorde al nivel dentro del ecosistema de socios",
      "Acompañamiento en la incorporación y alineación de expectativas",
    ],
    cta: "Consultar",
    profile: "Equipos en crecimiento o que recién estructuran canje con terceros.",
  },
  {
    key: "profesional",
    name: "Plan profesional",
    pitch: "Mayor exposición, más coordinación comercial y soporte reforzado para escalar canje y cierres.",
    bullets: [
      "Mayor exposición y prioridad en flujos de difusión acordados",
      "Herramientas y criterios ampliados para publicaciones y seguimiento",
      "Soporte comercial más cercano y revisión de objetivos",
    ],
    cta: "Solicitar propuesta",
    featured: true,
    profile: "Corredoras con operación establecida que buscan intensificar colaboración y resultados.",
  },
  {
    key: "corporativo",
    name: "Plan corporativo",
    pitch: "Diseño a medida para varias sucursales o marcas con coordinación central y territorios definidos.",
    bullets: [
      "Arquitectura según perfil, territorio y número de oficinas o marcas",
      "Coordinación con responsables por zona o unidad de negocio",
      "Contrato y plan comercial acotados a tu realidad",
    ],
    cta: "Coordinar reunión",
    profile: "Organizaciones multi-sede o con cobertura nacional segmentada.",
  },
];

/** Filas comparativas cualitativas (sin precios). true = incluido / reforzado en ese nivel. */
const comparisonRows: { label: string; inicial: boolean; profesional: boolean; corporativo: boolean }[] = [
  { label: "Participación en canje y colaboración entre socios", inicial: true, profesional: true, corporativo: true },
  { label: "Visibilidad de marca dentro de la red", inicial: true, profesional: true, corporativo: true },
  { label: "Capacitación continua", inicial: true, profesional: true, corporativo: true },
  { label: "Soporte comercial en incorporación", inicial: true, profesional: true, corporativo: true },
  { label: "Intensidad de difusión y prioridad en flujos", inicial: false, profesional: true, corporativo: true },
  { label: "Revisión periódica de objetivos con el equipo", inicial: false, profesional: true, corporativo: true },
  { label: "Diseño territorial / multi-marca / multi-sede", inicial: false, profesional: false, corporativo: true },
  { label: "Interlocución dedicada por estructura grande", inicial: false, profesional: false, corporativo: true },
];

const pasos = [
  { title: "1. Conversación inicial", text: "Entendemos tu operación, zona y objetivos comerciales." },
  { title: "2. Propuesta acotada", text: "Alcance, nivel sugerido y condiciones sin cifras genéricas en el aire." },
  { title: "3. Incorporación", text: "Alineación de publicaciones, accesos y formación de ingreso a la red." },
  { title: "4. Operación continua", text: "Colaboración entre socios, canje y capacitación según tu plan." },
];

function Cell({ ok }: { ok: boolean }) {
  return (
    <td className="border-b border-brand-navy/10 px-3 py-3 text-center text-sm">
      {ok ? (
        <span className="font-semibold text-brand-gold-deep" aria-label="Incluido">
          ✓
        </span>
      ) : (
        <span className="text-muted/50">—</span>
      )}
    </td>
  );
}

export default function PlanesPage() {
  return (
    <div>
      <PageHero
        variant="light"
        eyebrow="Planes"
        title="Membresía con lógica comercial clara"
        lead="Tres niveles de referencia para orientar la conversación. Montos y alcance finos se definen en reunión, según perfil y territorio —sin precios genéricos publicados acá."
      />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          title="Elegí el punto de partida; afinamos en conjunto"
          description="La tabla resume enfoques típicos. El contrato y los beneficios reales se ajustan a tu corredora en la propuesta comercial."
          titleVariant="display"
        />
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-2xl border p-8 ${
                plan.featured
                  ? "border-brand-gold/50 bg-white shadow-lg ring-1 ring-brand-gold/25"
                  : "border-brand-navy/10 bg-white shadow-sm"
              }`}
            >
              {plan.featured && (
                <span className="mb-3 inline-flex w-fit rounded-full bg-brand-navy px-3 py-1 text-xs font-semibold text-white">
                  Mayor demanda en equipos en crecimiento
                </span>
              )}
              <h2 className="text-xl font-bold text-brand-navy">{plan.name}</h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{plan.pitch}</p>
              <p className="mt-4 rounded-lg bg-brand-navy-soft/60 px-3 py-2 text-xs leading-relaxed text-brand-navy/90">
                <strong className="font-semibold text-brand-navy">Ideal si:</strong> {plan.profile}
              </p>
              <p className="mt-6 text-xl font-semibold text-brand-navy">Inversión</p>
              <p className="text-sm text-muted">A cotizar en asesoría, según alcance acordado.</p>
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

      <section className="border-y border-brand-navy/10 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Comparación entre niveles"
            description="Referencia cualitativa. La propuesta final puede combinar elementos según tu operación."
          />
          <div className="mt-8 overflow-x-auto rounded-2xl border border-brand-navy/10 shadow-sm">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-brand-navy-soft/80">
                  <th className="border-b border-brand-navy/10 px-4 py-3 font-semibold text-brand-navy">Criterio</th>
                  <th className="border-b border-brand-navy/10 px-3 py-3 text-center font-semibold text-brand-navy">
                    Inicial
                  </th>
                  <th className="border-b border-brand-navy/10 px-3 py-3 text-center font-semibold text-brand-navy">
                    Profesional
                  </th>
                  <th className="border-b border-brand-navy/10 px-3 py-3 text-center font-semibold text-brand-navy">
                    Corporativo
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.label} className="bg-white">
                    <th className="border-b border-brand-navy/10 px-4 py-3 font-normal text-brand-navy/90">
                      {row.label}
                    </th>
                    <Cell ok={row.inicial} />
                    <Cell ok={row.profesional} />
                    <Cell ok={row.corporativo} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="card-elevated rounded-2xl border border-brand-navy/10 bg-brand-navy-soft/40 p-8 sm:p-10">
          <h2 className="text-xl font-bold text-brand-navy">Una alternativa moderna, sin copiar modelos del pasado</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Redalia se plantea como red colaborativa actual: orden, transparencia entre socios, tecnología como soporte
            y foco en que cada corredora siga controlando su marca. No competimos en eslóganos históricos: competimos en
            claridad comercial, proceso de ingreso y valor tangible para quien ejecuta en Chile hoy.
          </p>
        </div>
      </section>

      <section className="border-y border-brand-navy/10 bg-brand-navy-soft/50 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Proceso de ingreso a la membresía"
            description="Transparencia en las etapas para que tomes la decisión con información, no con presión."
          />
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pasos.map((s) => (
              <li key={s.title} className="card-elevated rounded-2xl border border-brand-navy/10 bg-white p-5">
                <p className="text-sm font-semibold text-brand-navy">{s.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <CTASection
          title="¿Querés la propuesta escrita para tu corredora?"
          description="En una reunión breve dejamos fijo alcance, nivel sugerido y próximos pasos —con transparencia comercial."
          primaryHref="/contacto"
          primaryLabel="Pedir reunión con comercial"
          secondaryHref="/unete"
          secondaryLabel="Ir a postulación"
          tertiaryHref="/colaboracion"
          tertiaryLabel="Releer colaboración y canje"
          footnote="Si ya tenés claro el nivel, igual conviene una conversación para validar encaje territorial y de operación."
        />
      </section>
    </div>
  );
}
