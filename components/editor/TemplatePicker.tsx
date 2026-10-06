"use client";

import { LayoutTemplate, X } from "lucide-react";
import { useState } from "react";

import type { EditorAction } from "@/lib/editor/reducer";
import { TEMPLATES } from "@/lib/page-model/templates";

type TemplatePickerProps = {
  siteName: string;
  dispatch: (action: EditorAction) => void;
};

/** "Usar una plantilla": sustituye la página por una plantilla completa (se puede deshacer). */
export function TemplatePicker({ siteName, dispatch }: TemplatePickerProps) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-sm font-medium text-white shadow-sm hover:opacity-90"
      >
        <LayoutTemplate className="size-4" aria-hidden />
        Usar una plantilla
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Plantillas</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar plantillas"
          className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X className="size-4" />
        </button>
      </div>
      <ul className="flex flex-col gap-1.5">
        {TEMPLATES.map((template) => (
          <li key={template.id}>
            <button
              type="button"
              onClick={() => {
                const ok = window.confirm(
                  `¿Usar la plantilla «${template.name}»? Sustituye toda la página actual (puedes deshacerlo con Ctrl+Z).`,
                );
                if (!ok) return;
                dispatch({ type: "replaceDocument", document: template.create(siteName) });
                setOpen(false);
              }}
              className="flex w-full items-start gap-3 rounded-md border border-zinc-200 p-2.5 text-left transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-zinc-800 dark:hover:bg-blue-950/40"
            >
              <span className="mt-0.5 flex shrink-0 overflow-hidden rounded ring-1 ring-black/10" aria-hidden>
                {template.swatch.map((color, i) => (
                  <span key={i} className="block h-8 w-3" style={{ backgroundColor: color }} />
                ))}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{template.name}</span>
                <span className="block text-xs leading-snug text-zinc-500">{template.description}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
