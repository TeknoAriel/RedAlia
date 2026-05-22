import type { NormalizedProperty } from "@/types/property";

/** Contexto de despacho en KiteProp (`POST /api/v1/messages`) derivado del feed normalizado. */
export type PropertyKitepropMessageTarget = {
  propertyId: number;
  assignedUserId: number | null;
  organizationId: number | null;
  assignedUserName: string | null;
  organizationName: string | null;
};

/**
 * IDs para enrutar la consulta a la publicación, corredora (org) y asesor asignado.
 * En el feed JSON: `id` → propiedad, `agency.id` → org, `agent.id` → usuario asignado.
 */
export function propertyKitepropMessageTarget(p: NormalizedProperty): PropertyKitepropMessageTarget {
  const propertyId = p.externalNumericId;
  const assignedUserId = p.agentAgency?.id ?? null;
  const organizationId = p.agency?.id ?? null;
  return {
    propertyId,
    assignedUserId: assignedUserId != null && assignedUserId > 0 ? Math.floor(assignedUserId) : null,
    organizationId: organizationId != null && organizationId > 0 ? Math.floor(organizationId) : null,
    assignedUserName: p.agentAgency?.name?.trim() || null,
    organizationName: p.agency?.name?.trim() || null,
  };
}
