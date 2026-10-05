import type { CSSProperties, ReactNode } from "react";

import type { Section } from "@/lib/page-model/schema";

type SectionShellProps = {
  section: Section;
  className?: string;
  children: ReactNode;
};

/** Variables del tema con texto claro, para fondos oscuros o con foto. */
const LIGHT_TEXT_VARS = {
  "--page-text": "#ffffff",
  "--page-muted": "rgb(255 255 255 / 0.78)",
} as CSSProperties;

/**
 * Envoltorio común: fondo (color, imagen y capa oscura), espaciado y ancho
 * máximo del contenido.
 */
export function SectionShell({ section, className, children }: SectionShellProps) {
  const { id, background, backgroundImage, backgroundOpacity, backgroundOverlay, lightText } = section;
  const opacity = backgroundOpacity !== undefined ? backgroundOpacity / 100 : 1;

  const style: CSSProperties = {
    ...(background ? { backgroundColor: background } : {}),
    ...(lightText ? { ...LIGHT_TEXT_VARS, color: "var(--page-text)" } : {}),
  };

  return (
    <section
      data-section-id={id}
      style={style}
      className={`relative overflow-hidden px-6 @3xl:px-10 ${className ?? "py-16 @3xl:py-24"}`}
    >
      {backgroundImage && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            // Entre comillas: una dirección con paréntesis o espacios no rompe el CSS.
            backgroundImage: `url("${encodeURI(backgroundImage)}")`,
            opacity,
          }}
        />
      )}
      {backgroundImage && backgroundOverlay ? (
        // Capa oscura con degradado, más intensa abajo, para que el texto se lea sobre la foto.
        <div
          aria-hidden
          className="absolute inset-0 z-0"
          style={{
            background: `linear-gradient(180deg, rgb(0 0 0 / ${backgroundOverlay * 0.7}%) 0%, rgb(0 0 0 / ${backgroundOverlay}%) 100%)`,
          }}
        />
      ) : null}
      <div className="relative z-10 mx-auto w-full max-w-5xl">{children}</div>
    </section>
  );
}
