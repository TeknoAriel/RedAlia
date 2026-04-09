import Image from "next/image";
import Link from "next/link";
import { SectionLogoMark } from "@/components/brand/SectionLogoMark";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { CTASection } from "@/components/sections/CTASection";

const heroImage =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=82";

const benefits = [
  {
    title: "Más oportunidades",
    text: "Circulación de oferta y demanda entre equipos que trabajan con foco comercial y criterio de cierre.",
  },
  {
    title: "Más visibilidad",
    text: "Tu marca y tus publicaciones con mayor exposición dentro de un ecosistema pensado para el negocio inmobiliario.",
  },
  {
    title: "Networking con sentido",
    text: "Encuentros y vínculos con corredoras y agentes que buscan concretar, no solo sumar contactos.",
  },
  {
    title: "Acompañamiento personalizado",
    text: "Seguimiento según tu perfil: metas, zona y tipo de operación, con lenguaje claro y cercano.",
  },
  {
    title: "Mejor circulación de oferta",
    text: "Canales y criterios para que lo publicado llegue a quien puede moverlo en la práctica.",
  },
  {
    title: "Capacitación de forma permanente",
    text: "La red apuesta por formación continua: buenas prácticas, herramientas y actualización para que podáis desempeñar mejor en terreno.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-brand-navy text-white">
        <div className="absolute inset-0 img-tech-wrap">
          <Image
            src={heroImage}
            alt=""
            fill
            className="object-cover opacity-40"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 z-[2] bg-gradient-to-r from-brand-navy via-brand-navy/95 to-brand-navy/80" />
        </div>
        <div className="relative z-10 mx-auto max-w-6xl bg-mesh px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <SectionLogoMark size="lg" align="start" className="mb-8" />
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-gold">Red de alianzas inmobiliarias</p>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Una red pensada para acercar negocios reales a corredoras y agentes
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/90">
            Redalia combina vínculos profesionales, tecnología y visibilidad comercial para potenciar alianzas, con foco en{" "}
            <strong className="font-semibold text-white">resultados reales</strong>. Operamos alineados a{" "}
            <strong className="font-semibold text-white">KiteProp</strong>, plataforma líder en tecnología inmobiliaria en
            Latinoamérica.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/unete"
              className="inline-flex items-center justify-center rounded-full bg-brand-gold px-8 py-3.5 text-sm font-semibold text-brand-navy shadow-lg transition hover:bg-[#d4b82e]"
            >
              Sumarse a la red
            </Link>
            <Link
              href="/contacto"
              className="inline-flex items-center justify-center rounded-full border border-white/35 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Coordinar una presentación
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionLogoMark size="md" className="mb-6" />
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <SectionHeader
              eyebrow="Qué es Redalia"
              title="Orden y proyección para tu canal comercial"
              description="Redalia es una red de alianzas inmobiliarias: un espacio donde corredoras y agentes comparten criterio, oportunidades y herramientas. El foco está en acercar negocios y dar estructura entre oferta, demanda y quienes ejecutan."
            />
            <p className="mt-6 text-base leading-relaxed text-muted">
              No se trata solo de una vitrina: acá buscamos mejores resultados medibles, con tecnología al servicio del
              negocio y estándares acordes al ecosistema <strong className="text-brand-navy">KiteProp</strong>. Además, la
              red impulsa <strong className="text-brand-navy">capacitación de forma permanente</strong> para que el equipo
              siga actualizado en herramientas, normativa y práctica comercial.
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl ring-1 ring-brand-navy/10">
            <span className="img-tech-wrap relative block h-full w-full">
              <Image
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=82"
                alt="Equipo profesional en entorno corporativo moderno"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </span>
            <div className="pointer-events-none absolute inset-0 z-[2] ring-1 ring-inset ring-brand-navy/10" />
          </div>
        </div>
      </section>

      <section className="border-y border-brand-navy/10 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionLogoMark size="sm" className="mb-5" />
          <SectionHeader
            align="center"
            eyebrow="Beneficios"
            title="Estructura de valor para quienes están en terreno"
            description="Beneficios pensados para el día a día: claridad, circulación, respaldo y formación continua."
          />
          <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <li
                key={b.title}
                className="relative overflow-hidden rounded-2xl border border-brand-navy/10 bg-brand-navy-soft/40 p-6 transition hover:border-brand-gold/40"
              >
                <div className="mb-3 h-1 w-12 rounded-full bg-gradient-to-r from-brand-gold to-brand-gold-deep" />
                <h3 className="text-lg font-semibold text-brand-navy">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{b.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="section-tech-panel mb-10 px-6 py-10 sm:px-10 sm:py-12">
          <SectionLogoMark size="md" className="relative z-[1] mb-5" />
          <div className="relative z-[1] mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-deep">Formación</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">
              Capacitación de forma permanente
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
              La red ofrece instancias de aprendizaje de forma continua: buenas prácticas, uso de herramientas y
              actualización para que podáis desempeñar con más seguridad frente a clientes y socios. Es parte de cómo
              trabajamos resultados reales, no solo discurso.
            </p>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-brand-navy/10 lg:order-2">
            <span className="img-tech-wrap relative block h-full w-full">
              <Image
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=82"
                alt="Reunión estratégica y networking profesional"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </span>
          </div>
          <div className="lg:order-1">
            <SectionHeader
              eyebrow="Por qué no es solo otra vitrina"
              title="Red profesional, foco en resultados"
              description="Redalia se sostiene en vínculos directos con los miembros, criterios comerciales compartidos y tecnología aplicada al negocio."
            />
            <ul className="mt-6 space-y-4 text-muted">
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-gold" />
                <span>
                  <strong className="text-brand-navy">Relación directa</strong> con la red: menos ruido, más conversaciones
                  que llevan a algo concreto.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-gold" />
                <span>
                  <strong className="text-brand-navy">Propuesta cuidada</strong> en tono, materiales y forma de trabajar las
                  oportunidades.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-gold" />
                <span>
                  <strong className="text-brand-navy">Stack alineado a KiteProp</strong> para ordenar publicaciones,
                  difusión y seguimiento según las integraciones disponibles.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-brand-navy-soft/60 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionLogoMark size="sm" className="mb-5" />
          <SectionHeader
            align="center"
            eyebrow="Audiencias"
            title="Pensado para corredoras y para agentes"
            description="La misma red, con matices según tu rol: escala, marca y forma de captar negocios."
          />
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div className="tech-panel-glow rounded-2xl border border-brand-navy/10 bg-white p-8 shadow-sm">
              <h3 className="text-xl font-bold text-brand-navy">Para corredoras</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Podés fortalecer posicionamiento de marca, coordinar oportunidades entre equipos y sumar canales de
                difusión alineados a tu operación, con una estructura que respeta tu independencia comercial.
              </p>
              <Link href="/planes" className="mt-6 inline-flex text-sm font-semibold text-brand-gold-deep hover:underline">
                Ver niveles de participación →
              </Link>
            </div>
            <div className="tech-panel-glow rounded-2xl border border-brand-navy/10 bg-white p-8 shadow-sm">
              <h3 className="text-xl font-bold text-brand-navy">Para agentes inmobiliarios</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Ampliá red de contactos, accedé a circulación de propiedades y contá con respaldo para ordenar tu
                pipeline, con herramientas y acompañamiento según tu perfil —y formación continua para seguir
                creciendo.
              </p>
              <Link href="/unete" className="mt-6 inline-flex text-sm font-semibold text-brand-gold-deep hover:underline">
                Postular a la red →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionLogoMark size="sm" className="mb-8" />
        <CTASection
          title="¿Querés ver si Redalia encaja con tu operación?"
          description="Coordinemos una conversación breve o una presentación de la propuesta. Sin presión: foco en claridad y próximos pasos."
          primaryHref="/contacto"
          primaryLabel="Ir a contacto"
          secondaryHref="/propiedades"
          secondaryLabel="Ver propiedades"
        />
      </section>
    </>
  );
}
