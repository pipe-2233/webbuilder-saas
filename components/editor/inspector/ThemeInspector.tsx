"use client";

import { Check } from "lucide-react";

import { FONT_LABELS, fontFamilyValue, pageFontVariables } from "@/components/page-renderer/fonts";
import type { EditorAction } from "@/lib/editor/reducer";
import { FONT_FAMILIES, type FontFamily, type PageTheme } from "@/lib/page-model/schema";
import { COLOR_PRESETS } from "@/lib/page-model/theme-presets";

import { ColorInput, PanelGroup } from "./fields";

type ThemeInspectorProps = {
  theme: PageTheme;
  dispatch: (action: EditorAction) => void;
};

const COLOR_FIELDS: { key: keyof PageTheme["colors"]; label: string; hint: string }[] = [
  { key: "primary", label: "Color principal", hint: "Botones y detalles." },
  { key: "background", label: "Fondo", hint: "Fondo de la página." },
  { key: "text", label: "Texto", hint: "Títulos y párrafos." },
  { key: "muted", label: "Texto secundario", hint: "Subtítulos, descripciones y pie." },
];

/** Panel "Estilo": colores y fuentes de todo el sitio. */
export function ThemeInspector({ theme, dispatch }: ThemeInspectorProps) {
  const setColors = (colors: PageTheme["colors"]) => dispatch({ type: "updateTheme", path: ["colors"], value: colors });

  return (
    <div className={`flex flex-col gap-6 ${pageFontVariables}`}>
      <PanelGroup title="Combinaciones de colores">
        <ul className="grid grid-cols-2 gap-1.5">
          {COLOR_PRESETS.map((preset) => {
            const active = COLOR_FIELDS.every(({ key }) => preset.colors[key] === theme.colors[key]);
            return (
              <li key={preset.name}>
                <button
                  type="button"
                  onClick={() => setColors(preset.colors)}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-2 rounded-md border p-2 text-left text-xs font-medium transition-colors ${
                    active
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                      : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800"
                  }`}
                >
                  <span className="flex shrink-0 overflow-hidden rounded ring-1 ring-black/10" aria-hidden>
                    {[preset.colors.background, preset.colors.primary, preset.colors.text].map((color, i) => (
                      <span key={i} className="block size-4" style={{ backgroundColor: color }} />
                    ))}
                  </span>
                  <span className="truncate">{preset.name}</span>
                  {active && <Check className="ml-auto size-3.5 shrink-0 text-blue-600" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      </PanelGroup>

      <PanelGroup title="Colores">
        {COLOR_FIELDS.map(({ key, label, hint }) => (
          <ColorInput
            key={key}
            label={label}
            hint={hint}
            value={theme.colors[key]}
            onChange={(color) => dispatch({ type: "updateTheme", path: ["colors", key], value: color })}
          />
        ))}
      </PanelGroup>

      <PanelGroup title="Fuentes">
        <FontPicker
          label="Títulos"
          value={theme.fonts.heading}
          sample="Tu gran título"
          weight="font-bold"
          onChange={(font) => dispatch({ type: "updateTheme", path: ["fonts", "heading"], value: font })}
        />
        <FontPicker
          label="Texto"
          value={theme.fonts.body}
          sample="Así se leerán tus párrafos."
          weight="font-normal"
          onChange={(font) => dispatch({ type: "updateTheme", path: ["fonts", "body"], value: font })}
        />
      </PanelGroup>
    </div>
  );
}

type FontPickerProps = {
  label: string;
  value: FontFamily;
  sample: string;
  weight: string;
  onChange: (font: FontFamily) => void;
};

function FontPicker({ label, value, sample, weight, onChange }: FontPickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      <div role="radiogroup" aria-label={`Fuente de ${label.toLowerCase()}`} className="flex flex-col gap-1">
        {FONT_FAMILIES.map((font) => {
          const selected = font === value;
          return (
            <button
              key={font}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(font)}
              className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left transition-colors ${
                selected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                  : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800"
              }`}
            >
              <span className="min-w-0">
                <span className={`block truncate text-base ${weight}`} style={{ fontFamily: fontFamilyValue(font) }}>
                  {sample}
                </span>
                <span className="block text-[11px] text-zinc-500">{FONT_LABELS[font]}</span>
              </span>
              {selected && <Check className="size-4 shrink-0 text-blue-600" aria-hidden />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
