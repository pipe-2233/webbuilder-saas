import type { ElementKey } from "@/lib/page-model/elements";
import type { FreeLayout, FreePosition } from "@/lib/page-model/schema";

/**
 * Cálculos de la posición libre (escritorio). Horizontalmente se usan
 * porcentajes del ancho del contenido (así se adapta a pantallas de distinto
 * ancho); verticalmente, píxeles.
 */

export const MIN_WIDTH = 5;
export const MIN_HEIGHT = 80;
export const MAX_HEIGHT = 4000;
export const MIN_ELEMENT_HEIGHT = 16;
export const MAX_ELEMENT_HEIGHT = 2000;
const WIDTH_MARGIN_PX = 4;

type Rect = { left: number; top: number; width: number; height: number };

const round1 = (value: number) => Math.round(value * 10) / 10;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Mantiene el elemento dentro del ancho del contenido y con valores válidos. */
export function clampPosition(position: FreePosition): FreePosition {
  const w = round1(clamp(position.w, MIN_WIDTH, 100));
  const x = round1(clamp(position.x, 0, 100 - w));
  const y = Math.round(clamp(position.y, 0, MAX_HEIGHT));
  const result: FreePosition = { x, y, w };
  if (position.h !== undefined) {
    result.h = Math.round(clamp(position.h, MIN_ELEMENT_HEIGHT, MAX_ELEMENT_HEIGHT));
  }
  return result;
}

/** Posición tras arrastrar el elemento `dx`/`dy` píxeles. */
export function movePosition(start: FreePosition, dx: number, dy: number, containerWidth: number): FreePosition {
  if (containerWidth <= 0) return start;
  return clampPosition({ ...start, x: start.x + (dx / containerWidth) * 100, y: start.y + dy });
}

/** Ancho tras arrastrar el borde derecho `dx` píxeles. */
export function resizeWidth(start: FreePosition, dx: number, containerWidth: number): FreePosition {
  if (containerWidth <= 0) return start;
  const w = clamp(start.w + (dx / containerWidth) * 100, MIN_WIDTH, 100 - start.x);
  return clampPosition({ ...start, w });
}

/**
 * Ancho y alto tras arrastrar la esquina inferior derecha `dx`/`dy` píxeles.
 * `startHeight` es el alto actual del elemento en pantalla.
 */
export function resizeBox(
  start: FreePosition,
  dx: number,
  dy: number,
  containerWidth: number,
  startHeight: number,
): FreePosition {
  if (containerWidth <= 0) return start;
  const w = clamp(start.w + (dx / containerWidth) * 100, MIN_WIDTH, 100 - start.x);
  return clampPosition({ ...start, w, h: (start.h ?? startHeight) + dy });
}

/** Alto necesario para que quepa un elemento que acaba en `bottom` px. */
export function heightToFit(current: number, bottom: number): number {
  return clamp(Math.max(current, Math.ceil(bottom + 16)), MIN_HEIGHT, MAX_HEIGHT);
}

export function clampHeight(height: number): number {
  return Math.round(clamp(height, MIN_HEIGHT, MAX_HEIGHT));
}

/**
 * Convierte la colocación actual (en columna) en posiciones libres, midiendo
 * dónde está cada elemento. Así, al mover el primero, los demás no saltan.
 */
export function measureFreeLayout(container: Rect, elements: { key: ElementKey; rect: Rect }[]): FreeLayout {
  const items: FreeLayout["items"] = {};
  let bottom = 0;
  for (const { key, rect } of elements) {
    if (container.width <= 0 || rect.width <= 0) continue;
    // El ancho se redondea hacia arriba y con un pequeño margen: si quedara
    // una fracción de píxel más estrecho, el texto saltaría de línea.
    const w = Math.ceil(((rect.width + WIDTH_MARGIN_PX) / container.width) * 1000) / 10;
    items[key] = clampPosition({
      x: ((rect.left - container.left) / container.width) * 100,
      y: rect.top - container.top,
      w,
    });
    bottom = Math.max(bottom, rect.top - container.top + rect.height);
  }
  return { height: clampHeight(Math.max(container.height, bottom)), items };
}
