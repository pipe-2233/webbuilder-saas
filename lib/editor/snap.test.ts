import { describe, expect, it } from "vitest";

import { snapBox } from "./snap";

const area = { width: 1000, height: 400 };

describe("guías magnéticas", () => {
  it("centra horizontalmente si el centro queda cerca del de la sección", () => {
    // Centro del elemento en 497; el de la sección en 500.
    const result = snapBox({ left: 397, top: 100, width: 200, height: 50 }, [], area);
    expect(result.dx).toBe(3);
    expect(result.guides.x).toEqual([500]);
  });

  it("pega el borde izquierdo al de la sección", () => {
    const result = snapBox({ left: 4, top: 100, width: 200, height: 50 }, [], area);
    expect(result.dx).toBe(-4);
    expect(result.guides.x).toEqual([0]);
  });

  it("alinea con el borde de otro elemento", () => {
    const other = { left: 300, top: 20, width: 100, height: 40 };
    // Borde izquierdo del que se mueve en 303 -> se alinea con 300.
    const result = snapBox({ left: 303, top: 200, width: 120, height: 40 }, [other], area);
    expect(result.dx).toBe(-3);
    expect(result.guides.x).toEqual([300]);
  });

  it("alinea verticalmente (arriba, centro o abajo)", () => {
    const other = { left: 0, top: 100, width: 100, height: 60 };
    // Parte de arriba en 98 -> se alinea con la parte de arriba del otro (100).
    const result = snapBox({ left: 500, top: 98, width: 100, height: 30 }, [other], area);
    expect(result.dy).toBe(2);
    expect(result.guides.y).toEqual([100]);
  });

  it("elige el ajuste más cercano", () => {
    const result = snapBox({ left: 2, top: 100, width: 996, height: 50 }, [], area);
    // Izquierda a 2 px de 0, derecha a 2 px de 1000, centro exacto en 500 -> gana el centro (0).
    expect(result.dx).toBe(0);
    expect(result.guides.x).toEqual([500]);
  });

  it("no ajusta si nada está cerca", () => {
    const result = snapBox({ left: 120, top: 77, width: 100, height: 30 }, [], area);
    expect(result).toEqual({ dx: 0, dy: 0, guides: { x: [], y: [] } });
  });
});
