import Link from "next/link";
import {
  formatMembershipUf,
  membershipAddons,
  membershipIncludedFeatures,
  membershipJoinHref,
  membershipPlans,
  membershipValueProps,
  type MembershipPlan,
} from "@/lib/membership-plans";

function userLabel(n: number): string {
  return n === 1 ? "1 usuario" : `${n} usuarios`;
}

function propertyLabel(n: number): string {
  return `${n} propiedades`;
}

function PlanCard({ plan }: { plan: MembershipPlan }) {
  return (
    <article
      className={`relative flex h-full flex-col rounded-2xl border bg-white p-6 sm:p-7 ${
        plan.featured
          ? "border-brand-gold/70 shadow-lg ring-2 ring-brand-gold/35"
          : "border-brand-navy/10 shadow-sm ring-1 ring-brand-navy/[0.04]"
      }`}
    >
      {plan.featured && (
        <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-brand-gold px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-navy shadow-sm">
          <span aria-hidden>★</span> Más popular
        </span>
      )}
      <h3 className="font-display text-lg font-bold uppercase tracking-wide text-brand-navy sm:text-xl">
        {plan.name}
      </h3>
      <p className="mt-3 font-display text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
        {formatMembershipUf(plan.priceUf)}
        <span className="ml-1 text-sm font-sans font-medium text-muted">/ mes</span>
      </p>
      <p className="mt-3 text-sm font-semibold text-brand-navy">
        {userLabel(plan.users)} · {propertyLabel(plan.properties)}
      </p>

      <div className="mt-5 rounded-xl bg-brand-navy-soft/70 px-3 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-navy/70">
          Precio con compromiso
        </p>
        <dl className="mt-2 space-y-1 text-sm text-brand-navy">
          <div className="flex justify-between gap-3">
            <dt>3 meses</dt>
            <dd className="font-semibold">{formatMembershipUf(plan.commitment.months3)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>6 meses</dt>
            <dd className="font-semibold">{formatMembershipUf(plan.commitment.months6)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>12 meses</dt>
            <dd className="font-semibold">{formatMembershipUf(plan.commitment.months12)}</dd>
          </div>
        </dl>
      </div>

      <ul className="mt-5 flex-1 space-y-2 text-sm text-brand-navy/90">
        {membershipIncludedFeatures.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-brand-gold" aria-hidden>
              ✓
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Puedes probar gratis 7 días
      </p>
      <Link
        href={membershipJoinHref(plan)}
        className={`mt-2 inline-flex w-full justify-center text-center text-sm font-semibold ${
          plan.featured
            ? "btn-redalia-gold-solid px-4 py-3"
            : "rounded-full bg-brand-navy px-4 py-3 text-white shadow-sm transition hover:bg-brand-navy-mid"
        }`}
      >
        Prueba gratis {plan.name}
      </Link>
    </article>
  );
}

export function MembershipPricingGrid() {
  return (
    <div>
      <div className="grid gap-8 pt-4 md:grid-cols-2 xl:grid-cols-4">
        {membershipPlans.map((plan) => (
          <PlanCard key={plan.key} plan={plan} />
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-muted">
        Add-ons: {membershipAddons.map((a) => `${a.label} ${formatMembershipUf(a.priceUf)}`).join(" · ")}{" "}
        al mes.
      </p>
    </div>
  );
}

export function MembershipValueBar() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {membershipValueProps.map((item) => (
        <div key={item.title} className="text-center sm:text-left">
          <p className="font-display text-sm font-semibold text-white">{item.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/75">{item.text}</p>
        </div>
      ))}
    </div>
  );
}
