"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const KITEPROP_LOGIN = "https://www.kiteprop.com/auth/login";

const mainLinks = [
  { href: "/", label: "Home" },
  { href: "/socios", label: "Socios" },
  { href: "/planes", label: "Planes" },
  { href: "/unete", label: "Únete" },
  { href: "/contacto", label: "Contacto" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const propiedadesActive =
    pathname === "/propiedades" || pathname.startsWith("/propiedades/");

  return (
    <header className="sticky top-0 z-50 border-b border-brand-navy/10 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3" onClick={() => setOpen(false)}>
          <Image
            src="/logo-redalia.png"
            alt="Redalia"
            width={220}
            height={66}
            className="h-12 w-auto sm:h-14"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {mainLinks.map(({ href, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-navy-soft text-brand-navy"
                    : "text-brand-navy/80 hover:bg-brand-navy-soft/60 hover:text-brand-navy"
                }`}
              >
                {label}
              </Link>
            );
          })}

          <div
            className="ml-2 flex items-center gap-2 border-l border-brand-navy/15 pl-3"
            aria-label="Accesos destacados"
          >
            <Link
              href="/propiedades"
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow-md transition ${
                propiedadesActive
                  ? "bg-brand-navy text-white ring-2 ring-brand-gold/70 ring-offset-2 ring-offset-white"
                  : "bg-brand-gold text-brand-navy hover:bg-[#d4b82e] hover:shadow-lg"
              }`}
            >
              Propiedades
            </Link>
            <a
              href={KITEPROP_LOGIN}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-brand-navy/20 bg-white px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm transition hover:border-brand-navy/40 hover:bg-brand-navy-soft/50"
            >
              Miembros
              <span className="sr-only">(abre en nueva pestaña)</span>
              <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/contacto"
            className="hidden rounded-full border border-brand-gold/50 bg-brand-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-navy-mid sm:inline-flex"
          >
            Agendar conversación
          </Link>
          <button
            type="button"
            className="inline-flex rounded-lg p-2 text-brand-navy lg:hidden"
            aria-expanded={open}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menú</span>
            {open ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-brand-navy/10 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Móvil">
            {mainLinks.map(({ href, label }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-lg px-3 py-3 text-base font-medium ${
                    active ? "bg-brand-navy-soft text-brand-navy" : "text-brand-navy hover:bg-brand-navy-soft"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              );
            })}

            <div className="mt-3 space-y-2 border-t border-brand-navy/10 pt-3">
              <Link
                href="/propiedades"
                className={`flex w-full items-center justify-center rounded-full px-4 py-3.5 text-center text-sm font-semibold shadow-md transition ${
                  propiedadesActive
                    ? "bg-brand-navy text-white ring-2 ring-brand-gold/60"
                    : "bg-brand-gold text-brand-navy hover:bg-[#d4b82e]"
                }`}
                onClick={() => setOpen(false)}
              >
                Propiedades
              </Link>
              <a
                href={KITEPROP_LOGIN}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-brand-navy/20 bg-white px-4 py-3.5 text-center text-sm font-semibold text-brand-navy"
                onClick={() => setOpen(false)}
              >
                Miembros
                <svg className="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>

            <Link
              href="/contacto"
              className="mt-3 rounded-full bg-brand-navy px-4 py-3 text-center text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Agendar conversación
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
