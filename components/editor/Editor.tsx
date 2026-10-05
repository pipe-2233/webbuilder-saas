"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { GripVertical, Monitor, Redo2, Smartphone, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import { useAutosave } from "@/hooks/useAutosave";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { parseDragId, resolveDrop } from "@/lib/editor/dnd";
import { canAddSection, canRedo, canUndo, createEditorState, editorReducer } from "@/lib/editor/reducer";
import type { ElementKey } from "@/lib/page-model/elements";
import type { PageDocument, Section } from "@/lib/page-model/schema";
import { SECTION_INFO } from "@/lib/page-model/section-info";

import { BlockPalette } from "./BlockPalette";
import { Canvas, type Device } from "./Canvas";
import { EditorContext } from "./editor-context";
import { SectionInspector } from "./inspector/SectionInspector";
import { ThemeInspector } from "./inspector/ThemeInspector";
import { SaveIndicator } from "./SaveIndicator";
import { SectionList } from "./SectionList";

type EditorProps = {
  projectId: string;
  userId: string;
  projectName: string;
  initialDocument: PageDocument;
};

type Tab = "sections" | "edit" | "style";

const TABS: { id: Tab; label: string }[] = [
  { id: "sections", label: "Secciones" },
  { id: "edit", label: "Editar" },
  { id: "style", label: "Estilo" },
];

export function Editor({ projectId, userId, projectName, initialDocument }: EditorProps) {
  const [state, dispatch] = useReducer(editorReducer, initialDocument, createEditorState);
  const { document, selectedId, selectedElement, selectedElements, dirty, revision, savedRevision } = state;
  const [device, setDevice] = useState<Device>("desktop");
  const router = useRouter();

  const markSaved = useCallback((saved: number) => dispatch({ type: "markSaved", revision: saved }), []);
  const { status: saveStatus, error: saveError, saveNow } = useAutosave({
    projectId,
    document,
    revision,
    savedRevision,
    onSaved: markSaved,
  });
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("sections");

  const pageRef = useRef<HTMLDivElement>(null);
  const canvasAreaRef = useRef<HTMLElement>(null);
  const listAreaRef = useRef<HTMLDivElement>(null);
  /** La selección vino de un clic en la página (ya está a la vista). */
  const selectedFromCanvas = useRef(false);

  const selectedSection = document.sections.find((s) => s.id === selectedId) ?? null;
  const selectedIndex = selectedSection ? document.sections.indexOf(selectedSection) : -1;

  // Lleva a la vista la sección seleccionada desde la lista, al añadirla o al moverla.
  useEffect(() => {
    if (!selectedId) return;
    if (selectedFromCanvas.current) {
      selectedFromCanvas.current = false;
      return;
    }
    pageRef.current
      ?.querySelector(`[data-editor-section="${selectedId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId, selectedIndex]);

  // Clic en la página: selecciona la sección y abre su panel de edición.
  const selectFromCanvas = useCallback((id: string) => {
    selectedFromCanvas.current = true;
    dispatch({ type: "select", id });
    setTab("edit");
  }, []);

  // Clic en un elemento de la página (título, botón...): se abre su panel.
  const selectElementFromCanvas = useCallback((id: string, key: ElementKey, additive = false) => {
    selectedFromCanvas.current = true;
    dispatch({ type: "selectElement", id, key, additive });
    setTab("edit");
  }, []);

  const editFromList = useCallback((id: string) => {
    dispatch({ type: "select", id });
    setTab("edit");
  }, []);

  // Atajos de teclado: deshacer, rehacer y duplicar la sección seleccionada.
  // Mientras se escribe en un campo o en un texto de la página se dejan al navegador.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        dispatch({ type: "undo" });
      } else if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault();
        dispatch({ type: "redo" });
      } else if (key === "d" && selectedId) {
        event.preventDefault();
        dispatch({ type: "duplicateSection", id: selectedId });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId]);

  // Avisa antes de cerrar o recargar si quedan cambios sin guardar.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const sensors = useSensors(
    // El arrastre empieza al mover 6 px: un clic normal sigue seleccionando.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // En pantallas táctiles, mantener pulsado para arrastrar (deslizar sigue desplazando).
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /**
   * Dónde se soltaría lo que se arrastra:
   * - Puntero sobre la página (o el fondo gris): el hueco entre secciones más cercano.
   * - Puntero sobre la lista lateral (o arrastre con teclado): la fila más cercana.
   * - En cualquier otro sitio: en ninguno (soltar ahí cancela).
   */
  const detectCollision = useMemo<CollisionDetection>(
    () => (args) => {
      const pointer = args.pointerCoordinates;
      const byKind = (kind: string) =>
        args.droppableContainers.filter((c) => parseDragId(c.id)?.kind === kind);

      if (pointer && isInside(pointer, canvasAreaRef.current)) {
        let nearest: { id: string | number; distance: number } | null = null;
        for (const container of byKind("gap")) {
          const rect = args.droppableRects.get(container.id);
          if (!rect) continue;
          const distance = Math.abs(pointer.y - (rect.top + rect.height / 2));
          if (!nearest || distance < nearest.distance) nearest = { id: container.id, distance };
        }
        return nearest ? [{ id: nearest.id }] : [];
      }

      if (!pointer || isInside(pointer, listAreaRef.current, 24)) {
        return closestCenter({ ...args, droppableContainers: byKind("list") });
      }
      return [];
    },
    [],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const action = resolveDrop(
      event.active.id,
      event.over?.id,
      document.sections.map((s) => s.id),
    );
    if (action) dispatch(action);
  }

  const describe = (id: string | number) => describeDragId(id, document.sections);
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Arrastrando ${describe(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${describe(active.id)} sobre ${describe(over.id)}.` : `${describe(active.id)} fuera de una zona válida.`,
    onDragEnd: ({ active, over }) =>
      over ? `${describe(active.id)} soltado en ${describe(over.id)}.` : `Se soltó ${describe(active.id)} sin cambios.`,
    onDragCancel: ({ active }) => `Se canceló el arrastre de ${describe(active.id)}.`,
  };

  return (
    <EditorContext.Provider value={{ userId, projectId }}>
      <DndContext
        id="editor-dnd"
        sensors={sensors}
        collisionDetection={detectCollision}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDragId(null)}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              "Para mover, pulsa espacio o intro, usa las flechas arriba y abajo y vuelve a pulsar espacio o intro para soltar. Escape cancela.",
          },
        }}
      >
        <div className="flex h-dvh flex-col bg-zinc-100 dark:bg-zinc-900">
          <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex min-w-0 items-center gap-4">
              <Link
                href={AUTH_ROUTES.afterLogin}
                onClick={async (event) => {
                  // Guardar lo pendiente antes de volver al panel.
                  if (!dirty) return;
                  event.preventDefault();
                  await saveNow();
                  router.push(AUTH_ROUTES.afterLogin);
                }}
                className="shrink-0 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                ← Mis proyectos
              </Link>
              <h1 className="truncate text-sm font-semibold" title={projectName}>
                {projectName}
              </h1>
            </div>
            <div className="flex min-w-0 items-center gap-4">
              <SaveIndicator status={saveStatus} error={saveError} onRetry={() => void saveNow()} />
              <div className="flex shrink-0 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800">
                <button
                  type="button"
                  aria-label="Deshacer (Ctrl+Z)"
                  title="Deshacer (Ctrl+Z)"
                  disabled={!canUndo(state)}
                  onClick={() => dispatch({ type: "undo" })}
                  className="rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-white hover:text-zinc-900 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-950 dark:hover:text-zinc-50"
                >
                  <Undo2 className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Rehacer (Ctrl+Y)"
                  title="Rehacer (Ctrl+Y)"
                  disabled={!canRedo(state)}
                  onClick={() => dispatch({ type: "redo" })}
                  className="rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-white hover:text-zinc-900 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-950 dark:hover:text-zinc-50"
                >
                  <Redo2 className="size-4" aria-hidden />
                </button>
              </div>
              <div
                role="radiogroup"
                aria-label="Vista previa"
                className="flex shrink-0 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800"
              >
                {(
                  [
                    { value: "desktop", label: "Escritorio", icon: Monitor },
                    { value: "mobile", label: "Móvil", icon: Smartphone },
                  ] as const
                ).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={device === value}
                    aria-label={`Vista ${label.toLowerCase()}`}
                    title={`Vista ${label.toLowerCase()}`}
                    onClick={() => setDevice(value)}
                    className={`rounded-md p-1.5 transition-colors ${
                      device === value
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                    }`}
                  >
                    <Icon className="size-4" aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <aside className="flex max-h-[45vh] shrink-0 flex-col border-b border-zinc-200 bg-white md:max-h-none md:w-80 md:border-r md:border-b-0 dark:border-zinc-800 dark:bg-zinc-950">
              <div
                role="tablist"
                aria-label="Paneles del editor"
                className="grid shrink-0 grid-cols-3 border-b border-zinc-200 dark:border-zinc-800"
              >
                {TABS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    id={`tab-${id}`}
                    aria-selected={tab === id}
                    aria-controls={`panel-${id}`}
                    onClick={() => setTab(id)}
                    className={`border-b-2 px-2 py-2.5 text-sm font-medium transition-colors ${
                      tab === id
                        ? "border-blue-600 text-zinc-900 dark:text-zinc-50"
                        : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div
                role="tabpanel"
                id={`panel-${tab}`}
                aria-labelledby={`tab-${tab}`}
                className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-3"
              >
                {tab === "sections" && (
                  <>
                    <div ref={listAreaRef} className="flex flex-col gap-2">
                      <SectionList
                        sections={document.sections}
                        selectedId={selectedId}
                        dispatch={dispatch}
                        onEdit={editFromList}
                      />
                    </div>
                    <BlockPalette
                      disabled={!canAddSection(state)}
                      onAdd={(sectionType) => dispatch({ type: "addSection", sectionType })}
                    />
                  </>
                )}
                {tab === "edit" && (
                  <SectionInspector
                    section={selectedSection}
                    selectedElement={selectedElement}
                    selectedElements={selectedElements}
                    selectedShapeId={state.selectedShapeId}
                    theme={document.theme}
                    device={device}
                    dispatch={dispatch}
                  />
                )}
                {tab === "style" && <ThemeInspector theme={document.theme} dispatch={dispatch} />}
              </div>
            </aside>

            <main
              ref={canvasAreaRef}
              className="min-h-0 flex-1 overflow-auto p-4 sm:p-8"
              onClick={(event) => {
                // Clic en el fondo gris (fuera de la página): quita la selección.
                if (event.target === event.currentTarget) dispatch({ type: "select", id: null });
              }}
            >
              <Canvas
                document={document}
                selectedId={selectedId}
                selectedElement={selectedElement}
                selectedElements={selectedElements}
                selectedShapeId={state.selectedShapeId}
                device={device}
                dispatch={dispatch}
                onSelectSection={selectFromCanvas}
                onSelectElement={selectElementFromCanvas}
                pageRef={pageRef}
              />
            </main>
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDragId && <DragChip label={describeDragId(activeDragId, document.sections)} />}
        </DragOverlay>
      </DndContext>
    </EditorContext.Provider>
  );
}

/** Lo que sigue al puntero mientras se arrastra. */
function DragChip({ label }: { label: string }) {
  return (
    <div className="inline-flex cursor-grabbing items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-xl">
      <GripVertical className="size-4" aria-hidden />
      {label}
    </div>
  );
}

function describeDragId(id: string | number, sections: Section[]): string {
  const parsed = parseDragId(id);
  if (!parsed) return "elemento";
  switch (parsed.kind) {
    case "palette":
      return `bloque ${SECTION_INFO[parsed.sectionType].label}`;
    case "gap":
      return `posición ${parsed.index + 1}`;
    case "list":
    case "canvas": {
      const section = sections.find((s) => s.id === parsed.sectionId);
      return section ? SECTION_INFO[section.type].label : "sección";
    }
  }
}

function isInside(point: { x: number; y: number }, element: Element | null, margin = 0): boolean {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return (
    point.x >= rect.left - margin &&
    point.x <= rect.right + margin &&
    point.y >= rect.top - margin &&
    point.y <= rect.bottom + margin
  );
}
