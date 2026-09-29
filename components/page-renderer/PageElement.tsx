"use client";

import { GripHorizontal, Move } from "lucide-react";
import {
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react";

import { clampHeight, movePosition, resizeBox, resizeWidth } from "@/lib/editor/free-layout";
import { ELEMENT_LABELS, elementsOf, supportsFreeLayout, type ElementKey } from "@/lib/page-model/elements";
import type { FreeLayout, FreePosition, Section } from "@/lib/page-model/schema";

import { usePageEdit, type PageEditApi } from "./edit-context";
import { WIDTH_CLASS } from "./element-style";
import { readFreeGeometry, type FreeGeometry } from "./free-dom";

/*
 * Colocación de los elementos de una sección:
 * - En columna (móvil, y escritorio si no se han movido): orden, alineación y ancho.
 * - Posición libre (escritorio, a partir de 48rem de ancho): cada elemento en
 *   su x/y/ancho (y alto, si se agrandó desde la esquina). Es CSS puro con
 *   consultas de contenedor, así que la página publicada se ve igual que en el editor.
 */

type ContainerProps = {
  section: Section;
  /** Clases de la colocación en columna. */
  className: string;
  children: ReactNode;
};

/** Contenedor de los elementos de una sección. */
export function ElementsContainer({ section, className, children }: ContainerProps) {
  const edit = usePageEdit();
  const free = section.layout?.free;
  const style = free ? ({ "--free-h": `${free.height}px` } as CSSProperties) : undefined;

  return (
    <div
      data-elements-container={section.id}
      style={style}
      className={`${className} ${free ? "@3xl:relative @3xl:mx-0 @3xl:block @3xl:h-(--free-h) @3xl:max-w-none" : ""}`}
    >
      {children}
      {edit && free && edit.device === "desktop" && edit.selectedSectionId === section.id && (
        <HeightHandle section={section} free={free} edit={edit} />
      )}
    </div>
  );
}

type ElementProps = {
  section: Section;
  elementKey: ElementKey;
  children: ReactNode;
  className?: string;
  /** Tipo de colocación del contenedor, para alinear horizontalmente. */
  flow?: "flex" | "grid";
};

/** Un elemento colocable (título, botón, imagen...). */
export function PageElement({ section, elementKey, children, className, flow = "flex" }: ElementProps) {
  const edit = usePageEdit();
  const style = section.styles?.[elementKey];
  const position = section.layout?.free?.items[elementKey];

  const css: CSSProperties = { order: orderOf(section, elementKey) };
  if (style?.align) {
    const self = { left: "start", center: "center", right: "end" }[style.align];
    if (flow === "flex") css.alignSelf = self;
    else css.justifySelf = self;
  }
  if (position) {
    Object.assign(css, { "--x": `${position.x}%`, "--y": `${position.y}px`, "--w": `${position.w}%` });
    if (position.h !== undefined) Object.assign(css, { "--h": `${position.h}px` });
  }

  const classes = [
    style?.width ? WIDTH_CLASS[style.width] : "",
    position ? "@3xl:absolute @3xl:top-(--y) @3xl:left-(--x) @3xl:m-0 @3xl:w-(--w) @3xl:max-w-none" : "",
    position?.h !== undefined ? "@3xl:h-(--h)" : "",
    className ?? "",
  ].join(" ");

  const dataAttributes = {
    "data-element-key": elementKey,
    "data-free-item": position ? "" : undefined,
    "data-free-sized": position?.h !== undefined ? "" : undefined,
  };

  if (!edit) {
    return (
      <div {...dataAttributes} style={css} className={classes}>
        {children}
      </div>
    );
  }
  return (
    <EditableElement
      section={section}
      elementKey={elementKey}
      edit={edit}
      style={css}
      className={classes}
      dataAttributes={dataAttributes}
    >
      {children}
    </EditableElement>
  );
}

function orderOf(section: Section, key: ElementKey): number {
  const order = section.layout?.order ?? elementsOf(section.type);
  const index = order.indexOf(key);
  return index === -1 ? order.length : index;
}

type EditableElementProps = {
  section: Section;
  elementKey: ElementKey;
  edit: PageEditApi;
  style: CSSProperties;
  className: string;
  dataAttributes: Record<string, string | undefined>;
  children: ReactNode;
};

const KEY_STEP = { x: 1, y: 8 };
const DEFAULT_POSITION: FreePosition = { x: 0, y: 0, w: 50 };

function EditableElement({ section, elementKey, edit, style, className, dataAttributes, children }: EditableElementProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inSection = edit.selectedSectionId === section.id;
  const selected = inSection && edit.selectedElements.includes(elementKey);
  const isPrimary = inSection && edit.selectedElement === elementKey;
  const canMove = selected && edit.device === "desktop" && supportsFreeLayout(section.type);
  const label = ELEMENT_LABELS[elementKey];
  const groupSize = inSection ? edit.selectedElements.length : 0;

  /** Geometría de la sección; si aún no usaba posición libre, la activa con lo medido. */
  function geometry(): FreeGeometry | null {
    const geo = readFreeGeometry(section);
    if (geo?.measured) edit.setFreeLayout(section.id, geo.free);
    return geo;
  }

  /** Elementos que se mueven juntos: todos los seleccionados de esta sección. */
  function movingKeys(): ElementKey[] {
    return edit.selectedElements.includes(elementKey) ? edit.selectedElements : [elementKey];
  }

  /** Aplica posiciones y agranda la sección si algún elemento queda por debajo. */
  function apply(positions: Partial<Record<ElementKey, FreePosition>>, geo: FreeGeometry) {
    let bottom = 0;
    for (const [key, position] of Object.entries(positions) as [ElementKey, FreePosition][]) {
      bottom = Math.max(bottom, position.y + (position.h ?? geo.heights[key] ?? 0));
    }
    edit.setFreePositions(section.id, positions, bottom + 16);
  }

  function startDrag(event: ReactPointerEvent<HTMLElement>, mode: "move" | "width" | "corner") {
    event.preventDefault();
    event.stopPropagation();
    const geo = geometry();
    if (!geo) return;
    const keys = mode === "move" ? movingKeys() : [elementKey];
    const starts = Object.fromEntries(keys.map((key) => [key, geo.free.items[key] ?? DEFAULT_POSITION])) as Record<
      ElementKey,
      FreePosition
    >;
    const startHeight = geo.heights[elementKey] ?? 0;
    const { clientX, clientY, pointerId } = event;
    const handle = event.currentTarget;
    handle.setPointerCapture(pointerId);

    const onMove = (move: PointerEvent) => {
      const dx = move.clientX - clientX;
      const dy = move.clientY - clientY;
      const positions: Partial<Record<ElementKey, FreePosition>> = {};
      for (const key of keys) {
        const start = starts[key];
        positions[key] =
          mode === "move"
            ? movePosition(start, dx, dy, geo.width)
            : mode === "width"
              ? resizeWidth(start, dx, geo.width)
              : resizeBox(start, dx, dy, geo.width, startHeight);
      }
      apply(positions, geo);
    };
    const onEnd = () => {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onEnd);
      handle.removeEventListener("pointercancel", onEnd);
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onEnd);
    handle.addEventListener("pointercancel", onEnd);
  }

  // Flechas del teclado sobre el asa: mover la selección (Mayús = pasos grandes).
  function handleKeyDown(event: KeyboardEvent) {
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    event.stopPropagation();
    const geo = geometry();
    if (!geo) return;
    const factor = event.shiftKey ? 5 : 1;
    const dxPx = (direction[0] * KEY_STEP.x * factor * geo.width) / 100;
    const dyPx = direction[1] * KEY_STEP.y * factor;
    const positions: Partial<Record<ElementKey, FreePosition>> = {};
    for (const key of movingKeys()) {
      positions[key] = movePosition(geo.free.items[key] ?? DEFAULT_POSITION, dxPx, dyPx, geo.width);
    }
    apply(positions, geo);
  }

  const stop = (event: SyntheticEvent) => event.stopPropagation();

  return (
    <div
      ref={ref}
      {...dataAttributes}
      style={style}
      onClick={(event) => {
        event.stopPropagation();
        edit.selectElement(section.id, elementKey, event.shiftKey || event.ctrlKey || event.metaKey);
      }}
      className={`${className} relative rounded-sm ${
        isPrimary
          ? "outline-2 outline-offset-4 outline-violet-500"
          : selected
            ? "outline-2 outline-offset-4 outline-violet-400 outline-dashed"
            : "hover:outline-1 hover:outline-offset-4 hover:outline-violet-400 hover:outline-dashed"
      }`}
    >
      {isPrimary && (
        <div data-editor-ui="" className="absolute -top-8 left-0 z-30 flex items-center gap-1 font-sans" onMouseDown={stop}>
          {canMove ? (
            <button
              type="button"
              aria-label={`Mover ${groupSize > 1 ? `${groupSize} elementos` : label}. Arrastra, o usa las flechas del teclado.`}
              title="Arrastra para mover (o usa las flechas). Mayús + clic en otro elemento para seleccionar varios."
              onPointerDown={(event) => startDrag(event, "move")}
              onKeyDown={handleKeyDown}
              onClick={stop}
              className="flex cursor-move touch-none items-center gap-1 rounded-md bg-violet-600 px-2 py-1 text-xs font-medium whitespace-nowrap text-white shadow"
            >
              <Move className="size-3" aria-hidden />
              {groupSize > 1 ? `${label} + ${groupSize - 1}` : label}
            </button>
          ) : (
            <span className="rounded-md bg-violet-600 px-2 py-1 text-xs font-medium whitespace-nowrap text-white shadow">
              {groupSize > 1 ? `${label} + ${groupSize - 1}` : label}
            </span>
          )}
        </div>
      )}

      {canMove && isPrimary && (
        <>
          <button
            type="button"
            data-editor-ui=""
            aria-label={`Cambiar el ancho de ${label}`}
            title="Arrastra para cambiar el ancho"
            onPointerDown={(event) => startDrag(event, "width")}
            onMouseDown={stop}
            onClick={stop}
            className="absolute top-1/2 -right-3 z-30 h-8 w-2.5 -translate-y-1/2 cursor-ew-resize touch-none rounded-full border-2 border-white bg-violet-600 shadow"
          />
          <button
            type="button"
            data-editor-ui=""
            aria-label={`Cambiar el tamaño de ${label} (ancho y alto)`}
            title="Arrastra la esquina para agrandar o achicar"
            onPointerDown={(event) => startDrag(event, "corner")}
            onMouseDown={stop}
            onClick={stop}
            className="absolute -right-3 -bottom-3 z-30 size-4 cursor-nwse-resize touch-none rounded-sm border-2 border-white bg-violet-600 shadow"
          />
        </>
      )}

      {children}
    </div>
  );
}

/** Asa inferior para cambiar el alto de la zona de contenido en posición libre. */
function HeightHandle({ section, free, edit }: { section: Section; free: FreeLayout; edit: PageEditApi }) {
  function startDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const startY = event.clientY;
    const startHeight = free.height;
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    const onMove = (move: PointerEvent) =>
      edit.setFreeHeight(section.id, clampHeight(startHeight + move.clientY - startY));
    const onEnd = () => {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onEnd);
      handle.removeEventListener("pointercancel", onEnd);
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onEnd);
    handle.addEventListener("pointercancel", onEnd);
  }

  return (
    <button
      type="button"
      data-editor-ui=""
      aria-label="Cambiar el alto de la sección"
      title="Arrastra para cambiar el alto"
      onPointerDown={startDrag}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      className="absolute -bottom-3 left-1/2 z-30 hidden h-6 -translate-x-1/2 cursor-ns-resize touch-none items-center gap-1 rounded-full bg-violet-600 px-3 font-sans text-xs font-medium text-white shadow @3xl:flex"
    >
      <GripHorizontal className="size-3.5" aria-hidden />
      Alto
    </button>
  );
}
