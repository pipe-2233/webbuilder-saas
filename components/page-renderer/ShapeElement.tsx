"use client";

import { Move } from "lucide-react";
import {
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type SyntheticEvent,
} from "react";

import { movePosition, resizeBox, resizeWidth } from "@/lib/editor/free-layout";
import type { FreePosition, Section, Shape, ShapeType } from "@/lib/page-model/schema";

import { usePageEdit } from "./edit-context";
import { readFreeGeometry, type FreeGeometry } from "./free-dom";

type ShapeElementProps = {
  section: Section;
  shape: Shape;
};

const KEY_STEP = { x: 1, y: 8 };

export const SHAPE_LABELS: Record<ShapeType, string> = {
  square: "Cuadrado",
  circle: "CÃ­rculo",
  pill: "PÃ­ldora",
  triangle: "TriÃ¡ngulo",
  star: "Estrella",
  hexagon: "HexÃ¡gono",
  arrow: "Flecha",
  ring: "Aro",
  arch: "Arco",
  custom: "Personalizada",
};

export function ShapeElement({ section, shape }: ShapeElementProps) {
  const edit = usePageEdit();
  const ref = useRef<HTMLDivElement>(null);
  
  const position = shape.position;
  const css: CSSProperties & Record<string, string | number> = {
    "--x": `${position.x}%`,
    "--y": `${position.y}px`,
    "--w": `${position.w}%`,
    zIndex: shape.zIndex,
  };
  if (position.h !== undefined) css["--h"] = `${position.h}px`;

  const baseClasses = "hidden @3xl:block absolute top-(--y) left-(--x) m-0 w-(--w) max-w-none" + (position.h !== undefined ? " h-(--h)" : " h-full");

  const stop = (event: SyntheticEvent) => event.stopPropagation();

  function renderSvgContent() {
    const fill = shape.color;
    const stroke = shape.borderColor || "transparent";
    const strokeWidth = shape.borderWidth || 0;
    
    // Si la forma es hueca o de lÃ­nea, es posible que queramos que fill = "none" en el futuro, pero por ahora usamos el color.
    // Para el Aro, fill="none" por defecto.
    if (shape.type === "ring") {
      return <circle cx="50" cy="50" r={45 - (strokeWidth / 2)} fill="none" stroke={stroke === "transparent" ? fill : stroke} strokeWidth={strokeWidth || 10} vectorEffect="non-scaling-stroke" />;
    }
    
    const props = {
      fill,
      stroke,
      strokeWidth,
      vectorEffect: "non-scaling-stroke"
    };

    switch (shape.type) {
      case "square":
        const rx = shape.radius === "full" ? 50 : shape.radius === "small" ? 10 : 0;
        return <rect x="0" y="0" width="100" height="100" rx={rx} {...props} />;
      case "circle":
        return <circle cx="50" cy="50" r="50" {...props} />;
      case "pill":
        return <rect x="0" y="0" width="100" height="100" rx="50" {...props} />;
      case "triangle":
        return <polygon points="50,0 100,100 0,100" {...props} />;
      case "hexagon":
        return <polygon points="50,0 100,25 100,75 50,100 0,75 0,25" {...props} />;
      case "star":
        return <polygon points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35" {...props} />;
      case "arrow":
        return <polygon points="0,40 60,40 60,20 100,50 60,80 60,60 0,60" {...props} />;
      case "arch":
        return <path d="M 0 100 L 0 50 A 50 50 0 0 1 100 50 L 100 100 Z" {...props} />;
      case "custom":
        if (shape.customPath) {
          return <path d={shape.customPath} {...props} />;
        }
        // Fallback: un cuadrado punteado si no hay path
        return <rect x="0" y="0" width="100" height="100" fill="transparent" stroke={fill} strokeWidth="2" strokeDasharray="5,5" vectorEffect="non-scaling-stroke" />;
      default:
        return <rect x="0" y="0" width="100" height="100" {...props} />;
    }
  }

  const svgContent = (
    <svg 
      viewBox="0 0 100 100" 
      preserveAspectRatio="none"
      className="w-full h-full overflow-visible"
      style={{
        opacity: shape.opacity / 100,
        transform: `rotate(${shape.rotation || 0}deg)`,
        filter: `${shape.blur ? `blur(${shape.blur}px) ` : ""}${shape.shadow && shape.shadow !== "none" ? `drop-shadow(0 ${shape.shadow === "sm" ? "1px 2px" : shape.shadow === "md" ? "4px 6px" : shape.shadow === "lg" ? "10px 15px" : "20px 25px"} rgba(0,0,0,0.2))` : ""}`.trim() || undefined
      }}
    >
      {renderSvgContent()}
    </svg>
  );

  if (!edit) {
    return <div style={css} className={baseClasses}>{svgContent}</div>;
  }

  const selected = edit.selectedShapeId === shape.id;
  const isPrimary = selected;
  const canMove = selected;

  function geometry(): FreeGeometry | null {
    return readFreeGeometry(section);
  }

  function apply(newPos: FreePosition) {
    edit.dispatch({
      type: "updateShape",
      id: section.id,
      shapeId: shape.id,
      patch: { position: newPos },
    });
    const bottom = newPos.y + (newPos.h ?? 0);
    if (section.layout?.free && bottom + 16 > section.layout.free.height) {
      edit.setFreeHeight(section.id, bottom + 16);
    }
  }

  function startDrag(event: ReactPointerEvent<HTMLElement>, mode: "move" | "width" | "corner") {
    event.preventDefault();
    event.stopPropagation();
    const geo = geometry();
    if (!geo) return;
    const start = shape.position;
    const startHeight = position.h ?? (ref.current?.getBoundingClientRect().height || 0);
    const { clientX, clientY, pointerId } = event;
    const handle = event.currentTarget;
    handle.setPointerCapture(pointerId);

    const onMove = (move: PointerEvent) => {
      const dx = move.clientX - clientX;
      const dy = move.clientY - clientY;
      const nextPos =
        mode === "move"
          ? movePosition(start, dx, dy, geo.width)
          : mode === "width"
            ? resizeWidth(start, dx, geo.width)
            : resizeBox(start, dx, dy, geo.width, startHeight);
      apply(nextPos);
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

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!selected) return;
    const geo = geometry();
    if (!geo) return;
    let dx = 0;
    let dy = 0;
    if (event.key === "ArrowLeft") dx = -KEY_STEP.x;
    if (event.key === "ArrowRight") dx = KEY_STEP.x;
    if (event.key === "ArrowUp") dy = -KEY_STEP.y;
    if (event.key === "ArrowDown") dy = KEY_STEP.y;
    if (dx === 0 && dy === 0) return;
    event.preventDefault();
    apply(movePosition(shape.position, dx, dy, geo.width));
  }

  return (
    <div
      ref={ref}
      style={css}
      className={`${baseClasses} relative rounded-sm ${
        isPrimary
          ? "outline-2 outline-offset-4 outline-violet-500"
          : "hover:outline-1 hover:outline-offset-4 hover:outline-violet-400 hover:outline-dashed"
      }`}
      tabIndex={-1}
      onClick={(e) => {
        e.stopPropagation();
        edit.dispatch({ type: "selectShape", id: section.id, shapeId: shape.id });
      }}
      onKeyDown={onKeyDown}
    >
      {isPrimary && (
        <div data-editor-ui="" className="absolute -top-8 left-0 z-30 flex items-center gap-1 font-sans" onMouseDown={stop}>
          <button
            type="button"
            aria-label="Mover forma. Arrastra, o usa las flechas del teclado."
            title="Arrastra para mover (o usa las flechas)."
            onPointerDown={(event) => startDrag(event, "move")}
            onClick={stop}
            className="flex cursor-move touch-none items-center gap-1 rounded-md bg-violet-600 px-2 py-1 text-xs font-medium whitespace-nowrap text-white shadow"
          >
            <Move className="size-3" aria-hidden />
            {SHAPE_LABELS[shape.type]}
          </button>
        </div>
      )}

      {canMove && isPrimary && (
        <>
          <button
            type="button"
            data-editor-ui=""
            title="Arrastra para cambiar el ancho"
            onPointerDown={(event) => startDrag(event, "width")}
            onMouseDown={stop}
            onClick={stop}
            className="absolute top-1/2 -right-3 z-30 h-8 w-2.5 -translate-y-1/2 cursor-ew-resize touch-none rounded-full border-2 border-white bg-violet-600 shadow"
          />
          <button
            type="button"
            data-editor-ui=""
            title="Arrastra la esquina para agrandar o achicar"
            onPointerDown={(event) => startDrag(event, "corner")}
            onMouseDown={stop}
            onClick={stop}
            className="absolute -right-3 -bottom-3 z-30 size-4 cursor-nwse-resize touch-none rounded-sm border-2 border-white bg-violet-600 shadow"
          />
        </>
      )}

      {svgContent}
    </div>
  );
}
