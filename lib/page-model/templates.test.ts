import { describe, expect, it } from "vitest";

import { parsePageDocument } from "./parse";
import { TEMPLATES } from "./templates";

describe("plantillas", () => {
  it.each(TEMPLATES.map((t) => [t.name, t] as const))("«%s» es una página válida", (_name, template) => {
    const doc = template.create("Mi negocio");
    const result = parsePageDocument(JSON.parse(JSON.stringify(doc)));
    if (!result.success) throw new Error(result.error);
    expect(doc.meta.title).toBe("Mi negocio");
  });

  it("cada vez crea ids nuevos (se puede aplicar varias veces)", () => {
    const a = TEMPLATES[0].create("A").sections.map((s) => s.id);
    const b = TEMPLATES[0].create("A").sections.map((s) => s.id);
    expect(a.some((id) => b.includes(id))).toBe(false);
  });

  it("la inmobiliaria tiene las secciones de la página de referencia", () => {
    const types = TEMPLATES.find((t) => t.id === "inmobiliaria")!.create("X").sections.map((s) => s.type);
    expect(types).toEqual(["header", "hero", "stats", "showcase", "cards", "features", "steps", "contact", "footer"]);
  });

  it("los ids de las plantillas son únicos", () => {
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
  });
});
