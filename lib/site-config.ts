/** Datos institucionales (sin inventar métricas ni contactos ficticios). */
export const siteConfig = {
  name: "Redalia",
  tagline: "Red inmobiliaria colaborativa",
  description:
    "Redalia es una red de corredoras y agentes en Chile orientada a más negocios: colaboración, canje, visibilidad compartida, capacitación y respaldo profesional.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://redalia.vercel.app",
  contact: {
    email: "contacto@redalia.cl",
    schedule: "Lunes a viernes; coordinamos horario según tu disponibilidad.",
  },
} as const;
