import type { DraggableSyntheticListeners } from "@dnd-kit/core";

/**
 * Listeners de arrastre sin el de teclado: para elementos donde Intro/Espacio
 * ya tienen otra función (seleccionar o añadir). Con teclado se reordena desde
 * la lista lateral.
 */
export function pointerOnlyListeners(listeners: DraggableSyntheticListeners): DraggableSyntheticListeners {
  if (!listeners) return listeners;
  const result = { ...listeners };
  delete result.onKeyDown;
  return result;
}
