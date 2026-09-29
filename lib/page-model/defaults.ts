import {
  PAGE_MODEL_VERSION,
  type FeatureItem,
  type NavLink,
  type PageDocument,
  type PageTheme,
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
    links: [
      { id: createId(), label: "Inicio", href: "#inicio" },
      { id: createId(), label: "Contacto", href: "#contacto" },
    ],
  }),
  hero: () => ({
    title: "Un título que capte la atención",
    subtitle: "Describe en una o dos frases lo que ofreces y por qué es especial.",
    buttonLabel: "Empezar",
    buttonHref: "#contacto",
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
      { id: createId(), title: "Calidad", description: "Explica tu primera ventaja." },
      { id: createId(), title: "Rapidez", description: "Explica tu segunda ventaja." },
      { id: createId(), title: "Confianza", description: "Explica tu tercera ventaja." },
    ],
  }),
  footer: () => ({
    text: `© ${new Date().getFullYear()} Mi sitio. Todos los derechos reservados.`,
    links: [],
  }),
};

/** Enlace nuevo para el menú o el pie de página. */
export function createNavLink(): NavLink {
  return { id: createId(), label: "Nuevo enlace", href: "#" };
}

/** Elemento nuevo para la sección de características. */
export function createFeatureItem(): FeatureItem {
  return { id: createId(), title: "Nueva característica", description: "Describe esta ventaja." };
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
