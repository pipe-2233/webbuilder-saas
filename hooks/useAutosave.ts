"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { describeDocumentError } from "@/lib/page-model/parse";
import type { PageDocument } from "@/lib/page-model/schema";
import { savePageContent } from "@/lib/projects/actions";

export type SaveStatus = "saved" | "pending" | "saving" | "error";

type UseAutosaveOptions = {
  projectId: string;
  document: PageDocument;
  revision: number;
  savedRevision: number;
  /** Se llama cuando la revisión indicada quedó guardada. */
  onSaved: (revision: number) => void;
  /** Espera tras el último cambio antes de guardar (ms). */
  delay?: number;
};

const RETRY_DELAY = 5000;

/**
 * Guardado automático del documento:
 * - Guarda `delay` ms después del último cambio (no en cada tecla).
 * - Nunca hay dos guardados a la vez; si hubo cambios mientras se guardaba,
 *   se vuelve a guardar al terminar.
 * - Si falla la conexión, reintenta cada pocos segundos.
 * - Guarda de inmediato al cambiar de pestaña o cerrar la ventana.
 */
export function useAutosave({ projectId, document, revision, savedRevision, onSaved, delay = 1500 }: UseAutosaveOptions) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latest = useRef({ document, revision, savedRevision });
  const inFlight = useRef<Promise<void> | null>(null);
  const saveAgain = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Referencia a `save` para volver a llamarla desde dentro (reintentos). */
  const saveRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    latest.current = { document, revision, savedRevision };
  }, [document, revision, savedRevision]);

  const save = useCallback((): Promise<void> => {
    if (inFlight.current) {
      saveAgain.current = true;
      return inFlight.current;
    }
    const { document: doc, revision: rev, savedRevision: saved } = latest.current;
    if (rev === saved) return Promise.resolve();

    if (retryTimer.current) clearTimeout(retryTimer.current);

    // Errores de contenido (p. ej. un título obligatorio vacío): se explican
    // sin llamar al servidor y se reintenta con el siguiente cambio.
    const invalid = describeDocumentError(doc);
    if (invalid) {
      setError(`No se puede guardar. ${invalid}`);
      return Promise.resolve();
    }

    setSaving(true);
    const run = (async () => {
      try {
        const result = await savePageContent(projectId, doc);
        if (result.ok) {
          setError(null);
          latest.current = {
            ...latest.current,
            savedRevision: Math.max(latest.current.savedRevision, rev),
          };
          onSaved(rev);
        } else {
          setError(result.error);
        }
      } catch {
        setError("Sin conexión. Reintentando…");
        retryTimer.current = setTimeout(() => void saveRef.current(), RETRY_DELAY);
      } finally {
        inFlight.current = null;
        setSaving(false);
        if (saveAgain.current) {
          saveAgain.current = false;
          void saveRef.current();
        }
      }
    })();
    inFlight.current = run;
    return run;
  }, [projectId, onSaved]);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  // Guardar un poco después del último cambio.
  useEffect(() => {
    if (revision === savedRevision) return;
    const timer = setTimeout(() => void save(), delay);
    return () => clearTimeout(timer);
  }, [revision, savedRevision, save, delay]);

  // Guardar ya al ocultar la página (cambiar de pestaña, cerrar, móvil en segundo plano).
  useEffect(() => {
    const flush = () => {
      if (window.document.visibilityState === "hidden") void save();
    };
    window.document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      window.document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, [save]);

  useEffect(() => () => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
  }, []);

  const status: SaveStatus = error ? "error" : saving ? "saving" : revision !== savedRevision ? "pending" : "saved";

  return { status, error, saveNow: save };
}
