import type { ElementKey } from "@/lib/page-model/elements";
import type { FreePosition } from "@/lib/page-model/schema";

import { clampPosition } from "./free-layout";

/**
 * Herramientas de alineación de la posición libre.
 * - Un elemento: se alinea respecto a la sección.
 * - Varios: se alinean entre sí (respecto al rectángulo que los contiene).
 *
 * Horizontal en % del ancho del contenido; vertical en píxeles. Como el alto
 * de un elemento suele ser automático, se pasa el alto medido en pantalla.
 */

export type AlignMode = "left" | "center" | "right" | "top" | "middle" | "bottom";
export type DistributeAxis = "horizontal" | "vertical";

export type AlignItem = {
  key: ElementKey;
  position: FreePosition;
  /** Alto real en píxeles. */
  height: number;
};

type Positions = Partial<Record<ElementKey, FreePosition>>;

function bounds(items: AlignItem[]) {
  return {
    left: Math.min(...items.map((i) => i.position.x)),
    right: Math.max(...items.map((i) => i.position.x + i.position.w)),
    top: Math.min(...items.map((i) => i.position.y)),
    bottom: Math.max(...items.map((i) => i.position.y + i.height)),
  };
}

/** Nuevas posiciones al alinear. `sectionHeight` es el alto de la zona de contenido. */
export function alignItems(items: AlignItem[], mode: AlignMode, sectionHeight: number): Positions {
  if (items.length === 0) return {};
  // Un elemento: respecto a la sección. Varios: respecto al grupo.
  const area =
    items.length === 1 ? { left: 0, right: 100, top: 0, bottom: sectionHeight } : bounds(items);

  const result: Positions = {};
  for (const { key, position, height } of items) {
    const next = { ...position };
    switch (mode) {
      case "left":
        next.x = area.left;
        break;
      case "right":
        next.x = area.right - position.w;
        break;
      case "center":
        next.x = (area.left + area.right) / 2 - position.w / 2;
        break;
      case "top":
        next.y = area.top;
        break;
      case "bottom":
        next.y = area.bottom - height;
        break;
      case "middle":
        next.y = (area.top + area.bottom) / 2 - height / 2;
        break;
    }
    result[key] = clampPosition(next);
  }
  return result;
}

/**
 * Reparte los elementos con el mismo espacio entre ellos (3 o más). Los de
 * los extremos no se mueven.
 */
export function distributeItems(items: AlignItem[], axis: DistributeAxis): Positions {
  if (items.length < 3) return {};
  const horizontal = axis === "horizontal";
  const start = (i: AlignItem) => (horizontal ? i.position.x : i.position.y);
  const size = (i: AlignItem) => (horizontal ? i.position.w : i.height);

  const sorted = [...items].sort((a, b) => start(a) - start(b));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const span = start(last) + size(last) - start(first);
  const occupied = sorted.reduce((sum, item) => sum + size(item), 0);
  const gap = (span - occupied) / (sorted.length - 1);

  const result: Positions = {};
  let cursor = start(first);
  for (const item of sorted) {
    const next = { ...item.position };
    if (horizontal) next.x = cursor;
    else next.y = cursor;
    result[item.key] = clampPosition(next);
    cursor += size(item) + gap;
  }
  return result;
}

/** Todos los elementos con el mismo ancho que `reference`. */
export function matchWidths(items: AlignItem[], reference: ElementKey): Positions {
  const target = items.find((i) => i.key === reference);
  if (!target) return {};
  const result: Positions = {};
  for (const { key, position } of items) {
    if (key !== reference) result[key] = clampPosition({ ...position, w: target.position.w });
  }
  return result;
}
