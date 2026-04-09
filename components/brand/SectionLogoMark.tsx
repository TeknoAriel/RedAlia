import Image from "next/image";

type Props = {
  /** sm = marca discreta en secciones, lg = hero */
  size?: "sm" | "md" | "lg";
  align?: "center" | "start";
  className?: string;
};

const sizeClass: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-8 w-auto opacity-80",
  md: "h-11 w-auto opacity-90",
  lg: "h-14 w-auto sm:h-[4.25rem] sm:w-auto",
};

/**
 * Marca Redalia repetida en secciones de la home para reforzar identidad al navegar el scroll.
 */
export function SectionLogoMark({ size = "sm", align = "center", className = "" }: Props) {
  const dims =
    size === "lg"
      ? { width: 320, height: 96 }
      : size === "md"
        ? { width: 200, height: 60 }
        : { width: 160, height: 48 };

  const alignCls = align === "start" ? "justify-start" : "justify-center";

  return (
    <div className={`flex ${alignCls} ${className}`}>
      <Image
        src="/logo-redalia.png"
        alt="Redalia"
        width={dims.width}
        height={dims.height}
        className={`${sizeClass[size]} drop-shadow-sm`}
      />
    </div>
  );
}
