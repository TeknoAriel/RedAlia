/** Datos institucionales (sin inventar métricas). */
export const siteConfig = {
  name: "Redalia",
  tagline: "Red inmobiliaria colaborativa",
  description:
    "Redalia es una red de corredoras y agentes en Chile orientada a más negocios: colaboración, canje, visibilidad compartida, capacitación y respaldo profesional.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://redalia.vercel.app",
  contact: {
    email: "contacto@redalia.cl",
    schedule: "Lunes a viernes; coordinamos horario según tu disponibilidad.",
    /** WhatsApp comercial Redalia. Sobreescribible con `NEXT_PUBLIC_WHATSAPP_*` en el hosting. */
    whatsappHref: "https://wa.me/56984553691",
    whatsappDisplay: "+56 9 8455 3691",
  },
} as const;
