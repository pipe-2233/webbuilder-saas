"use client";

import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalDistributeCenter,
  MoveHorizontal,
} from "lucide-react";
import type { ReactNode } from "react";

import { readFreeGeometry } from "@/components/page-renderer/free-dom";
import { alignItems, distributeItems, matchWidths, type AlignItem, type AlignMode } from "@/lib/editor/align";
import type { EditorAction } from "@/lib/editor/reducer";
import { supportsFreeLayout, type ElementKey } from "@/lib/page-model/elements";
import type { FreePosition, Section } from "@/lib/page-model/schema";

import { PanelGroup } from "./fields";

type AlignToolbarProps = {
  section: Section;
  /** Elementos seleccionados; el último es el principal. */
  keys: ElementKey[];
  device: "desktop" | "mobile";
  dispatch: (action: EditorAction) => void;
};

// Iconos: los de lucide describen la posición de los bordes.
const HORIZONTAL: { mode: AlignMode; label: string; icon: ReactNode }[] = [
  { mode: "left", label: "Alinear a la izquierda", icon: <AlignStartVertical className="size-4" aria-hidden /> },
  { mode: "center", label: "Centrar horizontalmente", icon: <AlignCenterVertical className="size-4" aria-hidden /> },
  { mode: "right", label: "Alinear a la derecha", icon: <AlignEndVertical className="size-4" aria-hidden /> },
];
const VERTICAL: { mode: AlignMode; label: string; icon: ReactNode }[] = [
  { mode: "top", label: "Alinear arriba", icon: <AlignStartHorizontal className="size-4" aria-hidden /> },
  { mode: "middle", label: "Centrar verticalmente", icon: <AlignCenterHorizontal className="size-4" aria-hidden /> },
  { mode: "bottom", label: "Alinear abajo", icon: <AlignEndHorizontal className="size-4" aria-hidden /> },
];

/**
 * Alinear y distribuir en posición libre (escritorio).
 * Un elemento se alinea respecto a la sección; varios, entre sí.
 */
export function AlignToolbar({ section, keys, device, dispatch }: AlignToolbarProps) {
  if (!supportsFreeLayout(section.type)) return null;

  const enabled = device === "desktop";
  const many = keys.length > 1;
  const primary = keys.at(-1);

  /** Lee posiciones y altos reales (activando la posición libre si hace falta) y aplica el cambio. */
  function run(compute: (items: AlignItem[], sectionHeight: number) => Partial<Record<ElementKey, FreePosition>>) {
    const geo = readFreeGeometry(section);
    if (!geo) return;
    if (geo.measured) dispatch({ type: "setFreeLayout", id: section.id, free: geo.free });
    const items: AlignItem[] = keys.flatMap((key) => {
      const position = geo.free.items[key];
      return position ? [{ key, position, height: position.h ?? geo.heights[key] ?? 0 }] : [];
    });
    if (items.length === 0) return;
    const positions = compute(items, geo.free.height);
    dispatch({ type: "setFreePositions", id: section.id, positions });
  }

  return (
    <PanelGroup title={many ? `Alinear ${keys.length} elementos` : "Alinear en la sección"}>
      {!enabled ? (
        <p className="text-xs text-zinc-500">Cambia a la vista de escritorio para alinear y distribuir.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            <ToolGroup>
              {HORIZONTAL.map(({ mode, label, icon }) => (
                <ToolButton key={mode} label={label} onClick={() => run((items, h) => alignItems(items, mode, h))}>
                  {icon}
                </ToolButton>
              ))}
            </ToolGroup>
            <ToolGroup>
              {VERTICAL.map(({ mode, label, icon }) => (
                <ToolButton key={mode} label={label} onClick={() => run((items, h) => alignItems(items, mode, h))}>
                  {icon}
                </ToolButton>
              ))}
            </ToolGroup>
          </div>

          {many && (
            <div className="flex flex-wrap gap-1.5">
              <ToolGroup>
                <ToolButton
                  label="Repartir en horizontal (3 o más)"
                  disabled={keys.length < 3}
                  onClick={() => run((items) => distributeItems(items, "horizontal"))}
                >
                  <AlignHorizontalDistributeCenter className="size-4" aria-hidden />
                </ToolButton>
                <ToolButton
                  label="Repartir en vertical (3 o más)"
                  disabled={keys.length < 3}
                  onClick={() => run((items) => distributeItems(items, "vertical"))}
                >
                  <AlignVerticalDistributeCenter className="size-4" aria-hidden />
                </ToolButton>
              </ToolGroup>
              <ToolGroup>
                <ToolButton
                  label="Igualar el ancho al del último seleccionado"
                  onClick={() => primary && run((items) => matchWidths(items, primary))}
                >
                  <MoveHorizontal className="size-4" aria-hidden />
                </ToolButton>
              </ToolGroup>
            </div>
          )}

          <p className="text-xs text-zinc-500">
            {many
              ? "Se alinean entre sí. Arrastra el asa para moverlos juntos."
              : "Mayús + clic (o Ctrl + clic) en otro elemento para seleccionar varios y alinearlos entre sí."}
          </p>
        </>
      )}
    </PanelGroup>
  );
}

function ToolGroup({ children }: { children: ReactNode }) {
  return <div className="flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-800">{children}</div>;
}

function ToolButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
    >
      {children}
    </button>
  );
}
