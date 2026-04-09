import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

const footerLinks = [
  { href: "/socios", label: "Socios" },
  { href: "/propiedades", label: "Propiedades" },
  { href: "/planes", label: "Planes" },
  { href: "/unete", label: "Únete" },
  { href: "/contacto", label: "Contacto" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-brand-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <p className="text-2xl font-bold tracking-tight text-white">{siteConfig.name}</p>
              <p className="mt-1 text-sm font-medium tracking-wide text-brand-gold">
                {siteConfig.tagline}
              </p>
            </Link>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/80">
              Red líder en tecnología y resultados reales para el mercado inmobiliario, con operación
              alineada a <strong className="font-semibold text-white/95">KiteProp</strong>, referente
              tecnológico en la región.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-gold">Navegación</h3>
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
              <li>
                <a href={siteConfig.contact.whatsappHref} className="hover:text-white">
                  WhatsApp: {siteConfig.contact.whatsappDisplay}
                </a>
              </li>
              <li className="text-white/60">{siteConfig.contact.schedule}</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/55 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.</p>
          <p>Las imágenes y fichas de propiedades pueden provenir de socios de la red.</p>
        </div>
      </div>
    </footer>
  );
}
