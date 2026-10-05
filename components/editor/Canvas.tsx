"use client";

import { useDndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { Move } from "lucide-react";
import { useCallback, useMemo, useState, type MouseEvent, type ReactNode, type RefObject } from "react";

import { PageEditContext, type PageEditApi, type SnapGuides } from "@/components/page-renderer/edit-context";
import { PageRenderer } from "@/components/page-renderer/PageRenderer";
import { dragId } from "@/lib/editor/dnd";
import type { EditorAction } from "@/lib/editor/reducer";
import type { ElementKey } from "@/lib/page-model/elements";
import type { PageDocument, Section } from "@/lib/page-model/schema";
import { SECTION_INFO } from "@/lib/page-model/section-info";

import { pointerOnlyListeners } from "./dnd-listeners";

export type Device = "desktop" | "mobile";

type CanvasProps = {
  document: PageDocument;
  selectedId: string | null;
  selectedElement: ElementKey | null;
  selectedElements: ElementKey[];
  selectedShapeId: string | null;
  device: Device;
  dispatch: (action: EditorAction) => void;
  /** Se hizo clic en una sección de la página. */
  onSelectSection: (id: string) => void;
  /** Se hizo clic en un elemento (título, botón...) de la página. */
  onSelectElement: (id: string, key: ElementKey, additive?: boolean) => void;
  /** Contenedor de la página, para desplazarse hasta la sección seleccionada. */
  pageRef: RefObject<HTMLDivElement | null>;
};

/** La página en el editor: secciones seleccionables y arrastrables, con huecos para soltar. */
export function Canvas({
  document,
  selectedId,
  selectedElement,
  selectedElements,
  selectedShapeId,
  device,
  dispatch,
  onSelectSection,
  onSelectElement,
  pageRef,
}: CanvasProps) {
  const { sections } = document;
  // Guías magnéticas que se ven mientras se arrastra un elemento.
  const [guides, setGuides] = useState<SnapGuides | null>(null);

  // Lo que el renderizador necesita para editar: textos, selección y posición libre.
  const editApi = useMemo<PageEditApi>(
    () => ({
      updateField: (id, path, value) => dispatch({ type: "updateSectionField", id, path, value }),
      selectElement: onSelectElement,
      selectedSectionId: selectedId,
      selectedElement,
      selectedElements,
      selectedShapeId,
      device,
      dispatch,
      setFreeLayout: (id, free) => dispatch({ type: "setFreeLayout", id, free }),
      setFreePositions: (id, positions, minHeight, group) =>
        dispatch({ type: "setFreePositions", id, positions, minHeight, group }),
      setFreeHeight: (id, height, group) => dispatch({ type: "setFreeHeight", id, height, group }),
      guides,
      setGuides,
    }),
    [dispatch, onSelectElement, selectedId, selectedElement, selectedElements, selectedShapeId, device, guides],
  );

  const wrapSection = useCallback(
    (section: Section, content: ReactNode) => {
      const index = sections.findIndex((s) => s.id === section.id);
      return (
        <>
          <DropGap index={index} edge={index === 0 ? "start" : "middle"} />
          <EditableSection
            section={section}
            selected={section.id === selectedId}
            onSelect={() => onSelectSection(section.id)}
          >
            {content}
          </EditableSection>
        </>
      );
    },
    [sections, selectedId, onSelectSection],
  );

  // En el lienzo los enlaces no navegan: un clic solo selecciona la sección.
  function blockLinks(event: MouseEvent) {
    if ((event.target as HTMLElement).closest("a")) event.preventDefault();
  }

  return (
    <div
      ref={pageRef}
      onClickCapture={blockLinks}
      className={`mx-auto overflow-hidden bg-white shadow-lg ring-1 ring-black/5 transition-[max-width] ${
        // Escritorio: al menos 48rem, para que se vea la posición libre. Móvil: ancho de teléfono.
        device === "mobile" ? "max-w-[390px] rounded-[2rem]" : "max-w-6xl min-w-3xl rounded-xl"
      }`}
    >
      {sections.length > 0 ? (
        <>
          <PageEditContext.Provider value={editApi}>
            <PageRenderer document={document} wrapSection={wrapSection} />
          </PageEditContext.Provider>
          <DropGap index={sections.length} edge="end" />
        </>
      ) : (
        <EmptyCanvas />
      )}
    </div>
  );
}

/**
 * Hueco entre secciones donde se puede soltar. No ocupa espacio (no mueve la
 * página); su zona de detección es invisible y solo se dibuja una línea
 * mientras se arrastra algo.
 */
function DropGap({ index, edge }: { index: number; edge: "start" | "middle" | "end" }) {
  const { setNodeRef, isOver } = useDroppable({ id: dragId.gap(index) });
  const { active } = useDndContext();
  const dragging = active !== null;

  const linePosition = { start: "top-0", middle: "top-1/2 -translate-y-1/2", end: "bottom-0" }[edge];
  const zonePosition = { start: "top-0", middle: "-top-6", end: "-top-12" }[edge];

  return (
    <div className="relative h-0" aria-hidden>
      <div ref={setNodeRef} className={`pointer-events-none absolute inset-x-0 z-20 h-12 ${zonePosition}`}>
        {dragging && (
          <div
            className={`absolute inset-x-0 flex items-center justify-center transition-all ${linePosition} ${
              isOver ? "h-1 bg-blue-500" : "h-0.5 bg-blue-500/25"
            }`}
          >
            {isOver && (
              <span className="rounded-full bg-blue-500 px-2.5 py-0.5 font-sans text-xs font-medium whitespace-nowrap text-white shadow">
                Soltar aquí
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyCanvas() {
  const { setNodeRef, isOver } = useDroppable({ id: dragId.gap(0) });
  return (
    <div
      ref={setNodeRef}
      className={`m-6 flex min-h-64 items-center justify-center rounded-lg border-2 border-dashed p-8 text-center text-sm transition-colors ${
        isOver ? "border-blue-500 bg-blue-50 text-blue-700" : "border-zinc-300 text-zinc-500"
      }`}
    >
      Arrastra aquí un bloque para empezar tu página.
    </div>
  );
}

type EditableSectionProps = {
  section: Section;
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
};

/**
 * Sección del lienzo: clic para seleccionar, arrastrar para moverla.
 * El arrastre empieza tras mover el ratón unos píxeles, así que un clic normal
 * sigue seleccionando. Con teclado se reordena desde la lista lateral.
 */
function EditableSection({ section, selected, onSelect, children }: EditableSectionProps) {
  const { setNodeRef, listeners, isDragging } = useDraggable({ id: dragId.canvas(section.id) });
  const label = SECTION_INFO[section.type].label;

  return (
    <div
      ref={setNodeRef}
      data-editor-section={section.id}
      role="group"
      tabIndex={0}
      aria-label={`Sección ${label}${selected ? " (seleccionada)" : ""}. Intro para seleccionarla.`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      {...pointerOnlyListeners(listeners)}
      className={`relative cursor-pointer outline-offset-[-2px] transition-opacity focus-visible:outline-2 focus-visible:outline-blue-500 ${
        selected ? "outline-2 outline-blue-500" : "hover:outline-2 hover:outline-dashed hover:outline-blue-400"
      } ${isDragging ? "opacity-30" : ""}`}
    >
      {selected && (
        <span className="pointer-events-none absolute top-0 left-0 z-10 flex items-center gap-1 rounded-br-md bg-blue-500 px-2 py-0.5 font-sans text-xs font-medium text-white">
          <Move className="size-3" aria-hidden />
          {label}
          <span className="font-normal opacity-80">· arrastra para mover</span>
        </span>
      )}
      {children}
    </div>
  );
}
