import { z } from "zod";

import { ENTRANCE_KEYS, HOVER_KEYS, LOOP_KEYS } from "./animations";
import { BUTTON_ICON_KEYS, FEATURE_ICON_KEYS } from "./icons";
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
  stats: 6,
  specs: 10,
  cards: 18,
  steps: 12,
  chips: 6,
} as const;

/** Longitud máxima de cada texto. El editor usa los mismos límites. */
export const TEXT_LIMITS = {
  metaTitle: 70,
  metaDescription: 160,
  logoText: 60,
  linkLabel: 40,
  heroTitle: 120,
  eyebrow: 80,
  heroSubtitle: 300,
  buttonLabel: 40,
  sectionTitle: 120,
  body: 5000,
  imageAlt: 200,
  caption: 200,
  featureTitle: 80,
  featureDescription: 300,
  footerText: 200,
  statValue: 20,
  statLabel: 60,
  specLabel: 40,
  specValue: 80,
  price: 60,
  chip: 30,
  phone: 30,
  note: 300,
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

/**
 * Objeto por elemento (estilos, posiciones) tolerante: las claves de elementos
 * desconocidos (de una versión anterior o posterior del editor) se ignoran en
 * lugar de invalidar toda la página.
 */
function byElement<T extends z.ZodType>(value: T) {
  return z.record(z.string(), z.unknown()).transform((record, ctx) => {
    const result: Partial<Record<(typeof ELEMENT_KEYS)[number], z.output<T>>> = {};
    for (const [key, item] of Object.entries(record)) {
      if (!(ELEMENT_KEYS as readonly string[]).includes(key)) continue;
      const parsed = value.safeParse(item);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) ctx.addIssue({ ...issue, path: [key, ...issue.path] });
        continue;
      }
      result[key as (typeof ELEMENT_KEYS)[number]] = parsed.data;
    }
    return result;
  });
}

/** Número que, si viene fuera de rango (datos antiguos), se ajusta en vez de fallar. */
const clampedNumber = (min: number, max: number) =>
  z.number().transform((value) => Math.min(Math.max(value, min), max));

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
      items: byElement(freePositionSchema),
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
  zIndex: clampedNumber(-100, 100).transform(Math.round).default(0),
  rotation: clampedNumber(-360, 360).default(0).optional(),
  borderWidth: clampedNumber(0, 50).default(0).optional(),
  borderColor: hexColor.optional(),
  customPath: z.string().max(2000).optional(),
  blur: clampedNumber(0, 50).optional(),
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
  /** Capa oscura sobre la imagen de fondo (0-90 %), para que el texto se lea. */
  backgroundOverlay: z.number().min(0).max(90).optional(),
  /** Texto claro (blanco) en la sección, para fondos oscuros o con foto. */
  lightText: z.boolean().optional(),
  /** Estilo propio de cada elemento de la sección. */
  styles: byElement(elementStyleSchema).optional(),
  layout: sectionLayoutSchema.optional(),
  /** Formas decorativas (máximo 30 por sección). */
  shapes: z.array(shapeSchema).max(LIMITS_SHAPES).optional(),
};

export const headerSectionSchema = z.object({
  ...sectionBase,
  type: z.literal("header"),
  props: z.object({
    logoText: requiredText(TEXT_LIMITS.logoText),
    /** Logo como imagen (opcional); se muestra junto al nombre. */
    logoImage: imageSrc.default(""),
    links: z.array(navLinkSchema).max(LIMITS.links),
  }),
});

export const heroSectionSchema = z.object({
  ...sectionBase,
  type: z.literal("hero"),
  props: z.object({
    /** Texto pequeño sobre el título (p. ej. "TULUÁ · VALLE DEL CAUCA"). */
    eyebrow: text(TEXT_LIMITS.eyebrow).default(""),
    title: requiredText(TEXT_LIMITS.heroTitle),
    /** Palabras del título que se pintan con el color principal. */
    highlight: text(TEXT_LIMITS.heroTitle).default(""),
    subtitle: text(TEXT_LIMITS.heroSubtitle),
    buttonLabel: text(TEXT_LIMITS.buttonLabel),
    buttonHref: optionalHref,
    buttonIcon: z.enum(BUTTON_ICON_KEYS).default("none"),
    /** Segundo botón (con borde). Vacío = no se muestra. */
    secondaryLabel: text(TEXT_LIMITS.buttonLabel).default(""),
    secondaryHref: optionalHref.default(""),
    secondaryIcon: z.enum(BUTTON_ICON_KEYS).default("none"),
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
          icon: z.enum(FEATURE_ICON_KEYS).default("none"),
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

/** Cabecera común de las secciones nuevas: antetítulo, título y descripción. */
const sectionIntro = {
  eyebrow: text(TEXT_LIMITS.eyebrow),
  title: text(TEXT_LIMITS.sectionTitle),
  subtitle: text(TEXT_LIMITS.heroSubtitle),
};

/** Cifras destacadas con contador animado (90 meses, 1.000 m², 5 min...). */
export const statsSectionSchema = z.object({
  ...sectionBase,
  type: z.literal("stats"),
  props: z.object({
    items: z
      .array(
        z.object({
          id,
          /** Número (con o sin separadores): "90", "1.000", "24/7". */
          value: requiredText(TEXT_LIMITS.statValue),
          /** Unidad pegada al número: "m²", "min", "%". */
          suffix: text(TEXT_LIMITS.chip),
          label: text(TEXT_LIMITS.statLabel),
          detail: text(TEXT_LIMITS.statLabel),
        }),
      )
      .max(LIMITS.stats),
  }),
});

/** Proyecto o producto destacado: imagen + texto + ficha de datos + botón. */
export const showcaseSectionSchema = z.object({
  ...sectionBase,
  type: z.literal("showcase"),
  props: z.object({
    ...sectionIntro,
    imageUrl: imageSrc,
    imageSide: z.enum(["left", "right"]),
    specsTitle: text(TEXT_LIMITS.sectionTitle),
    specs: z
      .array(z.object({ id, label: requiredText(TEXT_LIMITS.specLabel), value: text(TEXT_LIMITS.specValue) }))
      .max(LIMITS.specs),
    buttonLabel: text(TEXT_LIMITS.buttonLabel),
    buttonHref: optionalHref,
    buttonIcon: z.enum(BUTTON_ICON_KEYS),
  }),
});

/** Tarjetas de inmuebles o productos: foto, zona, título, precio y etiquetas. */
export const cardsSectionSchema = z.object({
  ...sectionBase,
  type: z.literal("cards"),
  props: z.object({
    ...sectionIntro,
    items: z
      .array(
        z.object({
          id,
          imageUrl: imageSrc,
          /** Zona o categoría, sobre el título ("Chancos · Tuluá"). */
          tag: text(TEXT_LIMITS.chip * 2),
          title: requiredText(TEXT_LIMITS.featureTitle),
          description: text(TEXT_LIMITS.featureDescription),
          price: text(TEXT_LIMITS.price),
          /** Etiquetas pequeñas ("1.000 m²", "Escrituras"). */
          chips: z.array(text(TEXT_LIMITS.chip)).max(LIMITS.chips),
          href: optionalHref,
        }),
      )
      .max(LIMITS.cards),
    /** Nota al final (p. ej. "Los precios pueden cambiar"). */
    note: text(TEXT_LIMITS.note),
  }),
});

/** Lista o recorrido: lugares con tiempos, pasos de un proceso... */
export const stepsSectionSchema = z.object({
  ...sectionBase,
  type: z.literal("steps"),
  props: z.object({
    ...sectionIntro,
    items: z
      .array(
        z.object({
          id,
          title: requiredText(TEXT_LIMITS.featureTitle),
          description: text(TEXT_LIMITS.featureDescription),
          /** Dato a la derecha ("5 min", "Paso 1"). */
          value: text(TEXT_LIMITS.specValue),
        }),
      )
      .max(LIMITS.steps),
  }),
});

/** Contacto: WhatsApp, copiar número y redes. */
export const contactSectionSchema = z.object({
  ...sectionBase,
  type: z.literal("contact"),
  props: z.object({
    ...sectionIntro,
    /** Nombre de quien atiende ("Arles Castaño"). */
    contactName: text(TEXT_LIMITS.logoText),
    /** Teléfono tal como se muestra ("310 654 4931"). */
    phone: text(TEXT_LIMITS.phone),
    /** Prefijo del país para WhatsApp ("57"). */
    countryCode: z.string().trim().regex(/^\d{0,4}$/, "Solo números (ej. 57)."),
    whatsappMessage: text(TEXT_LIMITS.heroSubtitle),
    buttonLabel: text(TEXT_LIMITS.buttonLabel),
    instagram: text(TEXT_LIMITS.logoText),
    email: z.union([z.literal(""), z.email("Correo no válido.")]),
  }),
});

export const sectionSchema = z.discriminatedUnion("type", [
  headerSectionSchema,
  heroSectionSchema,
  textSectionSchema,
  imageSectionSchema,
  featuresSectionSchema,
  footerSectionSchema,
  statsSectionSchema,
  showcaseSectionSchema,
  cardsSectionSchema,
  stepsSectionSchema,
  contactSectionSchema,
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
export type StatItem = SectionOfType<"stats">["props"]["items"][number];
export type SpecItem = SectionOfType<"showcase">["props"]["specs"][number];
export type CardItem = SectionOfType<"cards">["props"]["items"][number];
export type StepItem = SectionOfType<"steps">["props"]["items"][number];
export type FreePosition = z.infer<typeof freePositionSchema>;
export type SectionLayout = z.infer<typeof sectionLayoutSchema>;
export type FreeLayout = NonNullable<SectionLayout["free"]>;
