"use client";

import { AlertCircle, Check, Loader2 } from "lucide-react";

import type { SaveStatus } from "@/hooks/useAutosave";

type SaveIndicatorProps = {
  status: SaveStatus;
  error: string | null;
  onRetry: () => void;
};

/** Estado del guardado automático, en la cabecera del editor. */
export function SaveIndicator({ status, error, onRetry }: SaveIndicatorProps) {
  return (
    <div role="status" aria-live="polite" className="flex min-w-0 items-center gap-1.5 text-xs">
      {status === "saved" && (
        <span className="flex items-center gap-1 text-zinc-500">
          <Check className="size-3.5 text-green-600" aria-hidden />
          Guardado
        </span>
      )}
      {status === "pending" && <span className="text-zinc-500">Cambios sin guardar…</span>}
      {status === "saving" && (
        <span className="flex items-center gap-1 text-zinc-500">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Guardando…
        </span>
      )}
      {status === "error" && (
        <span className="flex min-w-0 items-center gap-1.5 text-red-600 dark:text-red-400">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate" title={error ?? undefined}>
            {error}
          </span>
          <button type="button" onClick={onRetry} className="shrink-0 font-medium underline underline-offset-2">
            Reintentar
          </button>
        </span>
      )}
    </div>
  );
}
