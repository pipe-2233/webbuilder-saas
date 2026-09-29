"use client";

import { createContext, useContext } from "react";

/** Datos del proyecto que necesitan los paneles del editor (p. ej. para subir imágenes). */
export type EditorContextValue = {
  userId: string;
  projectId: string;
};

export const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditorContext(): EditorContextValue {
  const value = useContext(EditorContext);
  if (!value) throw new Error("useEditorContext debe usarse dentro del Editor.");
  return value;
}
