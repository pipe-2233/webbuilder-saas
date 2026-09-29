import { measureFreeLayout } from "@/lib/editor/free-layout";
import type { ElementKey } from "@/lib/page-model/elements";
import type { FreeLayout, Section } from "@/lib/page-model/schema";

export type FreeGeometry = {
  /** Posición libre actual (medida ahora si la sección aún no la usaba). */
  free: FreeLayout;
  /** true si `free` se acaba de medir y hay que guardarla antes de usarla. */
  measured: boolean;
  /** Ancho del contenido en píxeles (referencia de los %). */
  width: number;
  /** Alto real de cada elemento en pantalla. */
  heights: Partial<Record<ElementKey, number>>;
};

/**
 * Lee de la página del editor la geometría de una sección en posición libre.
 * Solo en el navegador (usa el DOM).
 */
export function readFreeGeometry(section: Section): FreeGeometry | null {
  const container = document.querySelector<HTMLElement>(`[data-elements-container="${CSS.escape(section.id)}"]`);
  const content = container?.parentElement;
  if (!container || !content) return null;

  const contentRect = content.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const nodes = [...container.querySelectorAll<HTMLElement>(":scope > [data-element-key]")].map((node) => ({
    key: node.dataset.elementKey as ElementKey,
    rect: node.getBoundingClientRect(),
  }));

  const heights: FreeGeometry["heights"] = {};
  for (const { key, rect } of nodes) heights[key] = rect.height;

  const existing = section.layout?.free;
  if (existing) return { free: existing, measured: false, width: contentRect.width, heights };

  // Medido respecto al ancho completo del contenido, que es el que usa la posición libre.
  const free = measureFreeLayout(
    { left: contentRect.left, width: contentRect.width, top: containerRect.top, height: containerRect.height },
    nodes,
  );
  return { free, measured: true, width: contentRect.width, heights };
}
