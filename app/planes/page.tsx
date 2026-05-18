import type { Metadata } from "next";
import Link from "next/link";
import { SectionLogoMark } from "@/components/brand/SectionLogoMark";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { CTASection } from "@/components/sections/CTASection";

export const metadata: Metadata = {
  title: "Membresía",
  description:
    "Planes de membresía Redalia: presencia institucional, visibilidad y colaboración entre corredoras en Chile. Propuesta comercial clara en reunión —sin precios genéricos en web.",
};

const plans = [
  {
    key: "base",
    name: "Plan Base",
    pitch:
      "Para corredoras que quieren integrarse a la red, tener presencia institucional y participar del ecosistema colaborativo.",
    bullets: [
      "Presencia en la red",
      "Acceso al ecosistema Redalia",
      "Visibilidad institucional",
      "Participación en oportunidades colaborativas",
    ],
    profile: "Equipos que validan la membresía y buscan marco claro sin sobredimensionar alcance al inicio.",
  },
  {
    key: "profesional",
    name: "Plan Profesional",
    pitch:
      "Para corredoras que buscan mayor visibilidad, publicación de propiedades y acceso más activo a oportunidades de colaboración.",
    bullets: [
      "Mayor visibilidad",
      "Publicación de propiedades",
      "Participación activa en catálogo",
      "Acceso a herramientas de colaboración",
    ],
    featured: true,
    profile: "Corredoras con operación establecida que quieren intensificar difusión y colaboración entre socios.",
  },
  {
    key: "redEmpresa",
    name: "Plan Red / Empresa",
    pitch:
      "Para equipos, oficinas o grupos inmobiliarios que necesitan mayor alcance, soporte y presencia dentro de la red.",
    bullets: [
      "Mayor alcance institucional",
      "Gestión para equipos",
      "Presencia destacada",
      "Acompañamiento comercial",
    ],
    profile: "Organizaciones multi-sede o con varias marcas que requieren coordinación y alcance acorde.",
  },
];

/** Comparación cualitativa (sin precios). */
const comparisonRows: { label: string; base: boolean; profesional: boolean; redEmpresa: boolean }[] = [
  {
    label: "Participación en canje y colaboración entre socios",
    base: true,
    profesional: true,
    redEmpresa: true,
  },
  { label: "Visibilidad de marca en la comunidad", base: true, profesional: true, redEmpresa: true },
  { label: "Capacitación y alineación con estándares de la red", base: true, profesional: true, redEmpresa: true },
  { label: "Soporte en incorporación y expectativas comerciales", base: true, profesional: true, redEmpresa: true },
  {
    label: "Intensidad de difusión y uso activo del catálogo",
    base: false,
    profesional: true,
    redEmpresa: true,
  },
  { label: "Revisión periódica de objetivos con el equipo Redalia", base: false, profesional: true, redEmpresa: true },
  {
    label: "Diseño territorial / multi-equipo / mayor alcance institucional",
    base: false,
    profesional: false,
    redEmpresa: true,
  },
  {
    label: "Interlocución y plan comercial acorde a estructura grande",
    base: false,
    profesional: false,
    redEmpresa: true,
  },
];

const pasos = [
  { title: "Conversación inicial", text: "Entendemos tu operación, zona y objetivos comerciales." },
  { title: "Propuesta acotada", text: "Alcance, nivel sugerido y condiciones sin cifras genéricas en el aire." },
  { title: "Incorporación", text: "Alineación de publicaciones, accesos y formación de ingreso a la comunidad." },
  { title: "Operación continua", text: "Colaboración entre socios, canje y capacitación según tu plan." },
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
    <div className="bg-background">
      <PageHero
        variant="light"
        prepend={<SectionLogoMark size="sm" className="mb-5" />}
        eyebrow="Membresía"
        title="Planes de membresía Redalia"
        lead="Elige la modalidad que mejor se adapte a tu corredora y comienza a participar de una red colaborativa con visibilidad, catálogo, tecnología y oportunidades reales de negocio. Montos y alcance finos se definen en reunión —sin cifras genéricas en la web."
        footnote="La membresía es una relación comercial de largo plazo, con incorporación conversada y estándares compartidos."
        contentClassName="py-20 sm:py-24"
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeader
          eyebrow="Niveles"
          title="Eliges el punto de partida; afinamos en conjunto"
          description="La comparación resume enfoques típicos. El contrato y los beneficios concretos —cierres, canje y acompañamiento— se ajustan a tu corredora en la propuesta comercial."
          titleVariant="display"
        />
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`flex flex-col rounded-2xl border p-8 ${
                plan.featured
                  ? "border-brand-gold/50 bg-white shadow-lg ring-1 ring-brand-gold/25"
                  : "border-brand-navy/10 bg-white shadow-sm"
              }`}
            >
              {plan.featured && (
                <span className="mb-3 inline-flex w-fit rounded-full bg-brand-navy px-3 py-1 text-xs font-semibold text-white">
                  Referencia habitual para equipos en crecimiento
                </span>
              )}
              <h2 className="font-display text-xl font-bold text-brand-navy">{plan.name}</h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{plan.pitch}</p>
              <p className="mt-4 rounded-lg bg-brand-navy-soft/60 px-3 py-2 text-xs leading-relaxed text-brand-navy/90">
                <strong className="font-semibold text-brand-navy">Encaja si:</strong> {plan.profile}
              </p>
              <p className="mt-6 font-display text-lg font-semibold text-brand-navy">Cotización comercial</p>
              <p className="text-sm text-muted">Se define en asesoría, según alcance y territorio acordados.</p>
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
                className={`mt-8 inline-flex w-full justify-center text-center text-sm font-semibold transition ${
                  plan.featured
                    ? "btn-redalia-gold-solid px-8 py-3.5"
                    : "rounded-full border border-brand-navy/25 bg-white px-8 py-3.5 text-brand-navy shadow-sm hover:border-brand-gold/35 hover:bg-brand-navy-soft/50"
                }`}
              >
                Consultar plan
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link href="/contacto" className="btn-redalia-outline-on-light px-10 py-3.5 text-center text-sm font-semibold">
            Hablar con Redalia
          </Link>
        </div>
      </section>

      <section className="border-y border-brand-navy/10 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Comparación"
            title="Qué distingue cada nivel"
            description="Referencia cualitativa. La propuesta final puede combinar elementos según tu operación y lo que acordemos en la reunión inicial."
            titleVariant="display"
          />
          <div className="mt-10 overflow-x-auto rounded-2xl border border-brand-navy/10 shadow-sm">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-brand-navy text-white">
                  <th className="border-b border-white/15 px-4 py-3.5 font-semibold">Criterio</th>
                  <th className="border-b border-white/15 px-3 py-3.5 text-center font-semibold">Plan Base</th>
                  <th className="border-b border-white/15 px-3 py-3.5 text-center font-semibold">Plan Profesional</th>
                  <th className="border-b border-white/15 px-3 py-3.5 text-center font-semibold">Plan Red / Empresa</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.label} className="bg-white">
                    <th className="border-b border-brand-navy/10 px-4 py-3 font-normal text-brand-navy/90">
                      {row.label}
                    </th>
                    <Cell ok={row.base} />
                    <Cell ok={row.profesional} />
                    <Cell ok={row.redEmpresa} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            el proceso de ingreso conversado y en resultados que se puedan sostener en el tiempo.
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
          title="¿Quieres la propuesta escrita para tu corredora?"
          description="En una reunión breve dejamos fijo alcance, nivel sugerido y próximos pasos —con transparencia comercial y el mismo tono institucional que en el resto de la red."
          primaryHref="/unete"
          primaryLabel="Postular como socio"
          secondaryHref="/colaboracion"
          secondaryLabel="Canje y colaboración"
          footnote="Si ya tienes claro el nivel, igual conviene una conversación para validar encaje territorial y de operación."
        />
      </section>
    </div>
  );
}
