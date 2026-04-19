import Link from "next/link";
import { SectionLogoMark } from "@/components/brand/SectionLogoMark";

type Point = { title: string; text: string };

type Props = {
  points: readonly Point[];
};

export function HomeTechnologyBand({ points }: Props) {
  return (
    <section className="border-b border-brand-navy/10 bg-brand-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <SectionLogoMark size="sm" className="mb-5 opacity-90" />
        <div className="max-w-3xl">
          <p className="redalia-eyebrow redalia-eyebrow--onNavy">Plataforma y apoyo</p>
          <h2 className="font-display mt-2 text-2xl font-bold leading-tight tracking-tight text-white sm:text-[1.75rem] lg:text-[2rem]">
            Tecnología al servicio de la comunidad —sin tono frío
          </h2>
          <p className="mt-3 text-base leading-relaxed text-white/85 sm:text-lg">
            La herramienta trabaja para ordenar difusión, priorizar y acompañar decisiones; el negocio sigue siendo
            humano, entre profesionales que se conocen en la red.
          </p>
        </div>
        <ul className="mt-10 grid gap-6 sm:grid-cols-3">
          {points.map((p) => (
            <li
              key={p.title}
              className="rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-6 backdrop-blur-sm"
            >
              <div className="redalia-card-accent" />
              <h3 className="text-base font-semibold text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">{p.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center text-xs text-white/65 sm:text-sm">
          Integraciones y buscador siguen evolucionando con la operación de socios; si querés profundidad técnica,{" "}
          <Link href="/contacto" className="font-semibold text-brand-gold underline-offset-2 hover:underline">
            coordinamos una conversación
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
