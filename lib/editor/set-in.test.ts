import { describe, expect, it } from "vitest";

import { setIn } from "./set-in";

describe("setIn", () => {
  const source = { a: { b: [{ c: 1 }, { c: 2 }] }, d: "x" };

  it("cambia un valor anidado sin tocar el original", () => {
    const next = setIn(source, ["a", "b", 1, "c"], 99);
    expect(next.a.b[1].c).toBe(99);
    expect(source.a.b[1].c).toBe(2);
    // Lo que no está en la ruta se reutiliza.
    expect(next.a.b[0]).toBe(source.a.b[0]);
  });

  it("reemplaza un valor completo", () => {
    expect(setIn(source, ["d"], "y").d).toBe("y");
    expect(setIn(source, ["a", "b"], []).a.b).toEqual([]);
  });

  it("ignora rutas que no existen", () => {
    expect(setIn(source, ["z"], 1)).toBe(source);
    expect(setIn(source, ["a", "b", 5, "c"], 1)).toBe(source);
    expect(setIn(source, ["a", "b", "0"], 1)).toBe(source);
    expect(setIn(source, ["d", "x"], 1)).toBe(source);
  });

  it("no copia nada si el valor no cambia", () => {
    expect(setIn(source, ["d"], "x")).toBe(source);
  });
});
