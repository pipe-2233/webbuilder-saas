"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Path } from "@/lib/editor/set-in";
import type { ElementKey } from "@/lib/page-model/elements";
import type { FreeLayout, FreePosition } from "@/lib/page-model/schema";

/**
 * Conecta el renderizador con el editor. Fuera del editor no hay contexto y la
 * página se dibuja como una página normal; dentro, los textos se pueden
 * editar y los elementos seleccionar y mover.
 */
export type PageEditApi = {
  updateField: (sectionId: string, path: Path, value: string) => void;
  /** `additive`: Mayús/Ctrl + clic, añade o quita el elemento de la selección. */
  selectElement: (sectionId: string, key: ElementKey, additive?: boolean) => void;
  selectedSectionId: string | null;
  /** Elemento principal (el último seleccionado). */
  selectedElement: ElementKey | null;
  /** Todos los elementos seleccionados de la sección. */
  selectedElements: ElementKey[];
  /** Vista previa del editor: en "mobile" no se usa la posición libre. */
  device: "desktop" | "mobile";
  setFreeLayout: (sectionId: string, free: FreeLayout) => void;
  setFreePositions: (
    sectionId: string,
    positions: Partial<Record<ElementKey, FreePosition>>,
    minHeight: number,
  ) => void;
  setFreeHeight: (sectionId: string, height: number) => void;
  selectedShapeId: string | null;
  dispatch: React.Dispatch<import("@/lib/editor/reducer").EditorAction>;
};

export const PageEditContext = createContext<PageEditApi | null>(null);

export function usePageEdit(): PageEditApi | null {
  return useContext(PageEditContext);
}

/**
 * Muestra `children` si `value` tiene texto o si se está editando (para poder
 * rellenarlo). En la página publicada, un elemento vacío no se muestra.
 */
export function ShowWhenFilledOrEditing({ value, children }: { value: string; children: ReactNode }) {
  const edit = usePageEdit();
  return value || edit ? children : null;
}
