/**
 * Copy institucional de Home (iteración UX; no acoplar a catálogo/MCP).
 * Frase base acordada: conexión en Chile, negocios reales, marca y honorarios propios.
 */

export const homeHeroTitle =
  "Comunidad inmobiliaria en Chile para negocios reales, canje y mejores cierres";

/** Primera parte de la promesa (ritmo claro, tono institucional chileno). */
export const homeHeroLead =
  "Redalia conecta inmobiliarias, corredoras y agentes en Chile para generar negocios reales, compartir oportunidades con criterio y lograr más y mejores cierres.";

/** Segunda parte: marca, cliente y honorarios (sin perder el sentido acordado). */
export const homeHeroLeadSecondary =
  "Tu marca y tu relación con el cliente siguen siendo tuyas. La red te aporta colaboración profesional, tecnología, capacitación y más negocio, manteniendo el 100% de tus honorarios.";

export const homeHeroFootnote =
  "Incorporación conversada · Estándares entre socios · Plataforma y apoyo alineados a la operación en Chile";

export const homeValuePillars = [
  {
    title: "Comunidad de negocios",
    text: "No somos un multipublicador: somos una red de profesionales que colaboran para ejecutar mejor, con canje y reglas claras.",
  },
  {
    title: "Tecnología que trabaja por vos",
    text: "IA y perfiles de búsqueda inteligentes para detectar oportunidades y ordenar el seguimiento, sin reemplazar tu criterio frente al cliente.",
  },
  {
    title: "Capacitación permanente",
    text: "Instancias regulares en práctica comercial y actualización del rubro, pensadas para el día siguiente en terreno.",
  },
  {
    title: "Tu marca, tu cliente, tus honorarios",
    text: "La visibilidad útil y el apoyo de la red potencian resultados sin ceder la relación directa ni el 100% de tus honorarios.",
  },
] as const;

export const homeTechnologyPoints = [
  {
    title: "IA aplicada al corretaje",
    text: "Herramientas que ayudan a priorizar y acompañar, con foco en oportunidades concretas —no en ruido.",
  },
  {
    title: "Perfiles de búsqueda inteligentes",
    text: "Señales alineadas a la operación de la comunidad para acercar oferta y demanda con más intención de cierre.",
  },
  {
    title: "Detección de oportunidades",
    text: "Apoyo para que tu equipo vea mejor dónde insistir, coordinar visitas y avanzar con rigor frente a socios y clientes.",
  },
] as const;

export const homeTrainingCollaboration = {
  eyebrow: "Formación y colaboración",
  title: "Capacitación continua y negocio compartido, con el mismo estándar",
  body:
    "Instancias regulares de actualización y práctica comercial, junto a criterios compartidos para compartir oportunidades, coordinar visitas y comisiones cuando la operación lo requiere —siempre con foco en ejecutar en Chile.",
  links: [
    { href: "/capacitacion", label: "Enfoque de capacitación" },
    { href: "/colaboracion", label: "Canje y colaboración" },
    { href: "/servicios", label: "Servicios de acompañamiento" },
  ] as const,
};
