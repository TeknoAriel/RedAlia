/** Payload de consulta (formulario web → `dispatchConsulta`). */
export type ConsultaPayload = {
  property_id: number | null;
  property_code: string | null;
  property_title: string | null;
  site: string | null;
  page_url: string | null;
  leadIntentId: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  /** Asesor asignado en KiteProp (`agent.id` del feed). */
  assigned_user_id: number | null;
  /** Alias de asignación; si falta, se usa `assigned_user_id`. */
  user_id: number | null;
  assigned_user_name: string | null;
  /** Corredora / org (`agency.id` del feed). */
  organization_id: number | null;
  organization_name: string | null;
};
