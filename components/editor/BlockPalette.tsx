"use client";

import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";

import { dragId } from "@/lib/editor/dnd";
import { LIMITS, type SectionType } from "@/lib/page-model/schema";
import { SECTION_INFO, SECTION_TYPES } from "@/lib/page-model/section-info";

import { pointerOnlyListeners } from "./dnd-listeners";

type BlockPaletteProps = {
  disabled: boolean;
  onAdd: (type: SectionType) => void;
};

/** Bloques para añadir: clic para insertarlo, o arrastrar a cualquier hueco de la página. */
export function BlockPalette({ disabled, onAdd }: BlockPaletteProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Añadir bloques</h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          {disabled
            ? `Has alcanzado el máximo de ${LIMITS.sections} secciones.`
            : "Arrástralos a la página o haz clic para añadirlos."}
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-1.5">
        {SECTION_TYPES.map((type) => (
          <li key={type}>
            <PaletteBlock type={type} disabled={disabled} onAdd={onAdd} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PaletteBlock({ type, disabled, onAdd }: { type: SectionType } & BlockPaletteProps) {
  const { setNodeRef, listeners, isDragging } = useDraggable({ id: dragId.palette(type), disabled });
  const info = SECTION_INFO[type];

  return (
    <button
      ref={setNodeRef}
      type="button"
      disabled={disabled}
      onClick={() => onAdd(type)}
      // Solo ratón y táctil: con teclado, Intro/Espacio hacen clic y lo añaden.
      {...pointerOnlyListeners(listeners)}
      className={`flex h-full w-full cursor-grab touch-none flex-col items-start gap-0.5 rounded-md border border-zinc-200 p-2 text-left transition-colors hover:border-blue-500 hover:bg-blue-50 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:hover:bg-blue-950/40 ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <span className="flex w-full items-center justify-between gap-1 text-sm font-medium">
        {info.label}
        <GripVertical className="size-3.5 shrink-0 text-zinc-400" aria-hidden />
      </span>
      <span className="text-xs leading-snug text-zinc-500">{info.description}</span>
    </button>
  );
}
