type Props = {
  amenities: { key: string; label: string; icon: string | null }[];
};

/** Lista de amenities públicas (`amenities_resolved`) en la ficha. */
export function PropertyAmenities({ amenities }: Props) {
  if (!amenities.length) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-brand-navy">Servicios y características</h2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {amenities.map((a) => (
          <li
            key={a.key}
            className="flex items-start gap-2 rounded-xl border border-brand-navy/10 bg-white px-3 py-2.5 text-sm text-brand-navy/90"
          >
            <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" aria-hidden />
            <span>{a.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
