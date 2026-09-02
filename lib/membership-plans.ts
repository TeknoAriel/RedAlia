/** Planes comerciales de membresía Redalia (UF, Chile). */

export type MembershipPlanKey = "light" | "single" | "essential" | "basic";

export type MembershipPlan = {
  key: MembershipPlanKey;
  name: string;
  priceUf: number;
  users: number;
  properties: number;
  commitment: { months3: number; months6: number; months12: number };
  featured?: boolean;
};

export const membershipPlans: MembershipPlan[] = [
  {
    key: "light",
    name: "Plan Light",
    priceUf: 1.98,
    users: 1,
    properties: 10,
    commitment: { months3: 1.92, months6: 1.83, months12: 1.8 },
  },
  {
    key: "single",
    name: "Plan Single",
    priceUf: 2.88,
    users: 2,
    properties: 20,
    commitment: { months3: 2.8, months6: 2.67, months12: 2.62 },
  },
  {
    key: "essential",
    name: "Plan Essential",
    priceUf: 3.84,
    users: 2,
    properties: 30,
    commitment: { months3: 3.73, months6: 3.56, months12: 3.49 },
    featured: true,
  },
  {
    key: "basic",
    name: "Plan Basic",
    priceUf: 6.1,
    users: 3,
    properties: 50,
    commitment: { months3: 5.92, months6: 5.65, months12: 5.55 },
  },
];

export const membershipIncludedFeatures = [
  "100% de comisión para el agente",
  "CRM KiteProp",
  "Publicación en todos los portales",
  "Capacitación mensual",
  "Asistencia legal",
  "Micro sitio",
  "Bolsa de canje",
] as const;

export const membershipAddons = [
  { label: "Usuario adicional", priceUf: 0.3 },
  { label: "+10 propiedades", priceUf: 0.98 },
] as const;

export const membershipValueProps = [
  { title: "100% comisión para el agente", text: "Tus honorarios quedan en tu operación." },
  { title: "Publica en todos los portales", text: "Difusión amplia con el CRM KiteProp." },
  { title: "Capacitaciones y soporte constante", text: "Formación mensual y acompañamiento." },
  { title: "Respaldo legal en cada operación", text: "Asistencia legal como parte de la membresía." },
] as const;

export function formatMembershipUf(value: number): string {
  return `UF ${value.toFixed(2).replace(".", ",")}`;
}

export function getMembershipPlan(key: string | null | undefined): MembershipPlan | null {
  if (!key) return null;
  const normalized = key.trim().toLowerCase();
  return membershipPlans.find((p) => p.key === normalized) ?? null;
}

export function membershipJoinHref(plan: MembershipPlan): string {
  return `/unete?plan=${plan.key}`;
}
