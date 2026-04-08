/** Datos institucionales editables (sin inventar métricas). */
export const siteConfig = {
  name: "Redalia",
  tagline: "Red de Alianzas Inmobiliarias",
  description:
    "Redalia conecta corredoras y agentes inmobiliarios con oportunidades reales, visibilidad comercial y networking profesional, con tecnología y acompañamiento.",
  /** Canónica: en Vercel suele ser https://redalia.vercel.app; sobreescribible con NEXT_PUBLIC_SITE_URL. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://redalia.vercel.app",
  contact: {
    email: "contacto@redalia.cl",
    whatsappDisplay: "+56 9 XXXX XXXX",
    whatsappHref: "https://wa.me/56900000000",
    schedule: "Lunes a viernes, horario a coordinar.",
  },
  social: {
    linkedin: "#",
  },
} as const;
