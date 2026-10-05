"use client";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  type SortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, Copy, GripVertical, Pencil, Trash2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

import { dragId, parseDragId } from "@/lib/editor/dnd";
import type { EditorAction } from "@/lib/editor/reducer";
import { SECTION_INFO, sectionSummary } from "@/lib/page-model/section-info";
import type { Section } from "@/lib/page-model/schema";

type SectionListProps = {
  sections: Section[];
  selectedId: string | null;
  dispatch: (action: EditorAction) => void;
  /** Abrir el panel de edición de una sección. */
  onEdit: (id: string) => void;
};

/**
 * Las filas solo se apartan al reordenar la propia lista. Si llega algo de
 * fuera (un bloque nuevo o una sección de la página) se muestra una línea de
 * inserción en su lugar.
 */
const listStrategy: SortingStrategy = (args) =>
  args.activeIndex === -1 ? null : verticalListSortingStrategy(args);

export function SectionList({ sections, selectedId, dispatch, onEdit }: SectionListProps) {
  if (sections.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-sm text-zinc-500">
        La página está vacía. Arrastra un bloque a la página para empezar.
      </p>
    );
  }

  return (
    <SortableContext items={sections.map((s) => dragId.list(s.id))} strategy={listStrategy}>
      <ol className="flex flex-col gap-1.5">
        {sections.map((section, index) => (
          <SectionRow
            key={section.id}
            section={section}
            selected={section.id === selectedId}
            isFirst={index === 0}
            isLast={index === sections.length - 1}
            dispatch={dispatch}
            onEdit={onEdit}
          />
        ))}
      </ol>
    </SortableContext>
  );
}

type SectionRowProps = {
  section: Section;
  selected: boolean;
  isFirst: boolean;
  isLast: boolean;
  dispatch: (action: EditorAction) => void;
  onEdit: (id: string) => void;
};

function SectionRow({ section, selected, isFirst, isLast, dispatch, onEdit }: SectionRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, isOver, active } =
    useSortable({ id: dragId.list(section.id) });

  const label = SECTION_INFO[section.type].label;
  const incomingFromOutside = isOver && active !== null && parseDragId(active.id)?.kind !== "list";

  function remove() {
    if (window.confirm(`¿Eliminar la sección "${label}"? No se puede deshacer.`)) {
      dispatch({ type: "removeSection", id: section.id });
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`group relative flex items-center rounded-lg border bg-white transition-colors dark:bg-zinc-950 ${
        selected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
          : "border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800"
      } ${isDragging ? "z-10 opacity-50 shadow-lg" : ""}`}
    >
      {incomingFromOutside && (
        <span className="pointer-events-none absolute -top-1.5 right-1 left-1 h-1 rounded-full bg-blue-500" aria-hidden />
      )}

      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Arrastrar ${label}`}
        className="shrink-0 cursor-grab touch-none self-stretch rounded-l-lg px-1 text-zinc-400 hover:text-zinc-700 active:cursor-grabbing dark:hover:text-zinc-200"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <button
        type="button"
        onClick={() => dispatch({ type: "select", id: section.id })}
        aria-current={selected ? "true" : undefined}
        className="flex min-w-0 flex-1 flex-col items-start py-2 pr-2 text-left"
      >
        <span className="text-sm font-medium">{label}</span>
        <span className="w-full truncate text-xs text-zinc-500">{sectionSummary(section)}</span>
      </button>

      <div
        className={`flex shrink-0 items-center pr-1 ${selected ? "" : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"}`}
      >
        <IconButton label={`Duplicar ${label} (Ctrl+D)`} onClick={() => dispatch({ type: "duplicateSection", id: section.id })}>
          <Copy className="size-4" />
        </IconButton>
        <IconButton label={`Editar ${label}`} onClick={() => onEdit(section.id)}>
          <Pencil className="size-4" />
        </IconButton>
        <IconButton
          label={`Subir ${label}`}
          disabled={isFirst}
          onClick={() => dispatch({ type: "moveSection", id: section.id, direction: -1 })}
        >
          <ChevronUp className="size-4" />
        </IconButton>
        <IconButton
          label={`Bajar ${label}`}
          disabled={isLast}
          onClick={() => dispatch({ type: "moveSection", id: section.id, direction: 1 })}
        >
          <ChevronDown className="size-4" />
        </IconButton>
        <IconButton label={`Eliminar ${label}`} danger onClick={remove}>
          <Trash2 className="size-4" />
        </IconButton>
      </div>
    </li>
  );
}

function IconButton({
  label,
  danger = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`rounded-md p-1.5 text-zinc-500 transition-colors disabled:pointer-events-none disabled:opacity-30 ${
        danger
          ? "hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950 dark:hover:text-red-300"
          : "hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-700 dark:hover:text-zinc-50"
      }`}
      {...props}
    />
  );
}
