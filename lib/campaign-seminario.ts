/** Destino del QR del folleto comercial (repartido en eventos). */

export const SEMINARIO_PATH = "/seminario";
export const SEMINARIO_PUBLIC_URL = "https://www.redalia.cl/seminario";

export const seminarioPromo = {
  badge: "Red de Alianzas Inmobiliarias",
  hook: "Si tu inmobiliaria es grande, tu red debe serlo también.",
  cta: "Sumate a Redalia",
  lead:
    "Redalia conecta corredoras e inmobiliarias en Chile: más stock, más ejecutivos en terreno y 100% de tus honorarios, sin ceder la marca.",
  offerTitle: "Sumate ahora · 20% de descuento",
  offerBody:
    "Escanea el QR, registrate y activa 20% de descuento en tu primer trimestre de membresía. Código: REDALIA20.",
  offerCode: "REDALIA20",
  offerFinePrint: "20% sobre la tarifa mensual del plan elegido durante los primeros 3 meses. No acumulable con otras promociones.",
} as const;

export const redaliaFeatures = [
  "100% de comisión para el agente",
  "CRM KiteProp incluido",
  "Publicación en todos los portales",
  "Bolsa de canje entre socios",
  "Micro sitio de tu oficina",
  "Capacitación mensual",
  "Asistencia legal en operaciones",
  "Catálogo compartido y actualizado",
  "Más stock para ofrecer, sin abrir otra marca",
  "Más ejecutivos moviendo tu oferta",
  "Marca propia al frente del cliente",
  "Reglas claras de colaboración y canje",
] as const;

export const redaliaBenefits = [
  {
    title: "Más inventario",
    text: "Accede a propiedades de la red con reglas de canje, no solo a tu cartera.",
  },
  {
    title: "Más fuerza comercial",
    text: "Otros socios presentan tu oferta a sus clientes, con trazabilidad.",
  },
  {
    title: "Más orden",
    text: "Pipeline, visitas y comisiones con criterio compartido —no un grupo de WhatsApp.",
  },
  {
    title: "Más prestigio",
    text: "Pertenencia institucional: honestidad, transparencia y estándar profesional.",
  },
] as const;
