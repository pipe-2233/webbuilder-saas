import type { ReactNode } from "react";
import type { Section } from "@/lib/page-model/schema";

type SectionShellProps = {
  section: Section;
  className?: string;
  children: ReactNode;
};

/** Envoltorio común: fondo, espaciado y ancho máximo del contenido. */
export function SectionShell({ section, className, children }: SectionShellProps) {
  const { id, background, backgroundImage, backgroundOpacity } = section;
  const opacity = backgroundOpacity !== undefined ? backgroundOpacity / 100 : 1;
  return (
    <section
      data-section-id={id}
      style={background ? { backgroundColor: background } : undefined}
      className={`relative overflow-hidden px-6 @3xl:px-10 ${className ?? "py-16 @3xl:py-24"}`}
    >
      {backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{ 
            // Entre comillas: una dirección con paréntesis o espacios no rompe el CSS.
            backgroundImage: `url("${encodeURI(backgroundImage)}")`,
            opacity
          }}
        />
      )}
      <div className="relative z-10 mx-auto w-full max-w-5xl">{children}</div>
    </section>
  );
}
