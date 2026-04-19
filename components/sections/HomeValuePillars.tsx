import { SectionHeader } from "@/components/sections/SectionHeader";
import { SectionLogoMark } from "@/components/brand/SectionLogoMark";

type Pillar = { title: string; text: string };

type Props = {
  pillars: readonly Pillar[];
};

export function HomeValuePillars({ pillars }: Props) {
  return (
    <section className="border-b border-brand-navy/10 bg-gradient-to-b from-brand-navy-soft via-white to-white py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionLogoMark size="sm" className="mb-5" />
        <SectionHeader
          align="center"
          eyebrow="Por qué somos distintos"
          title="Una comunidad profesional, orientada a cierres"
          description="Publicar es solo una parte del valor: el corazón está en el negocio compartido, el apoyo entre pares y los resultados concretos en el mercado chileno."
          titleVariant="display"
        />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {pillars.map((t, index) => (
            <li
              key={t.title}
              className="card-elevated relative rounded-2xl border border-brand-navy/10 border-l-[3px] border-l-brand-gold bg-white py-6 pl-5 pr-4 shadow-sm sm:py-7 sm:pl-6 sm:pr-5"
            >
              <span
                className="font-display text-xl font-bold tabular-nums text-brand-gold-deep/90"
                aria-hidden
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-base font-semibold leading-snug text-brand-navy">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
