import { SECTION_INFO } from "./section-info";
import { pageDocumentSchema, type PageDocument, type SectionType } from "./schema";

export type ParseResult =
  | { success: true; data: PageDocument }
  | { success: false; error: string; path: (string | number)[]; message: string };

/**
 * Valida un valor desconocido (JSON de la base de datos o del cliente) y lo
 * devuelve como `PageDocument` normalizado (textos recortados, colores en
 * minúsculas). Nunca lanza excepciones.
 */
export function parsePageDocument(input: unknown): ParseResult {
  const result = pageDocumentSchema.safeParse(input);
  if (result.success) return { success: true, data: result.data };

  const issue = result.error.issues[0];
  const path = issue.path.filter((key): key is string | number => typeof key !== "symbol");
  const joined = path.join(".");
  return {
    success: false,
    error: joined ? `${joined}: ${issue.message}` : issue.message,
    path,
    message: issue.message,
  };
}

/**
 * Explica un error de validación en lenguaje sencillo, nombrando la sección
 * afectada. Ej.: "Portada: Este campo es obligatorio."
 */
export function describeDocumentError(document: PageDocument): string | null {
  const result = parsePageDocument(document);
  if (result.success) return null;

  const [root, index] = result.path;
  if (root === "sections" && typeof index === "number") {
    const type = document.sections[index]?.type as SectionType | undefined;
    const label = type ? SECTION_INFO[type].label : `Sección ${index + 1}`;
    return `${label}: ${result.message}`;
  }
  if (root === "theme") return `Estilo: ${result.message}`;
  return result.message;
}
