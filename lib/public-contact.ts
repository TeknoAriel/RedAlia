import { siteConfig } from "@/lib/site-config";

/**
 * Datos de contacto públicos. Prioridad: variables de entorno → valores institucionales en `siteConfig`.
 */
export function getWhatsappContact(): { href: string; display: string } | null {
  const explicitUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL?.trim();
  if (explicitUrl) {
    const display = process.env.NEXT_PUBLIC_WHATSAPP_LABEL?.trim() || "WhatsApp";
    return { href: explicitUrl, display };
  }
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim();
  if (raw) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 9) {
      return {
        href: siteConfig.contact.whatsappHref,
        display: siteConfig.contact.whatsappDisplay,
      };
    }
    const display =
      process.env.NEXT_PUBLIC_WHATSAPP_LABEL?.trim() ||
      formatChileWhatsappDisplay(digits);
    return { href: `https://wa.me/${digits}`, display };
  }
  return {
    href: siteConfig.contact.whatsappHref,
    display: siteConfig.contact.whatsappDisplay,
  };
}

function formatChileWhatsappDisplay(digits: string): string {
  if (digits.startsWith("56") && digits.length >= 10) {
    const rest = digits.slice(2);
    if (rest.length === 9)
      return `+56 9 ${rest.slice(1, 5)} ${rest.slice(5)}`;
  }
  return `+${digits}`;
}

export function getLinkedInUrl(): string | null {
  const u = process.env.NEXT_PUBLIC_LINKEDIN_URL?.trim();
  if (!u || u === "#") return null;
  return u;
}

export function getMembersPortalUrl(): string {
  return (
    process.env.NEXT_PUBLIC_MEMBERS_PORTAL_URL?.trim() ||
    "https://www.kiteprop.com/auth/login"
  );
}
