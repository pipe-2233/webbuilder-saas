import {
  PAGE_MODEL_VERSION,
  type CardItem,
  type SpecItem,
  type StatItem,
  type StepItem,
  type FeatureItem,
  type NavLink,
  type PageDocument,
  type PageTheme,
  type Section,
  type SectionOfType,
  type SectionType,
} from "./schema";

/** Genera un id único para secciones y elementos. */
export function createId(): string {
  return crypto.randomUUID();
}

export const DEFAULT_THEME: PageTheme = {
  colors: {
    primary: "#18181b",
    background: "#ffffff",
    text: "#18181b",
    muted: "#71717a",
  },
  fonts: {
    heading: "inter",
    body: "inter",
  },
};

/** Contenido inicial de cada tipo de sección al añadirla desde el editor. */
const SECTION_FACTORIES: { [T in SectionType]: () => SectionOfType<T>["props"] } = {
  header: () => ({
    logoText: "Mi sitio",
    logoImage: "",
    links: [
      { id: createId(), label: "Inicio", href: "#inicio" },
      { id: createId(), label: "Contacto", href: "#contacto" },
    ],
  }),
  hero: () => ({
    eyebrow: "",
    title: "Un título que capte la atención",
    highlight: "",
    subtitle: "Describe en una o dos frases lo que ofreces y por qué es especial.",
    buttonLabel: "Empezar",
    buttonHref: "#contacto",
    buttonIcon: "none",
    secondaryLabel: "",
    secondaryHref: "",
    secondaryIcon: "none",
    imageUrl: "",
    align: "center",
  }),
  text: () => ({
    title: "Sobre nosotros",
    body: "Escribe aquí tu historia, tu misión o cualquier información importante.",
    align: "left",
  }),
  image: () => ({
    src: "",
    alt: "",
    caption: "",
  }),
  features: () => ({
    title: "Lo que ofrecemos",
    items: [
      { id: createId(), icon: "star", title: "Calidad", description: "Explica tu primera ventaja." },
      { id: createId(), icon: "zap", title: "Rapidez", description: "Explica tu segunda ventaja." },
      { id: createId(), icon: "shield", title: "Confianza", description: "Explica tu tercera ventaja." },
    ],
  }),
  footer: () => ({
    text: `© ${new Date().getFullYear()} Mi sitio. Todos los derechos reservados.`,
    links: [],
  }),
  stats: () => ({
    items: [
      { id: createId(), value: "90", suffix: "", label: "meses de financiación", detail: "" },
      { id: createId(), value: "1.000", suffix: "m²", label: "lotes desde", detail: "" },
      { id: createId(), value: "5", suffix: "min", label: "de la ciudad", detail: "" },
    ],
  }),
  showcase: () => ({
    eyebrow: "Proyecto destacado",
    title: "Nombre del proyecto",
    subtitle: "Cuenta en pocas líneas por qué este proyecto es especial y para quién es.",
    imageUrl: "",
    imageSide: "left",
    specsTitle: "Detalles",
    specs: [
      { id: createId(), label: "Área", value: "1.000 a 1.770 m²" },
      { id: createId(), label: "Precio", value: "Desde $150.000.000" },
      { id: createId(), label: "Financiación", value: "Hasta 90 meses" },
    ],
    buttonLabel: "Pedir información",
    buttonHref: "#contacto",
    buttonIcon: "whatsapp",
  }),
  cards: () => ({
    eyebrow: "Más opciones",
    title: "Nuestros proyectos",
    subtitle: "Escríbenos y te contamos cuáles siguen disponibles.",
    items: [createCard("Proyecto uno"), createCard("Proyecto dos"), createCard("Proyecto tres")],
    note: "",
  }),
  steps: () => ({
    eyebrow: "Dónde estamos",
    title: "Cerca de todo",
    subtitle: "",
    items: [
      { id: createId(), title: "Centro", description: "Punto de partida", value: "0 min" },
      { id: createId(), title: "Primer lugar", description: "Describe este punto", value: "5 min" },
      { id: createId(), title: "Segundo lugar", description: "Describe este punto", value: "15 min" },
    ],
  }),
  contact: () => ({
    eyebrow: "Contáctanos",
    title: "Te ayudamos a encontrar lo que buscas.",
    subtitle: "Escríbenos y te respondemos lo antes posible.",
    contactName: "",
    phone: "",
    countryCode: "57",
    whatsappMessage: "Hola, quiero más información.",
    buttonLabel: "Escribir por WhatsApp",
    instagram: "",
    email: "",
  }),
};

/** Tarjeta nueva para la sección de tarjetas. */
export function createCard(title = "Nueva tarjeta"): CardItem {
  return {
    id: createId(),
    imageUrl: "",
    tag: "Ubicación",
    title,
    description: "Describe este proyecto o producto.",
    price: "Consulta precio",
    chips: [],
    href: "",
  };
}

export function createStat(): StatItem {
  return { id: createId(), value: "10", suffix: "", label: "Nueva cifra", detail: "" };
}

export function createSpec(): SpecItem {
  return { id: createId(), label: "Dato", value: "Valor" };
}

export function createStep(): StepItem {
  return { id: createId(), title: "Nuevo punto", description: "", value: "" };
}

/**
 * Copia de una sección con ids nuevos (la sección, sus enlaces, elementos y
 * formas), para poder tener las dos en la página a la vez.
 */
export function duplicateSection<S extends Section>(section: S): S {
  const copy = structuredClone(section);
  copy.id = createId();
  const props = copy.props as { links?: { id: string }[]; items?: { id: string }[] };
  props.links?.forEach((link) => (link.id = createId()));
  props.items?.forEach((item) => (item.id = createId()));
  (copy.props as { specs?: { id: string }[] }).specs?.forEach((spec) => (spec.id = createId()));
  copy.shapes?.forEach((shape) => (shape.id = createId()));
  return copy;
}

/** Enlace nuevo para el menú o el pie de página. */
export function createNavLink(): NavLink {
  return { id: createId(), label: "Nuevo enlace", href: "#" };
}

/** Elemento nuevo para la sección de características. */
export function createFeatureItem(): FeatureItem {
  return { id: createId(), icon: "check", title: "Nueva característica", description: "Describe esta ventaja." };
}

/** Crea una sección nueva con contenido de ejemplo. */
export function createSection<T extends SectionType>(type: T): SectionOfType<T> {
  // TypeScript no puede relacionar `type` y `props` en una unión genérica;
  // SECTION_FACTORIES ya garantiza que las props corresponden al tipo.
  const section = { id: createId(), type, props: SECTION_FACTORIES[type]() };
  return section as unknown as SectionOfType<T>;
}

/** Página inicial de un proyecto nuevo. */
export function createBlankPage(siteName: string): PageDocument {
  const header = createSection("header");
  header.props.logoText = siteName.slice(0, 60) || "Mi sitio";

  const footer = createSection("footer");
  footer.props.text = `© ${new Date().getFullYear()} ${header.props.logoText}.`.slice(0, 200);

  return {
    version: PAGE_MODEL_VERSION,
    meta: { title: siteName.slice(0, 70), description: "" },
    theme: structuredClone(DEFAULT_THEME),
    sections: [header, createSection("hero"), createSection("features"), footer],
  };
}
