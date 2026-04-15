import Link from "next/link";

const outcomes = [
  {
    title: "Más stock para ofrecer",
    text: "Tu equipo accede a propiedades de otros socios bajo reglas de canje y presentación, sin depender solo de cartera propia.",
  },
  {
    title: "Más ejecutivos moviendo tu oferta",
    text: "Corredores calificados pueden llevar tus publicaciones a sus clientes, con coordinación y trazabilidad.",
  },
  {
    title: "Pipeline más ordenado",
    text: "Menos idas y vueltas informales: criterios compartidos para seguimiento, visitas y priorización de oportunidades.",
  },
  {
    title: "Marca intacta, red fuerte",
    text: "Seguís siendo vos frente al cliente; la red suma canales y respaldo sin reemplazar tu identidad comercial.",
  },
];

/**
 * Valor tangible para corredoras — no es networking genérico.
 */
export function TangibleValueForBrokers() {
  return (
    <section className="border-y border-brand-navy/10 bg-brand-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">Para tu corredora</p>
        <h2 className="mt-3 max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
          Qué cambia en el día a día cuando entrás a Redalia
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
          No es un club de contactos: es una estructura para compartir negocio con otros profesionales, con marco
          comercial y foco en cierres.
        </p>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {outcomes.map((o) => (
            <li
              key={o.title}
              className="rounded-2xl border border-white/15 bg-white/[0.06] px-6 py-6 backdrop-blur-sm"
            >
              <div className="mb-3 h-1 w-10 rounded-full bg-brand-gold" />
              <h3 className="text-lg font-semibold text-white">{o.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">{o.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/colaboracion"
            className="inline-flex rounded-full bg-brand-gold px-5 py-2.5 text-sm font-semibold text-brand-navy transition hover:bg-[#d4b82e]"
          >
            Cómo funciona el canje
          </Link>
          <Link
            href="/planes"
            className="inline-flex rounded-full border border-white/35 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Ver niveles de membresía
          </Link>
        </div>
      </div>
    </section>
  );
}
