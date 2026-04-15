const pillars = [
  {
    title: "Criterios de participación",
    text: "El ingreso se conversa con el equipo: perfil comercial, zona y compromiso con los estándares de la red.",
  },
  {
    title: "Confidencialidad entre socios",
    text: "La colaboración se apoya en trato profesional y acuerdos claros, no en exposición desordenada de operaciones.",
  },
  {
    title: "Operación revisada",
    text: "Acompañamiento en la incorporación y seguimiento comercial para que la red siga siendo un espacio serio.",
  },
  {
    title: "Preparado para crecer",
    text: "La estructura del sitio está pensada para sumar pronto voces de socios, casos y alianzas cuando estén disponibles.",
  },
];

/**
 * Bloque de autoridad cuando aún no hay testimonios ni logos verificables en `lib/site-evidence.ts`.
 */
export function AuthorityInstitutionalBlock() {
  return (
    <div className="rounded-2xl border border-brand-navy/12 bg-white p-8 shadow-sm sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-deep">Institucional</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">
        Cómo construimos confianza
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        Redalia apuesta por hechos y criterios comerciales antes que por slogans. Estos pilares guían la relación con
        socios y prospectos.
      </p>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2">
        {pillars.map((p) => (
          <li
            key={p.title}
            className="card-elevated rounded-xl border border-brand-navy/8 bg-brand-navy-soft/35 px-5 py-5"
          >
            <h3 className="text-sm font-semibold text-brand-navy">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
