import { z } from "zod";

import { ENTRANCE_KEYS, HOVER_KEYS, LOOP_KEYS } from "./animations";
import { ELEMENT_KEYS, ELEMENT_WIDTH_KEYS, RADIUS_KEYS, TEXT_SIZE_KEYS } from "./elements";

/**
 * Modelo de página: un documento JSON que describe una página web completa.
 *
 * - `theme`: colores y fuentes globales.
 * - `sections`: lista ordenada de bloques (cabecera, portada, texto...).
 *
 * El editor visual modifica este documento; el renderizador lo convierte en
 * HTML. Se guarda en `projects.content` (jsonb) y se valida siempre en el
 * servidor antes de guardarlo.
 */

export const PAGE_MODEL_VERSION = 1;

export const LIMITS = {
  sections: 50,
  links: 8,
  featureItems: 12,
} as const;

/** Longitud máxima de cada texto. El editor usa los mismos límites. */
export const TEXT_LIMITS = {
  metaTitle: 70,
  metaDescription: 160,
  logoText: 60,
  linkLabel: 40,
  heroTitle: 120,
  heroSubtitle: 300,
  buttonLabel: 40,
  sectionTitle: 120,
  body: 5000,
  imageAlt: 200,
  caption: 200,
  featureTitle: 80,
  featureDescription: 300,
  footerText: 200,
} as const;

export const ALIGNMENTS = ["left", "center", "right"] as const;
const align = z.enum(ALIGNMENTS);

// ---------------------------------------------------------------------------
// Primitivas
// ---------------------------------------------------------------------------

const id = z.string().min(1).max(64);

const text = (max: number) => z.string().trim().max(max);
const requiredText = (max: number) => text(max).min(1, "Este campo es obligatorio.");

export const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Usa un color hexadecimal, por ejemplo #1a2b3c.")
  .transform((value) => value.toLowerCase());

/** Protocolos permitidos en enlaces. Bloquea `javascript:`, `data:`, etc. */
const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|#|\/(?!\/))/i;

export const href = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => SAFE_HREF.test(value), {
    message: "Enlace no válido. Usa https://, mailto:, tel:, #seccion o /ruta.",
  });

/** Enlace opcional: vacío o un enlace válido. */
const optionalHref = z.union([z.literal(""), href]);

/** Imagen: vacía, https:// o una ruta local (/imagen.png). */
export const imageSrc = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => value === "" || /^(https:\/\/|\/(?!\/))/i.test(value), {
    message: "La imagen debe ser una URL https:// o una ruta local.",
  });

export const FONT_FAMILIES = [
  "inter",
  "poppins",
  "montserrat",
  "lato",
  "playfair-display",
  "merriweather",
] as const;

export const fontFamily = z.enum(FONT_FAMILIES);

// ---------------------------------------------------------------------------
// Tema
// ---------------------------------------------------------------------------

export const themeSchema = z.object({
  colors: z.object({
    primary: hexColor,
    background: hexColor,
    text: hexColor,
    muted: hexColor,
  }),
  fonts: z.object({
    heading: fontFamily,
    body: fontFamily,
  }),
});

// ---------------------------------------------------------------------------
// Secciones
// ---------------------------------------------------------------------------

const navLinkSchema = z.object({
  id,
  label: requiredText(TEXT_LIMITS.linkLabel),
  href,
});

// ---------------------------------------------------------------------------
// Estilo y posición de los elementos de una sección
// ---------------------------------------------------------------------------

const elementKey = z.enum(ELEMENT_KEYS);

/** Personalización de un elemento (título, botón...). Todo es opcional. */
export const elementStyleSchema = z.object({
  font: fontFamily.optional(),
  size: z.enum(TEXT_SIZE_KEYS).optional(),
  color: hexColor.optional(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  align: align.optional(),
  width: z.enum(ELEMENT_WIDTH_KEYS).optional(),
  /** Botones y cuadros: color de fondo. */
  background: hexColor.optional(),
  /** Botones e imágenes: forma de las esquinas. */
  radius: z.enum(RADIUS_KEYS).optional(),
  /** Animación de entrada (una vez, al aparecer en pantalla). */
  animation: z.enum(["none", ...ENTRANCE_KEYS]).optional(),
  /** Retraso de la animación de entrada, en milisegundos (para escalonar). */
  animationDelay: z.number().int().min(0).max(2000).optional(),
  /** Animación continua (se repite). */
  loop: z.enum(LOOP_KEYS).optional(),
  /** Efecto al pasar el ratón. */
  hover: z.enum(HOVER_KEYS).optional(),
});

/** Posición libre de un elemento en escritorio. */
export const freePositionSchema = z.object({
  /** Distancia desde la izquierda, en % del ancho del contenido. */
  x: z.number().min(0).max(100),
  /** Distancia desde arriba, en píxeles. */
  y: z.number().min(0).max(4000),
  /** Ancho, en % del ancho del contenido. */
  w: z.number().min(5).max(100),
  /** Alto fijo en píxeles (al agrandar desde la esquina). Sin él, el alto es automático. */
  h: z.number().min(16).max(2000).optional(),
});

export const sectionLayoutSchema = z.object({
  /** Orden de los elementos en columna (móvil, y escritorio sin posición libre). */
  order: z.array(elementKey).max(ELEMENT_KEYS.length).optional(),
  /** Posiciones libres en escritorio (solo portada, texto e imagen). */
  free: z
    .object({
      /** Alto de la zona de contenido, en píxeles. */
      height: z.number().min(80).max(4000),
      items: z.partialRecord(elementKey, freePositionSchema),
    })
    .optional(),
});

export const LIMITS_SHAPES = 30;

export const shapeSchema = z.object({
  id,
  type: z.enum(["square", "circle", "pill", "triangle", "star", "hexagon", "arrow", "ring", "arch", "custom"]),
  color: hexColor,
  opacity: z.number().min(0).max(100).default(50),
  radius: z.enum(RADIUS_KEYS).optional(), // Solo square
  position: freePositionSchema, // x, y, w, h
  zIndex: z.number().int().min(-10).max(50).default(0),
  rotation: z.number().min(-360).max(360).default(0).optional(),
  borderWidth: z.number().min(0).max(50).default(0).optional(),
  borderColor: hexColor.optional(),
  customPath: z.string().max(2000).optional(),
  blur: z.number().min(0).max(50).optional(),
  shadow: z.enum(["none", "sm", "md", "lg", "xl"]).optional(),
});
export type Shape = z.infer<typeof shapeSchema>;
export type ShapeType = Shape["type"];

/** Campos comunes a todas las secciones. */
const sectionBase = {
  id,
  /** Color de fondo propio; si no se indica, se usa el del tema. */
  background: hexColor.optional(),
  /** Imagen de fondo opcional para la sección. */
  backgroundImage: imageSrc.optional(),
  /** Opacidad de la imagen de fondo (0-100). */
  backgroundOpacity: z.number().min(0).max(100).default(100).optional(),
  /** Estilo propio de cada elemento de la sección. */
  styles: z.partialRecord(elementKey, elementStyleSchema).optional(),
  layout: sectionLayoutSchema.optional(),
  /** Formas decorativas (máximo 30 por sección). */
  shapes: z.array(shapeSchema).max(LIMITS_SHAPES).optional(),
};

export const headerSectionSchema = z.object({
  ...sectionBase,
  type: z.literal("header"),
  props: z.object({
    logoText: requiredText(TEXT_LIMITS.logoText),
    links: z.array(navLinkSchema).max(LIMITS.links),
  }),
});

export const heroSectionSchema = z.object({
  ...sectionBase,
  type: z.literal("hero"),
  props: z.object({
    title: requiredText(TEXT_LIMITS.heroTitle),
    subtitle: text(TEXT_LIMITS.heroSubtitle),
    buttonLabel: text(TEXT_LIMITS.buttonLabel),
    buttonHref: optionalHref,
    imageUrl: imageSrc,
    /** Posición del contenido; con imagen, la imagen va al lado contrario. */
    align,
  }),
});

export const textSectionSchema = z.object({
  ...sectionBase,
  type: z.literal("text"),
  props: z.object({
    title: text(TEXT_LIMITS.sectionTitle),
    body: text(TEXT_LIMITS.body),
    align: align.default("left"),
  }),
});

export const imageSectionSchema = z.object({
  ...sectionBase,
  type: z.literal("image"),
  props: z.object({
    src: imageSrc,
    alt: text(TEXT_LIMITS.imageAlt),
    caption: text(TEXT_LIMITS.caption),
  }),
});

export const featuresSectionSchema = z.object({
  ...sectionBase,
  type: z.literal("features"),
  props: z.object({
    title: text(TEXT_LIMITS.sectionTitle),
    items: z
      .array(
        z.object({
          id,
          title: requiredText(TEXT_LIMITS.featureTitle),
          description: text(TEXT_LIMITS.featureDescription),
        }),
      )
      .max(LIMITS.featureItems),
  }),
});

export const footerSectionSchema = z.object({
  ...sectionBase,
  type: z.literal("footer"),
  props: z.object({
    text: text(TEXT_LIMITS.footerText),
    links: z.array(navLinkSchema).max(LIMITS.links),
  }),
});

export const sectionSchema = z.discriminatedUnion("type", [
  headerSectionSchema,
  heroSectionSchema,
  textSectionSchema,
  imageSectionSchema,
  featuresSectionSchema,
  footerSectionSchema,
]);

// ---------------------------------------------------------------------------
// Documento
// ---------------------------------------------------------------------------

export const pageDocumentSchema = z
  .object({
    version: z.literal(PAGE_MODEL_VERSION),
    meta: z.object({
      /** Título de la pestaña del navegador y de buscadores. */
      title: text(TEXT_LIMITS.metaTitle),
      /** Descripción para buscadores y redes sociales. */
      description: text(TEXT_LIMITS.metaDescription),
    }),
    theme: themeSchema,
    sections: z.array(sectionSchema).max(LIMITS.sections),
  })
  .superRefine((doc, ctx) => {
    const seen = new Set<string>();
    doc.sections.forEach((section, index) => {
      if (seen.has(section.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["sections", index, "id"],
          message: `Id de sección duplicado: ${section.id}`,
        });
      }
      seen.add(section.id);
    });
  });

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type PageDocument = z.infer<typeof pageDocumentSchema>;
export type PageTheme = z.infer<typeof themeSchema>;
export type FontFamily = z.infer<typeof fontFamily>;
export type Section = z.infer<typeof sectionSchema>;
export type SectionType = Section["type"];
export type SectionOfType<T extends SectionType> = Extract<Section, { type: T }>;
export type NavLink = z.infer<typeof navLinkSchema>;
export type Alignment = (typeof ALIGNMENTS)[number];
export type FeatureItem = SectionOfType<"features">["props"]["items"][number];
export type ElementStyle = z.infer<typeof elementStyleSchema>;
export type FreePosition = z.infer<typeof freePositionSchema>;
export type SectionLayout = z.infer<typeof sectionLayoutSchema>;
export type FreeLayout = NonNullable<SectionLayout["free"]>;
