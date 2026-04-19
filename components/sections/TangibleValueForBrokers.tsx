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
    title: "Marca intacta, honorarios tuyos",
    text: "Seguís siendo vos frente al cliente; la comunidad suma canales y respaldo sin reemplazar tu identidad ni ceder el 100% de tus honorarios.",
  },
];

/**
 * Valor tangible para corredoras — no es networking genérico.
 */
export function TangibleValueForBrokers() {
  return (
    <section className="border-y border-brand-navy/10 bg-brand-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <p className="redalia-eyebrow redalia-eyebrow--onNavy">Negocios reales</p>
        <h2 className="redalia-h2-band mt-2 max-w-3xl">
          Qué cambia en el día a día cuando entrás a Redalia
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
          No es un club de contactos: es una estructura para compartir negocio con otros profesionales, con marco
          comercial, foco en cierres y respeto por el 100% de tus honorarios cuando corresponde.
        </p>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {outcomes.map((o) => (
            <li
              key={o.title}
              className="rounded-2xl border border-white/15 bg-white/[0.06] px-6 py-6 backdrop-blur-sm"
            >
              <div className="redalia-card-accent" />
              <h3 className="text-lg font-semibold text-white">{o.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">{o.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/colaboracion" className="btn-redalia-gold-solid px-5 py-2.5">
            Canje y colaboración
          </Link>
          <Link href="/planes" className="btn-redalia-outline-on-navy px-5 py-2.5">
            Ver membresía
          </Link>
        </div>
      </div>
    </section>
  );
}
