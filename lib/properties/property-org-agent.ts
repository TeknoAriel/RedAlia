import type { NormalizedProperty, PropertyPartner } from "@/types/property";

export type PropertyOrgAgentPair = {
  organization: (PropertyPartner & { name: string }) | null;
  agent: (PropertyPartner & { name: string }) | null;
};

function namedPartner(p: PropertyPartner | null | undefined): (PropertyPartner & { name: string }) | null {
  const name = p?.name?.trim();
  if (!p || !name) return null;
  return { ...p, name };
}

/**
 * Empresa (`organization` / `agency`) y agente (`user` / `agent`) del ítem de propiedad.
 * No aplica filtros de matriz: la ficha debe reflejar lo que viene en el response.
 */
export function propertyOrgAndAgent(p: NormalizedProperty): PropertyOrgAgentPair {
  return {
    organization: namedPartner(p.agency),
    agent: namedPartner(p.agentAgency),
  };
}

export function partnersSamePerson(
  a: PropertyPartner | null | undefined,
  b: PropertyPartner | null | undefined,
): boolean {
  if (!a?.name?.trim() || !b?.name?.trim()) return false;
  if (a.id != null && b.id != null) return a.id === b.id;
  return a.name.trim().toLowerCase() === b.name.trim().toLowerCase();
}
