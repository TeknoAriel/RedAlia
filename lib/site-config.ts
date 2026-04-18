/** Datos institucionales (sin inventar métricas). */
export const siteConfig = {
  name: "Redalia",
  /** Bajada oficial de marca (lockup, cabecera, pie, metadatos). */
  brandLockup: "Red de Alianzas Inmobiliarias",
  /** Línea de posicionamiento complementaria (no sustituye la bajada de logo). */
  tagline: "Comunidad inmobiliaria profesional · Chile",
  description:
    "Redalia es una comunidad de corredoras y agentes en Chile: negocios reales, canje y colaboración con reglas claras, transparencia, capacitación continua y tecnología al servicio de más y mejores cierres.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://redalia.vercel.app",
  contact: {
    email: "contacto@redalia.cl",
    schedule: "Lunes a viernes; coordinamos horario según tu disponibilidad.",
    /** WhatsApp comercial Redalia. Sobreescribible con `NEXT_PUBLIC_WHATSAPP_*` en el hosting. */
    whatsappHref: "https://wa.me/56984553691",
    whatsappDisplay: "+56 9 8455 3691",
  },
} as const;
