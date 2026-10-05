"use client";

import { ArrowLeft } from "lucide-react";

import { usePageEdit } from "@/components/page-renderer/edit-context";
import { SHAPE_LABELS } from "@/components/page-renderer/ShapeElement";
import type { EditorAction } from "@/lib/editor/reducer";
import { type Section, type Shape, type ShapeType } from "@/lib/page-model/schema";

import { ColorInput, PanelGroup, Segmented, TextInput } from "./fields";

type ShapeInspectorProps = {
  section: Section;
  shape: Shape;
  dispatch: (action: EditorAction) => void;
  onBack: () => void;
};

const SHAPE_OPTIONS: { value: ShapeType; label: string }[] = (Object.keys(SHAPE_LABELS) as ShapeType[]).map((type) => ({
  value: type,
  label: SHAPE_LABELS[type]
}));

export function ShapeInspector({ section, shape, dispatch, onBack }: ShapeInspectorProps) {
  const set = (patch: Partial<Shape>) => dispatch({ type: "updateShape", id: section.id, shapeId: shape.id, patch });

  const edit = usePageEdit();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-sm p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          title="Volver a la sección"
        >
          <ArrowLeft className="size-4" aria-hidden />
        </button>
        <div>
          <button type="button" onClick={onBack} className="text-xs text-zinc-500 hover:underline">
            Toda la sección
          </button>
          <h2 className="text-sm font-semibold">Forma decorativa</h2>
        </div>
      </div>

      {edit?.device === "mobile" && (
        <div className="rounded bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          Las formas decorativas solo se muestran en la vista de escritorio para mantener un diseño limpio en dispositivos móviles. Cambia a la vista de escritorio para verlas y ajustarlas.
        </div>
      )}

      <p className="text-xs text-zinc-500">
        Arrastra los bordes de la forma en el lienzo para cambiar su tamaño y posición.
      </p>

      <PanelGroup title="Forma">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Tipo de forma</label>
          <select 
            value={shape.type}
            onChange={(e) => set({ type: e.target.value as ShapeType })}
            className="w-full rounded border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900"
          >
            {SHAPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {shape.type === "custom" && (
          <div className="mt-2">
            <TextInput
              label="Ruta SVG (Path 'd')"
              value={shape.customPath || ""}
              onChange={(customPath) => set({ customPath })}
              placeholder="M 0 0 L 100 0 L 50 100 Z"
              maxLength={2000}
            />
          </div>
        )}
      </PanelGroup>

      <PanelGroup title="Estilo">
        <ColorInput
          label="Color de la forma"
          value={shape.color}
          onChange={(color) => set({ color })}
        />
        
        <div className="flex flex-col gap-1 mt-2">
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Opacidad ({shape.opacity}%)
          </span>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={shape.opacity} 
            onChange={(e) => set({ opacity: Number(e.target.value) })}
            className="w-full accent-blue-600"
          />
        </div>

        <div className="flex flex-col gap-1 mt-4">
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Rotación ({shape.rotation || 0}°)
          </span>
          <input 
            type="range" 
            min="0" 
            max="360" 
            value={shape.rotation || 0} 
            onChange={(e) => set({ rotation: Number(e.target.value) })}
            className="w-full accent-blue-600"
          />
        </div>

        {shape.type === "square" && (
          <div className="mt-4">
            <Segmented<NonNullable<Shape["radius"]>>
              label="Esquinas"
              value={shape.radius ?? "none"}
              options={[
                { value: "none", label: "Recto" },
                { value: "small", label: "Suave" },
                { value: "full", label: "Redondo" },
              ]}
              onChange={(radius) => set({ radius: radius === "none" ? undefined : radius })}
            />
          </div>
        )}
      </PanelGroup>

      <PanelGroup title="Efectos Visuales">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Desenfoque / Resplandor ({shape.blur || 0}px)
          </span>
          <input 
            type="range" 
            min="0" 
            max="50" 
            value={shape.blur || 0} 
            onChange={(e) => set({ blur: Number(e.target.value) })}
            className="w-full accent-blue-600"
          />
        </div>

        <div className="mt-4">
          <Segmented<NonNullable<Shape["shadow"]>>
            label="Sombra Paralela"
            value={shape.shadow ?? "none"}
            options={[
              { value: "none", label: "0" },
              { value: "sm", label: "SM" },
              { value: "md", label: "MD" },
              { value: "lg", label: "LG" },
              { value: "xl", label: "XL" },
            ]}
            onChange={(shadow) => set({ shadow: shadow === "none" ? undefined : shadow })}
          />
        </div>
      </PanelGroup>

      <PanelGroup title="Bordes">
        <ColorInput
          label="Color del borde"
          value={shape.borderColor || ""}
          onChange={(borderColor) => set({ borderColor })}
        />
        <div className="flex flex-col gap-1 mt-2">
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Grosor del borde ({shape.borderWidth || 0}px)
          </span>
          <input 
            type="range" 
            min="0" 
            max="50" 
            value={shape.borderWidth || 0} 
            onChange={(e) => set({ borderWidth: Number(e.target.value) })}
            className="w-full accent-blue-600"
          />
        </div>
      </PanelGroup>

      <PanelGroup title="Capas">
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 rounded border border-zinc-200 py-1.5 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            onClick={() => set({ zIndex: shape.zIndex - 1 })}
          >
            Mover atrás
          </button>
          <button
            type="button"
            className="flex-1 rounded border border-zinc-200 py-1.5 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            onClick={() => set({ zIndex: shape.zIndex + 1 })}
          >
            Mover adelante
          </button>
        </div>
      </PanelGroup>

      <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded bg-red-50 py-2 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/40"
          onClick={() => {
            dispatch({ type: "removeShape", id: section.id, shapeId: shape.id });
          }}
        >
          Borrar forma
        </button>
      </div>
    </div>
  );
}
