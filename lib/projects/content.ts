import "server-only";

import { createBlankPage } from "@/lib/page-model/defaults";
import { parsePageDocument } from "@/lib/page-model/parse";
import type { PageDocument } from "@/lib/page-model/schema";
import { createClient } from "@/lib/supabase/server";

export type ProjectContent = {
  id: string;
  name: string;
  document: PageDocument;
};

type Result<T> = { data: T; error: null } | { data: null; error: string };

/**
 * Carga el documento de la página de un proyecto del usuario actual.
 * - Proyecto sin contenido todavía -> página inicial.
 * - Contenido inválido -> error (no se sustituye en silencio para no perder datos).
 */
export async function getProjectContent(projectId: string): Promise<Result<ProjectContent>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, content")
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    console.error("[getProjectContent]", error.code, error.message);
    return { data: null, error: "No se pudo cargar el proyecto." };
  }
  if (!data) return { data: null, error: "El proyecto no existe o no tienes acceso." };

  if (data.content === null) {
    return { data: { id: data.id, name: data.name, document: createBlankPage(data.name) }, error: null };
  }

  const parsed = parsePageDocument(data.content);
  if (!parsed.success) {
    console.error("[getProjectContent] contenido inválido", projectId, parsed.error);
    return { data: null, error: "El contenido de esta página está dañado." };
  }

  return { data: { id: data.id, name: data.name, document: parsed.data }, error: null };
}
