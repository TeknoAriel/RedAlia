import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { getLinkedInUrl, getWhatsappContact } from "@/lib/public-contact";

const footerLinks = [
  { href: "/que-es", label: "Qué es Redalia" },
  { href: "/colaboracion", label: "Colaboración y canje" },
  { href: "/capacitacion", label: "Capacitación" },
  { href: "/servicios", label: "Servicios" },
  { href: "/socios", label: "Socios" },
  { href: "/propiedades", label: "Propiedades" },
  { href: "/planes", label: "Planes" },
  { href: "/unete", label: "Únete" },
  { href: "/contacto", label: "Contacto" },
];

export function Footer() {
  const wa = getWhatsappContact();
  const linkedIn = getLinkedInUrl();

  return (
    <footer className="mt-auto border-t border-white/10 bg-brand-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <p className="text-2xl font-bold tracking-tight text-white">{siteConfig.name}</p>
              <p className="mt-1 text-sm font-medium tracking-wide text-brand-gold">{siteConfig.tagline}</p>
            </Link>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/80">
              Red de corredoras y agentes en Chile, enfocada en colaboración comercial, canje de oportunidades,
              visibilidad compartida y formación continua, con respaldo operativo serio.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-gold">Sitio</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-white/85 hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-gold">Contacto</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/85">
              <li>
                <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-white">
                  {siteConfig.contact.email}
                </a>
              </li>
              {wa && (
                <li>
                  <a href={wa.href} className="hover:text-white" target="_blank" rel="noopener noreferrer">
                    WhatsApp: {wa.display}
                  </a>
                </li>
              )}
              <li className="text-white/60">{siteConfig.contact.schedule}</li>
              {linkedIn && (
                <li>
                  <a href={linkedIn} className="hover:text-white" target="_blank" rel="noopener noreferrer">
                    LinkedIn
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/55 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.
          </p>
          <p className="max-w-md sm:text-right">
            Las fichas e imágenes corresponden a socios y operaciones vinculadas a la red.
          </p>
        </div>
        <div className="mt-6 border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-white/50">
            Aliado tecnológico:{" "}
            <a
              href="https://www.kiteprop.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white/70 transition hover:text-brand-gold"
            >
              KiteProp
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
