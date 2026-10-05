"use client";

import { ChevronDown, ChevronUp, LayoutGrid, RotateCcw } from "lucide-react";

import type { EditorAction } from "@/lib/editor/reducer";
import { ELEMENT_LABELS, layoutElementsOf, supportsFreeLayout, type ElementKey } from "@/lib/page-model/elements";
import type { Section } from "@/lib/page-model/schema";

import { PanelGroup } from "./fields";

type LayoutPanelProps = {
  section: Section;
  device: "desktop" | "mobile";
  dispatch: (action: EditorAction) => void;
  onSelectElement: (key: ElementKey) => void;
};

/** Elementos de la sección: acceso a cada uno, orden en móvil y posición libre en escritorio. */
export function LayoutPanel({ section, device, dispatch, onSelectElement }: LayoutPanelProps) {
  const elements = layoutElementsOf(section.type);
  const order = section.layout?.order ?? elements;
  const free = section.layout?.free;
  const canBeFree = supportsFreeLayout(section.type);

  function move(index: number, direction: -1 | 1) {
    const next = [...order];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    dispatch({ type: "setElementOrder", id: section.id, order: next });
  }

  return (
    <PanelGroup title="Elementos">
      <p className="text-xs text-zinc-500">
        Elige un elemento para cambiar su fuente, tamaño, color o posición. También puedes hacer clic sobre él en la
        página.
      </p>

      <ol className="flex flex-col gap-1">
        {order.map((key, index) => (
          <li
            key={key}
            className="flex items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-800"
          >
            <button
              type="button"
              onClick={() => onSelectElement(key)}
              className="min-w-0 flex-1 truncate px-2.5 py-1.5 text-left text-sm hover:text-blue-700 dark:hover:text-blue-300"
            >
              {ELEMENT_LABELS[key]}
            </button>
            {canBeFree && (
              <div className="flex shrink-0 pr-1">
                <button
                  type="button"
                  aria-label={`Subir ${ELEMENT_LABELS[key]} en móvil`}
                  title="Subir (orden en móvil)"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="rounded p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
                >
                  <ChevronUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Bajar ${ELEMENT_LABELS[key]} en móvil`}
                  title="Bajar (orden en móvil)"
                  disabled={index === order.length - 1}
                  onClick={() => move(index, 1)}
                  className="rounded p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
                >
                  <ChevronDown className="size-3.5" />
                </button>
              </div>
            )}
          </li>
        ))}
      </ol>

      {canBeFree && (
        <div className="flex flex-col gap-2 rounded-lg bg-zinc-50 p-2.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          <p className="flex items-start gap-1.5">
            <LayoutGrid className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {free
              ? "Posición libre activada en escritorio. En móvil los elementos se colocan en columna con el orden de arriba."
              : device === "desktop"
                ? "Selecciona un elemento y arrastra su asa morada para colocarlo donde quieras (solo en escritorio)."
                : "Cambia a la vista de escritorio para colocar los elementos libremente."}
          </p>
          {free && (
            <button
              type="button"
              onClick={() => dispatch({ type: "setFreeLayout", id: section.id, free: undefined })}
              className="inline-flex items-center gap-1.5 self-start rounded-md border border-zinc-300 bg-white px-2 py-1 font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Volver a la colocación automática
            </button>
          )}
        </div>
      )}
    </PanelGroup>
  );
}
