import { publicTestimonials } from "@/lib/site-evidence";
import { AuthorityInstitutionalBlock } from "@/components/sections/AuthorityInstitutionalBlock";

export function EvidenceSection() {
  if (publicTestimonials.length === 0) {
    return <AuthorityInstitutionalBlock />;
  }

  return (
    <div className="rounded-2xl border border-brand-navy/12 bg-white p-8 shadow-sm sm:p-10">
      <p className="redalia-eyebrow redalia-eyebrow--onLight">Socios</p>
      <h2 className="font-display mt-2 text-2xl font-bold leading-tight tracking-tight text-brand-navy sm:text-[1.75rem] lg:text-[2rem]">
        Lo que dicen quienes operan en la comunidad
      </h2>
      <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {publicTestimonials.map((t, i) => (
          <li key={i} className="card-elevated flex flex-col rounded-xl border border-brand-navy/10 bg-brand-navy-soft/30 p-6">
            <blockquote className="text-sm leading-relaxed text-brand-navy/90">&ldquo;{t.quote}&rdquo;</blockquote>
            <footer className="mt-4 border-t border-brand-navy/10 pt-4 text-sm">
              <p className="font-semibold text-brand-navy">{t.author}</p>
              <p className="text-muted">{t.role}</p>
            </footer>
          </li>
        ))}
      </ul>
    </div>
  );
}
