// schema.ts importa este archivo, así que aquí no se importa nada de él
// (evita dependencias circulares). Debe coincidir con los tipos de sección.
type SectionType = "header" | "hero" | "text" | "image" | "features" | "footer";

/**
 * Elementos de cada sección que se pueden seleccionar y personalizar
 * (fuente, tamaño, color...). En portada, texto e imagen, además, se pueden
 * colocar libremente en escritorio.
 */
export const SECTION_ELEMENTS = {
  header: ["logo", "links"],
  hero: ["eyebrow", "title", "subtitle", "button", "image"],
  text: ["title", "body"],
  image: ["image", "caption"],
  features: ["title", "items", "itemTitle", "itemDescription"],
  footer: ["text", "links"],
} as const satisfies Record<SectionType, readonly string[]>;

/**
 * Elementos que se colocan (orden en móvil y posición libre en escritorio).
 * En características, los títulos y descripciones de cada tarjeta solo se
 * personalizan; lo que se mueve es el grupo de tarjetas entero ("items").
 */
export const LAYOUT_ELEMENTS = {
  header: ["logo", "links"],
  hero: ["eyebrow", "title", "subtitle", "button", "image"],
  text: ["title", "body"],
  image: ["image", "caption"],
  features: ["title", "items"],
  footer: ["text", "links"],
} as const satisfies { [T in SectionType]: readonly (typeof SECTION_ELEMENTS)[T][number][] };

export type ElementKey = (typeof SECTION_ELEMENTS)[SectionType][number];

export const ELEMENT_KEYS = [
  "logo",
  "links",
  "title",
  "subtitle",
  "button",
  "image",
  "body",
  "caption",
  "itemTitle",
  "itemDescription",
  "text",
  "items",
  "eyebrow",
] as const satisfies readonly ElementKey[];

/** Secciones cuyos elementos se pueden colocar libremente en escritorio (todas). */
export const FREE_LAYOUT_SECTIONS: readonly SectionType[] = ["header", "hero", "text", "image", "features", "footer"];

export function supportsFreeLayout(type: SectionType): boolean {
  return FREE_LAYOUT_SECTIONS.includes(type);
}

/** Elementos que se pueden seleccionar y personalizar. */
export function elementsOf(type: SectionType): readonly ElementKey[] {
  return SECTION_ELEMENTS[type];
}

/** Elementos que se colocan: orden en móvil y posición libre en escritorio. */
export function layoutElementsOf(type: SectionType): readonly ElementKey[] {
  return LAYOUT_ELEMENTS[type];
}

export const ELEMENT_LABELS: Record<ElementKey, string> = {
  logo: "Logo",
  links: "Enlaces",
  title: "Título",
  subtitle: "Subtítulo",
  button: "Botón",
  image: "Imagen",
  body: "Texto",
  caption: "Pie de foto",
  itemTitle: "Títulos de los elementos",
  itemDescription: "Descripciones de los elementos",
  text: "Texto",
  items: "Tarjetas",
  eyebrow: "Antetítulo",
};

/** Qué tipo de controles de estilo admite cada elemento. */
export type ElementKind = "text" | "button" | "image" | "group";

export function elementKind(key: ElementKey): ElementKind {
  if (key === "button") return "button";
  if (key === "image") return "image";
  if (key === "items") return "group";
  return "text";
}

/** Tamaños de texto disponibles, de menor a mayor. */
export const TEXT_SIZE_KEYS = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl"] as const;
export type TextSize = (typeof TEXT_SIZE_KEYS)[number];

export const TEXT_SIZES: Record<TextSize, { label: string; rem: number }> = {
  xs: { label: "Muy pequeño", rem: 0.75 },
  sm: { label: "Pequeño", rem: 0.875 },
  base: { label: "Normal", rem: 1 },
  lg: { label: "Mediano", rem: 1.125 },
  xl: { label: "Grande", rem: 1.25 },
  "2xl": { label: "Muy grande", rem: 1.5 },
  "3xl": { label: "Título pequeño", rem: 1.875 },
  "4xl": { label: "Título", rem: 2.25 },
  "5xl": { label: "Título grande", rem: 3 },
  "6xl": { label: "Enorme", rem: 3.75 },
  "7xl": { label: "Gigante", rem: 4.5 },
};

/** Ancho de un elemento cuando se colocan en columna (móvil y modo ordenado). */
export const ELEMENT_WIDTH_KEYS = ["auto", "narrow", "medium", "full"] as const;
export type ElementWidth = (typeof ELEMENT_WIDTH_KEYS)[number];
export const ELEMENT_WIDTHS: Record<ElementWidth, string> = {
  auto: "Automático",
  narrow: "Estrecho",
  medium: "Medio",
  full: "Completo",
};

export const RADIUS_KEYS = ["none", "small", "full"] as const;
export type Radius = (typeof RADIUS_KEYS)[number];
export const RADII: Record<Radius, string> = {
  none: "Recto",
  small: "Suave",
  full: "Redondo",
};
