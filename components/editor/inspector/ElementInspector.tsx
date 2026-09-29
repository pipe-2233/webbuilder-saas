"use client";

import { AlignCenter, AlignLeft, AlignRight, ArrowLeft, Bold, Italic, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

import { FONT_LABELS, fontFamilyValue } from "@/components/page-renderer/fonts";
import type { EditorAction } from "@/lib/editor/reducer";
import {
  ELEMENT_LABELS,
  ELEMENT_WIDTHS,
  elementKind,
  RADII,
  supportsFreeLayout,
  TEXT_SIZE_KEYS,
  TEXT_SIZES,
  type ElementKey,
  type ElementWidth,
  type Radius,
} from "@/lib/page-model/elements";
import { FONT_FAMILIES, type Alignment, type ElementStyle, type PageTheme, type Section } from "@/lib/page-model/schema";

import { AlignToolbar } from "./AlignToolbar";
import { ColorInput, PanelGroup, Segmented } from "./fields";

type ElementInspectorProps = {
  section: Section;
  /** Elemento principal: sus valores son los que se muestran. */
  elementKey: ElementKey;
  /** Todos los seleccionados: los cambios de estilo se aplican a todos. */
  selectedKeys: ElementKey[];
  theme: PageTheme;
  device: "desktop" | "mobile";
  dispatch: (action: EditorAction) => void;
  onBack: () => void;
};

const selectClass =
  "w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900";

const ALIGN_OPTIONS: { value: Alignment | "auto"; label: string; icon?: ReactNode }[] = [
  { value: "auto", label: "Auto" },
  { value: "left", label: "", icon: <AlignLeft className="size-3.5" aria-label="Izquierda" /> },
  { value: "center", label: "", icon: <AlignCenter className="size-3.5" aria-label="Centro" /> },
  { value: "right", label: "", icon: <AlignRight className="size-3.5" aria-label="Derecha" /> },
];

/** Panel de un elemento concreto: su fuente, tamaño, color, alineación, ancho... */
export function ElementInspector({
  section,
  elementKey,
  selectedKeys,
  theme,
  device,
  dispatch,
  onBack,
}: ElementInspectorProps) {
  const style: ElementStyle = section.styles?.[elementKey] ?? {};
  const kind = elementKind(elementKey);
  const label = ELEMENT_LABELS[elementKey];
  const many = selectedKeys.length > 1;
  // Con varios seleccionados, el estilo se aplica a todos a la vez.
  const set = (patch: Partial<ElementStyle>) => {
    for (const key of selectedKeys) dispatch({ type: "updateElementStyle", id: section.id, key, patch });
  };
  const hasStyle = Object.keys(style).length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 self-start text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Toda la sección
        </button>
        <div>
          <h2 className="text-sm font-semibold">
            {many ? `${selectedKeys.length} elementos: ${selectedKeys.map((k) => ELEMENT_LABELS[k]).join(", ")}` : label}
          </h2>
          <p className="text-xs text-zinc-500">
            {supportsFreeLayout(section.type)
              ? device === "desktop"
                ? "Arrastra el asa morada para moverlo y el borde derecho para cambiar su ancho."
                : "En móvil los elementos van en columna: cambia el orden en «Toda la sección»."
              : "Personaliza cómo se ve este elemento."}
          </p>
        </div>
      </div>

      <AlignToolbar section={section} keys={selectedKeys} device={device} dispatch={dispatch} />

      {kind !== "image" && (
        <PanelGroup title="Texto">
          <div className="flex flex-col gap-1">
            <label htmlFor="element-font" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Fuente
            </label>
            <select
              id="element-font"
              value={style.font ?? ""}
              onChange={(event) => set({ font: (event.target.value || undefined) as ElementStyle["font"] })}
              className={selectClass}
              style={style.font ? { fontFamily: fontFamilyValue(style.font) } : undefined}
            >
              <option value="">Del sitio ({FONT_LABELS[kind === "text" && isHeading(elementKey) ? theme.fonts.heading : theme.fonts.body]})</option>
              {FONT_FAMILIES.map((font) => (
                <option key={font} value={font}>
                  {FONT_LABELS[font]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="element-size" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Tamaño
            </label>
            <select
              id="element-size"
              value={style.size ?? ""}
              onChange={(event) => set({ size: (event.target.value || undefined) as ElementStyle["size"] })}
              className={selectClass}
            >
              <option value="">Automático</option>
              {TEXT_SIZE_KEYS.map((size) => (
                <option key={size} value={size}>
                  {TEXT_SIZES[size].label} ({Math.round(TEXT_SIZES[size].rem * 16)} px)
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-1.5">
            <Toggle label="Negrita" pressed={style.bold ?? false} onChange={(bold) => set({ bold: bold || undefined })}>
              <Bold className="size-4" aria-hidden />
            </Toggle>
            <Toggle label="Cursiva" pressed={style.italic ?? false} onChange={(italic) => set({ italic: italic || undefined })}>
              <Italic className="size-4" aria-hidden />
            </Toggle>
          </div>

          <OptionalColor
            label="Color del texto"
            value={style.color}
            fallback={theme.colors.text}
            onChange={(color) => set({ color })}
          />
        </PanelGroup>
      )}

      {kind === "button" && (
        <PanelGroup title="Botón">
          <OptionalColor
            label="Color del botón"
            value={style.background}
            fallback={theme.colors.primary}
            onChange={(background) => set({ background })}
          />
          <Segmented<Radius | "auto">
            label="Esquinas"
            value={style.radius ?? "auto"}
            options={[{ value: "auto", label: "Auto" }, ...radiusOptions()]}
            onChange={(radius) => set({ radius: radius === "auto" ? undefined : radius })}
          />
        </PanelGroup>
      )}

      {kind === "image" && (
        <PanelGroup title="Imagen">
          <Segmented<Radius | "auto">
            label="Esquinas"
            value={style.radius ?? "auto"}
            options={[{ value: "auto", label: "Auto" }, ...radiusOptions()]}
            onChange={(radius) => set({ radius: radius === "auto" ? undefined : radius })}
          />
        </PanelGroup>
      )}

      <PanelGroup title={supportsFreeLayout(section.type) ? "Colocación en columna (móvil)" : "Colocación"}>
        <Segmented<Alignment | "auto">
          label="Alineación"
          value={style.align ?? "auto"}
          options={ALIGN_OPTIONS}
          onChange={(align) => set({ align: align === "auto" ? undefined : align })}
        />
        {supportsFreeLayout(section.type) && (
          <Segmented<ElementWidth>
            label="Ancho"
            value={style.width ?? "auto"}
            options={(Object.keys(ELEMENT_WIDTHS) as ElementWidth[]).map((value) => ({
              value,
              label: ELEMENT_WIDTHS[value],
            }))}
            onChange={(width) => set({ width: width === "auto" ? undefined : width })}
          />
        )}
      </PanelGroup>

      {hasStyle && (
        <button
          type="button"
          onClick={() => {
            for (const key of selectedKeys) dispatch({ type: "resetElementStyle", id: section.id, key });
          }}
          className="inline-flex items-center gap-1.5 self-start rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Quitar estilo propio
        </button>
      )}
    </div>
  );
}

function isHeading(key: ElementKey): boolean {
  return key === "title" || key === "logo" || key === "itemTitle";
}

function radiusOptions(): { value: Radius; label: string }[] {
  return (Object.keys(RADII) as Radius[]).map((value) => ({ value, label: RADII[value] }));
}

function Toggle({
  label,
  pressed,
  onChange,
  children,
}: {
  label: string;
  pressed: boolean;
  onChange: (pressed: boolean) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={() => onChange(!pressed)}
      className={`rounded-md border p-1.5 transition-colors ${
        pressed
          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
          : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

/** Color opcional: muestra el del sitio hasta que se elige uno propio. */
function OptionalColor({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string | undefined;
  fallback: string;
  onChange: (color: string | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <ColorInput
        label={label}
        value={value ?? fallback}
        onChange={onChange}
        hint={value ? undefined : "Ahora usa el color del sitio."}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="self-start text-xs text-zinc-600 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Usar el color del sitio
        </button>
      )}
    </div>
  );
}
