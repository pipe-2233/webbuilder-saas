import type { SectionType } from "@/lib/page-model/schema";
import { SECTION_TYPES } from "@/lib/page-model/section-info";

import { gapToIndex, type EditorAction } from "./reducer";

/**
 * Identificadores de arrastrar y soltar del editor.
 *
 * Qué se puede arrastrar:
 * - `palette:<tipo>`  un bloque nuevo del menú.
 * - `list:<id>`       una sección desde la lista lateral.
 * - `canvas:<id>`     una sección desde la página.
 *
 * Dónde se puede soltar:
 * - `gap:<n>`         un hueco de la página (0 = antes de la primera sección).
 * - `list:<id>`       una fila de la lista (se coloca en su posición).
 */

export const dragId = {
  palette: (type: SectionType) => `palette:${type}`,
  list: (sectionId: string) => `list:${sectionId}`,
  canvas: (sectionId: string) => `canvas:${sectionId}`,
  gap: (index: number) => `gap:${index}`,
};

export type ParsedDragId =
  | { kind: "palette"; sectionType: SectionType }
  | { kind: "list" | "canvas"; sectionId: string }
  | { kind: "gap"; index: number };

export function parseDragId(id: string | number): ParsedDragId | null {
  const value = String(id);
  const separator = value.indexOf(":");
  if (separator === -1) return null;
  const kind = value.slice(0, separator);
  const rest = value.slice(separator + 1);

  switch (kind) {
    case "palette":
      return (SECTION_TYPES as string[]).includes(rest)
        ? { kind, sectionType: rest as SectionType }
        : null;
    case "list":
    case "canvas":
      return rest ? { kind, sectionId: rest } : null;
    case "gap": {
      const index = Number(rest);
      return Number.isInteger(index) && index >= 0 ? { kind, index } : null;
    }
    default:
      return null;
  }
}

/**
 * Traduce "se soltó `active` sobre `over`" en una acción del editor.
 * Devuelve null si el resultado no cambia nada o la combinación no es válida.
 */
export function resolveDrop(
  activeId: string | number,
  overId: string | number | null | undefined,
  sectionIds: string[],
): EditorAction | null {
  if (overId == null) return null;
  const active = parseDragId(activeId);
  const over = parseDragId(overId);
  if (!active || !over) return null;

  // Posición de destino en la lista de secciones.
  let target: number;
  if (over.kind === "gap") {
    target = over.index;
  } else if (over.kind === "list") {
    target = sectionIds.indexOf(over.sectionId);
    if (target === -1) return null;
  } else {
    return null;
  }

  if (active.kind === "palette") {
    return { type: "insertSection", sectionType: active.sectionType, index: target };
  }
  if (active.kind === "list" || active.kind === "canvas") {
    const from = sectionIds.indexOf(active.sectionId);
    if (from === -1) return null;
    // Reordenar dentro de la lista: la sección ocupa la posición de la fila
    // (las filas se apartan para hacerle sitio). En cualquier otro caso se
    // muestra una línea de inserción *antes* del destino, así que se trata
    // como un hueco entre secciones.
    const toIndex = active.kind === "list" && over.kind === "list" ? target : gapToIndex(from, target);
    return toIndex === from ? null : { type: "moveSectionTo", id: active.sectionId, toIndex };
  }
  return null;
}
