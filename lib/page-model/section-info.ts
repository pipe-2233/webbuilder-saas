import type { Section, SectionType } from "./schema";

/** Nombre y descripción de cada tipo de sección, para el editor. */
export const SECTION_INFO: Record<SectionType, { label: string; description: string }> = {
  header: { label: "Cabecera", description: "Logo y menú de navegación" },
  hero: { label: "Portada", description: "Título grande, texto y botón" },
  text: { label: "Texto", description: "Título y párrafos" },
  image: { label: "Imagen", description: "Una imagen con pie de foto" },
  features: { label: "Características", description: "Lista de ventajas o servicios" },
  footer: { label: "Pie de página", description: "Texto final y enlaces" },
};

export const SECTION_TYPES = Object.keys(SECTION_INFO) as SectionType[];

/** Texto corto que identifica una sección concreta en la lista del editor. */
export function sectionSummary(section: Section): string {
  switch (section.type) {
    case "header":
      return section.props.logoText;
    case "hero":
      return section.props.title;
    case "text":
      return section.props.title || section.props.body;
    case "image":
      return section.props.caption || section.props.alt || (section.props.src ? "Imagen" : "Sin imagen");
    case "features":
      return section.props.title || `${section.props.items.length} elementos`;
    case "footer":
      return section.props.text;
  }
}
