import type { PageTheme } from "./schema";

/** Combinaciones de colores listas para usar desde el editor. */
export const COLOR_PRESETS: { name: string; colors: PageTheme["colors"] }[] = [
  { name: "Clásico", colors: { primary: "#18181b", background: "#ffffff", text: "#18181b", muted: "#71717a" } },
  { name: "Océano", colors: { primary: "#1d4ed8", background: "#f8fafc", text: "#0f172a", muted: "#64748b" } },
  { name: "Café", colors: { primary: "#b45309", background: "#fffbeb", text: "#292524", muted: "#78716c" } },
  { name: "Bosque", colors: { primary: "#15803d", background: "#f7fee7", text: "#1c1917", muted: "#57534e" } },
  { name: "Rosa", colors: { primary: "#be185d", background: "#fff1f2", text: "#1f2937", muted: "#6b7280" } },
  { name: "Noche", colors: { primary: "#a78bfa", background: "#0f172a", text: "#f1f5f9", muted: "#94a3b8" } },
];
