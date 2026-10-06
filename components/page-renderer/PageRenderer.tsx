import { Fragment, type CSSProperties, type ReactNode } from "react";

import { readableTextColor } from "@/lib/page-model/color";
import type { PageDocument, Section } from "@/lib/page-model/schema";

import { fontFamilyValue, pageFontVariables } from "./fonts";
import { CardsSection, ContactSection, ShowcaseSection, StatsSection, StepsSection } from "./sections-extra";
import {
  FeaturesSection,
  FooterSection,
  HeaderSection,
  HeroSection,
  ImageSection,
  TextSection,
} from "./sections";

type PageRendererProps = {
  document: PageDocument;
  className?: string;
  /** Envuelve cada sección (el editor lo usa para seleccionar y resaltar). */
  wrapSection?: (section: Section, content: ReactNode) => ReactNode;
};

/**
 * Dibuja una página a partir de su documento. Se usa en el editor, en la vista
 * previa y en la página publicada, así que no depende de nada del panel.
 *
 * Es un contenedor `@container`: las secciones se adaptan al ancho del
 * contenedor (no al de la ventana), para que la vista previa móvil del editor
 * se vea igual que en un teléfono.
 */
export function PageRenderer({ document, className, wrapSection }: PageRendererProps) {
  const { colors, fonts } = document.theme;

  const themeVars = {
    "--page-primary": colors.primary,
    "--page-on-primary": readableTextColor(colors.primary),
    "--page-bg": colors.background,
    "--page-text": colors.text,
    "--page-muted": colors.muted,
    "--page-font-heading": fontFamilyValue(fonts.heading),
    "--page-font-body": fontFamilyValue(fonts.body),
  } as CSSProperties;

  return (
    <div
      style={themeVars}
      className={`@container bg-(--page-bg) font-(family-name:--page-font-body) text-(--page-text) antialiased ${pageFontVariables} ${className ?? ""}`}
    >
      {document.sections.map((section) => {
        const content = <RenderSection section={section} />;
        return <Fragment key={section.id}>{wrapSection ? wrapSection(section, content) : content}</Fragment>;
      })}
    </div>
  );
}

function RenderSection({ section }: { section: Section }) {
  switch (section.type) {
    case "header":
      return <HeaderSection section={section} />;
    case "hero":
      return <HeroSection section={section} />;
    case "text":
      return <TextSection section={section} />;
    case "image":
      return <ImageSection section={section} />;
    case "features":
      return <FeaturesSection section={section} />;
    case "footer":
      return <FooterSection section={section} />;
    case "stats":
      return <StatsSection section={section} />;
    case "showcase":
      return <ShowcaseSection section={section} />;
    case "cards":
      return <CardsSection section={section} />;
    case "steps":
      return <StepsSection section={section} />;
    case "contact":
      return <ContactSection section={section} />;
  }
}
