import type { Section, SectionType } from "./schema";

/** Nombre y descripción de cada tipo de sección, para el editor. */
export const SECTION_INFO: Record<SectionType, { label: string; description: string }> = {
  header: { label: "Cabecera", description: "Logo y menú de navegación" },
  hero: { label: "Portada", description: "Título grande, texto y botones" },
  text: { label: "Texto", description: "Título y párrafos" },
  image: { label: "Imagen", description: "Una imagen con pie de foto" },
  features: { label: "Características", description: "Ventajas o servicios con iconos" },
  stats: { label: "Cifras", description: "Números destacados que cuentan solos" },
  showcase: { label: "Destacado", description: "Imagen, texto y ficha de datos" },
  cards: { label: "Tarjetas", description: "Productos o inmuebles con foto y precio" },
  steps: { label: "Lista", description: "Lugares, pasos o recorrido" },
  contact: { label: "Contacto", description: "WhatsApp, teléfono y redes" },
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
    case "stats":
      return section.props.items.map((item) => `${item.value}${item.suffix ? ` ${item.suffix}` : ""}`).join(" · ");
    case "showcase":
    case "cards":
    case "steps":
    case "contact":
      return section.props.title || section.props.eyebrow || SECTION_INFO[section.type].label;
  }
}
