import type { Tables } from "./database";

export type Project = Tables<"projects">;

/** Campos que necesita el listado del panel. */
export type ProjectSummary = Pick<Project, "id" | "name" | "slug" | "status" | "updated_at">;
