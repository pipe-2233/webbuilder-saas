import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ProjectSummary } from "@/types/project";

type Result<T> = { data: T; error: null } | { data: null; error: string };

/**
 * Proyectos del usuario con sesión iniciada, del más reciente al más antiguo.
 * RLS garantiza que solo se devuelvan los suyos.
 */
export async function listProjects(): Promise<Result<ProjectSummary[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, slug, status, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[listProjects]", error.code, error.message);
    return { data: null, error: "No se pudieron cargar tus proyectos. Inténtalo de nuevo." };
  }

  return { data, error: null };
}
