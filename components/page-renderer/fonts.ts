import localFont from "next/font/local";

import type { FontFamily } from "@/lib/page-model/schema";

// Fuentes incluidas en el proyecto (paquetes @fontsource) en lugar de
// next/font/google: así ni la compilación ni el servidor de desarrollo
// dependen de descargar nada de Google, y el visitante tampoco.
// Solo el subconjunto "latin" (incluye tildes, ñ, ¿ y ¡).

const inter = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-page-inter",
  fallback: ["system-ui", "sans-serif"],
});

const montserrat = localFont({
  src: "../../node_modules/@fontsource-variable/montserrat/files/montserrat-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-page-montserrat",
  fallback: ["system-ui", "sans-serif"],
});

const playfair = localFont({
  src: "../../node_modules/@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2",
  weight: "400 900",
  variable: "--font-page-playfair",
  fallback: ["Georgia", "serif"],
});

const merriweather = localFont({
  src: "../../node_modules/@fontsource-variable/merriweather/files/merriweather-latin-wght-normal.woff2",
  weight: "300 900",
  variable: "--font-page-merriweather",
  fallback: ["Georgia", "serif"],
});

const poppins = localFont({
  src: [
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-400-normal.woff2", weight: "400" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-600-normal.woff2", weight: "600" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-page-poppins",
  fallback: ["system-ui", "sans-serif"],
});

const lato = localFont({
  src: [
    { path: "../../node_modules/@fontsource/lato/files/lato-latin-400-normal.woff2", weight: "400" },
    { path: "../../node_modules/@fontsource/lato/files/lato-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-page-lato",
  fallback: ["system-ui", "sans-serif"],
});

const FONTS = {
  inter,
  poppins,
  montserrat,
  lato,
  "playfair-display": playfair,
  merriweather,
} satisfies Record<FontFamily, { variable: string; style: { fontFamily: string } }>;

/** Clases que definen las variables CSS de todas las fuentes disponibles. */
export const pageFontVariables = Object.values(FONTS)
  .map((font) => font.variable)
  .join(" ");

/** Valor CSS `font-family` de una fuente del modelo. */
export function fontFamilyValue(font: FontFamily): string {
  return FONTS[font].style.fontFamily;
}

/** Nombres para mostrar en el editor. */
export const FONT_LABELS: Record<FontFamily, string> = {
  inter: "Inter",
  poppins: "Poppins",
  montserrat: "Montserrat",
  lato: "Lato",
  "playfair-display": "Playfair Display",
  merriweather: "Merriweather",
};
