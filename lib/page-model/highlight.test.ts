import { describe, expect, it } from "vitest";

import { splitHighlight } from "./highlight";

describe("splitHighlight", () => {
  it("resalta la frase en medio del texto", () => {
    expect(splitHighlight("Tu lote en el campo, a minutos de la ciudad.", "a minutos")).toEqual([
      { text: "Tu lote en el campo, ", highlight: false },
      { text: "a minutos", highlight: true },
      { text: " de la ciudad.", highlight: false },
    ]);
  });

  it("no distingue mayúsculas y conserva las del texto original", () => {
    expect(splitHighlight("Bienvenido a CASA", "casa")).toEqual([
      { text: "Bienvenido a ", highlight: false },
      { text: "CASA", highlight: true },
    ]);
  });

  it("solo la primera aparición", () => {
    expect(splitHighlight("sol y sol", "sol").filter((p) => p.highlight)).toHaveLength(1);
  });

  it("sin frase o si no aparece, devuelve el texto tal cual", () => {
    expect(splitHighlight("Hola", "")).toEqual([{ text: "Hola", highlight: false }]);
    expect(splitHighlight("Hola", "  ")).toEqual([{ text: "Hola", highlight: false }]);
    expect(splitHighlight("Hola", "adiós")).toEqual([{ text: "Hola", highlight: false }]);
  });
});
