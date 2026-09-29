"use server";

import { z } from "zod";

import { parsePageDocument } from "@/lib/page-model/parse";
import { createClient } from "@/lib/supabase/server";

export type SaveContentResult = { ok: true; updatedAt: string } | { ok: false; error: string };

const projectIdSchema = z.uuid();

/**
 * Guarda el documento de la página de un proyecto.
 * El contenido llega del navegador, así que se valida por completo aquí.
 * RLS garantiza que solo se puedan modificar proyectos propios.
 */
export async function savePageContent(
  projectId: string,
  content: unknown,
): Promise<SaveContentResult> {
  if (!projectIdSchema.safeParse(projectId).success) {
    return { ok: false, error: "Proyecto no válido." };
  }

  const parsed = parsePageDocument(content);
  if (!parsed.success) {
    return { ok: false, error: `Contenido no válido: ${parsed.error}` };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .update({ content: parsed.data })
    .eq("id", projectId)
    .select("updated_at")
    .maybeSingle();

  if (error) {
    console.error("[savePageContent]", error.code, error.message);
    return { ok: false, error: "No se pudieron guardar los cambios. Inténtalo de nuevo." };
  }
  // Sin fila: el proyecto no existe, no es del usuario o no hay sesión.
  if (!data) return { ok: false, error: "El proyecto no existe o no tienes acceso." };

  return { ok: true, updatedAt: data.updated_at };
}
