import Link from "next/link";
import { PropertyContactReveal } from "@/components/properties/PropertyContactReveal";
import { scopedPartnerKey } from "@/lib/agencies";
import {
  partnersSamePerson,
  propertyOrgAndAgent,
} from "@/lib/properties/property-org-agent";
import type { PropertyKitepropMessageTarget } from "@/lib/property-kiteprop-dispatch";
import type { NormalizedProperty, PropertyPartner } from "@/types/property";

type Props = {
  property: NormalizedProperty;
  kpDispatch: PropertyKitepropMessageTarget;
  /** Si true, incluye gate de teléfono/WhatsApp (ficha). */
  withContactGate?: boolean;
  className?: string;
};

function Avatar({
  partner,
  size = "md",
}: {
  partner: PropertyPartner & { name: string };
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-9 w-9 text-[10px]" : "h-12 w-12 text-xs";
  if (partner.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={partner.logoUrl}
        alt=""
        className={`${dim} shrink-0 rounded-full border border-brand-navy/10 object-cover`}
      />
    );
  }
  return (
    <div
      className={`flex ${dim} shrink-0 items-center justify-center rounded-full bg-brand-navy-soft font-bold text-brand-navy/50`}
    >
      {partner.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function PartnerRow({
  chip,
  partner,
  scope,
  property,
  kpDispatch,
  withContactGate,
}: {
  chip: string;
  partner: PropertyPartner & { name: string };
  scope: "agency" | "agent";
  property: NormalizedProperty;
  kpDispatch: PropertyKitepropMessageTarget;
  withContactGate: boolean;
}) {
  return (
    <div className="space-y-2">
      <span className="inline-block rounded-full bg-brand-navy-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-navy/80">
        {chip}
      </span>
      <div className="flex items-start gap-3">
        <Avatar partner={partner} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-navy">{partner.name}</p>
          <Link
            href={`/propiedades?socio=${encodeURIComponent(
              scopedPartnerKey(scope, partner.id, partner.name),
            )}`}
            className="mt-1 inline-block text-xs font-semibold text-brand-gold-deep underline-offset-2 hover:underline"
          >
            {scope === "agency" ? "Ver propiedades de esta empresa" : "Ver publicaciones de este agente"}
          </Link>
          {withContactGate ? (
            <PropertyContactReveal
              propertyId={kpDispatch.propertyId}
              propertyCode={property.referenceCode}
              propertyTitle={property.title}
              assignedUserId={kpDispatch.assignedUserId}
              organizationId={kpDispatch.organizationId}
              assignedUserName={kpDispatch.assignedUserName}
              organizationName={kpDispatch.organizationName}
              pagePath={`/propiedades/${property.id}`}
              email={partner.email}
              phone={partner.phone}
              mobile={partner.mobile}
              whatsapp={partner.whatsapp}
              webUrl={partner.webUrl}
              className="mt-3"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Bloque fijo de ficha: empresa (`organization`/`agency`) + agente (`user`/`agent`)
 * con nombre y avatar/logo, tal como vienen en cada ítem del response.
 */
export function PropertyOrgAgentBlock({
  property,
  kpDispatch,
  withContactGate = true,
  className = "",
}: Props) {
  const { organization, agent } = propertyOrgAndAgent(property);
  if (!organization && !agent) return null;

  const showAgent = Boolean(agent && (!organization || !partnersSamePerson(organization, agent)));

  return (
    <div className={`space-y-5 ${className}`}>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-gold-deep">
        Empresa y agente
      </h2>
      {organization ? (
        <PartnerRow
          chip="Empresa"
          partner={organization}
          scope="agency"
          property={property}
          kpDispatch={kpDispatch}
          withContactGate={withContactGate}
        />
      ) : null}
      {showAgent && agent ? (
        <div className={organization ? "border-t border-brand-navy/10 pt-4" : ""}>
          <PartnerRow
            chip="Agente"
            partner={agent}
            scope="agent"
            property={property}
            kpDispatch={kpDispatch}
            withContactGate={withContactGate}
          />
        </div>
      ) : null}
    </div>
  );
}

/** Versión compacta para cards del listado: avatar + nombre. */
export function PropertyOrgAgentCardLine({ property }: { property: NormalizedProperty }) {
  const { organization, agent } = propertyOrgAndAgent(property);
  if (!organization && !agent) return null;

  const showAgent = Boolean(agent && (!organization || !partnersSamePerson(organization, agent)));

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-brand-navy/10 bg-brand-navy-soft/40 px-3 py-2.5 text-xs">
      {organization ? (
        <div className="flex items-center gap-2">
          <Avatar partner={organization} size="sm" />
          <p className="min-w-0 truncate text-brand-navy">
            <span className="font-medium text-brand-navy/60">Empresa · </span>
            {organization.name}
          </p>
        </div>
      ) : null}
      {showAgent && agent ? (
        <div className="flex items-center gap-2">
          <Avatar partner={agent} size="sm" />
          <p className="min-w-0 truncate text-brand-navy">
            <span className="font-medium text-brand-navy/60">Agente · </span>
            {agent.name}
          </p>
        </div>
      ) : null}
    </div>
  );
}
