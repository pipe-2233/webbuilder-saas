import type { ReactNode } from "react";

type SectionShellProps = {
  id: string;
  /** Color de fondo propio de la sección; si no hay, se ve el del tema. */
  background?: string;
  className?: string;
  children: ReactNode;
};

/** Envoltorio común: fondo, espaciado y ancho máximo del contenido. */
export function SectionShell({ id, background, className, children }: SectionShellProps) {
  return (
    <section
      data-section-id={id}
      style={background ? { backgroundColor: background } : undefined}
      className={`px-6 @3xl:px-10 ${className ?? "py-16 @3xl:py-24"}`}
    >
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </section>
  );
}
