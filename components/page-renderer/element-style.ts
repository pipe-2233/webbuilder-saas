import type { CSSProperties } from "react";

import { readableTextColor } from "@/lib/page-model/color";
import { TEXT_SIZES, type ElementWidth, type Radius } from "@/lib/page-model/elements";
import type { ElementStyle } from "@/lib/page-model/schema";

import { fontFamilyValue } from "./fonts";

/**
 * Convierte el estilo propio de un elemento en CSS en línea. Lo que no se
 * indica se deja al diseño de la sección (tema, tamaños por defecto...).
 */
export function textStyle(style: ElementStyle | undefined): CSSProperties | undefined {
  if (!style) return undefined;
  const css: CSSProperties = {};
  if (style.font) css.fontFamily = fontFamilyValue(style.font);
  if (style.size) {
    const { rem } = TEXT_SIZES[style.size];
    // Los tamaños grandes se reducen solos en pantallas estrechas (11 % del
    // ancho de la página, unidad `cqi`), para que un título enorme quepa en un móvil.
    css.fontSize = rem >= 2.25 ? `min(${rem}rem, 11cqi)` : `${rem}rem`;
    css.lineHeight = rem >= 1.875 ? 1.15 : 1.5;
  }
  if (style.color) css.color = style.color;
  if (style.bold !== undefined) css.fontWeight = style.bold ? 700 : 400;
  if (style.italic !== undefined) css.fontStyle = style.italic ? "italic" : "normal";
  if (style.align) css.textAlign = style.align;
  return css;
}

const RADIUS_CSS: Record<Radius, string> = { none: "0", small: "0.5rem", full: "9999px" };

/** Estilo de un botón: texto + fondo + esquinas. Sin color de texto, se elige uno legible. */
export function buttonStyle(style: ElementStyle | undefined): CSSProperties | undefined {
  if (!style) return undefined;
  // La alineación de un botón coloca el botón (no su texto).
  const css: CSSProperties = { ...textStyle({ ...style, align: undefined }) };
  if (style.background) {
    css.backgroundColor = style.background;
    if (!style.color) css.color = readableTextColor(style.background);
  }
  if (style.radius) css.borderRadius = RADIUS_CSS[style.radius];
  return css;
}

/** Estilo de una imagen: esquinas. */
export function imageStyle(style: ElementStyle | undefined): CSSProperties | undefined {
  if (!style?.radius) return undefined;
  return { borderRadius: RADIUS_CSS[style.radius] };
}

/**
 * Ancho de un elemento cuando se colocan en columna. Son clases (no estilo en
 * línea) para que la posición libre de escritorio pueda sustituirlas.
 */
export const WIDTH_CLASS: Record<ElementWidth, string> = {
  auto: "",
  narrow: "w-full max-w-xs",
  medium: "w-full max-w-xl",
  full: "w-full max-w-none",
};
