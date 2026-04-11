import { telHref, whatsappHrefFromRaw } from "@/lib/contact-links";

type Props = {
  email: string | null;
  phone: string | null;
  mobile: string | null;
  whatsapp: string | null;
  webUrl: string | null;
  className?: string;
};

const linkClass =
  "font-medium text-brand-navy-mid underline-offset-2 transition hover:text-brand-gold-deep hover:underline";

export function PartnerContactLinks({
  email,
  phone,
  mobile,
  whatsapp,
  webUrl,
  className = "",
}: Props) {
  const tel = telHref(mobile) ?? telHref(phone);
  const wa = whatsappHrefFromRaw(whatsapp ?? mobile ?? phone);
  const hasAny = email || tel || wa || webUrl;
  if (!hasAny) return null;

  return (
    <ul className={`space-y-1.5 text-left text-xs ${className}`}>
      {email && (
        <li>
          <a href={`mailto:${email}`} className={linkClass}>
            {email}
          </a>
        </li>
      )}
      {tel && (
        <li>
          <a href={tel} className={linkClass}>
            {mobile ?? phone}
          </a>
        </li>
      )}
      {wa && (
        <li>
          <a href={wa} target="_blank" rel="noopener noreferrer" className={linkClass}>
            WhatsApp
          </a>
        </li>
      )}
      {webUrl && (
        <li>
          <a href={webUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
            Sitio web
          </a>
        </li>
      )}
    </ul>
  );
}
