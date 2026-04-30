/**
 * Copy institucional de Home (iteración UX; no acoplar a catálogo/MCP).
 * Frase base acordada: conexión en Chile, negocios reales, marca y honorarios propios.
 */

export const homeHeroTitle =
  "Redalia conecta corredoras, propiedades y oportunidades";

/** Primera parte de la promesa (ritmo claro, tono institucional chileno). */
export const homeHeroLead =
  "Una red inmobiliaria colaborativa para compartir propiedades, ampliar visibilidad, generar contactos y trabajar con más orden, tecnología y respaldo profesional.";

/** Segunda parte: marca, cliente y honorarios (sin perder el sentido acordado). */
export const homeHeroLeadSecondary =
  "Redalia reúne corredoras que buscan operar con reglas claras, confianza entre pares y foco en resultados comerciales sostenibles.";

export const homeHeroFootnote =
  "Colaboración profesional · Catálogo actualizado · Tecnología aplicada al negocio inmobiliario";

export const homeValuePillars = [
  {
    title: "Corredoras conectadas",
    text: "Más visibilidad, más colaboración y más oportunidades entre profesionales del rubro.",
  },
  {
    title: "Catálogo actualizado",
    text: "Propiedades organizadas en un entorno claro, navegable y preparado para consultas reales.",
  },
  {
    title: "Tecnología aplicada",
    text: "Redalia se apoya en KiteProp para ordenar información, catálogos y oportunidades comerciales.",
  },
  {
    title: "Comunidad profesional",
    text: "Un espacio para trabajar con reglas claras, confianza y foco en resultados.",
  },
] as const;

export const homeTechnologyPoints = [
  {
    title: "KiteProp como base tecnológica",
    text: "KiteProp aporta la base tecnológica que permite ordenar catálogos, conectar información y acompañar la gestión comercial de la red.",
  },
  {
    title: "Herramientas para priorizar oportunidades",
    text: "Herramientas que ayudan a priorizar y acompañar, con foco en oportunidades concretas y cierre real.",
  },
  {
    title: "Operación comercial con respaldo",
    text: "Información más ordenada para coordinar publicaciones, seguimiento y conversaciones comerciales entre socios.",
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
