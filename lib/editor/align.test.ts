import { describe, expect, it } from "vitest";

import { alignItems, distributeItems, matchWidths, type AlignItem } from "./align";
import { resizeBox } from "./free-layout";

const title: AlignItem = { key: "title", position: { x: 10, y: 20, w: 40 }, height: 60 };
const button: AlignItem = { key: "button", position: { x: 50, y: 200, w: 20 }, height: 48 };
const subtitle: AlignItem = { key: "subtitle", position: { x: 30, y: 100, w: 30 }, height: 40 };

describe("alinear un elemento respecto a la sección", () => {
  it.each([
    ["left", { x: 0, y: 200 }],
    ["center", { x: 40, y: 200 }],
    ["right", { x: 80, y: 200 }],
    ["top", { x: 50, y: 0 }],
    ["middle", { x: 50, y: 176 }], // (400 - 48) / 2
    ["bottom", { x: 50, y: 352 }], // 400 - 48
  ] as const)("%s", (mode, expected) => {
    expect(alignItems([button], mode, 400).button).toMatchObject(expected);
  });
});

describe("alinear varios elementos entre sí", () => {
  it("a la izquierda del grupo", () => {
    const result = alignItems([title, button], "left", 400);
    expect(result.title?.x).toBe(10);
    expect(result.button?.x).toBe(10);
  });

  it("a la derecha del grupo", () => {
    const result = alignItems([title, button], "right", 400);
    // Borde derecho del grupo: 70 (button: 50 + 20)
    expect(result.title?.x).toBe(30);
    expect(result.button?.x).toBe(50);
  });

  it("centrados horizontalmente", () => {
    const result = alignItems([title, button], "center", 400);
    // Grupo de 10 a 70 -> centro 40
    expect(result.title?.x).toBe(20);
    expect(result.button?.x).toBe(30);
  });

  it("arriba, abajo y al medio (usa el alto real)", () => {
    expect(alignItems([title, button], "top", 400).button?.y).toBe(20);
    // Borde inferior del grupo: 248 (200 + 48)
    expect(alignItems([title, button], "bottom", 400).title?.y).toBe(188);
    // Grupo de 20 a 248 -> centro 134
    const middle = alignItems([title, button], "middle", 400);
    expect(middle.title?.y).toBe(104);
    expect(middle.button?.y).toBe(110);
  });

  it("no cambia el ancho", () => {
    expect(alignItems([title, button], "right", 400).title?.w).toBe(40);
  });
});

describe("distribuir", () => {
  it("necesita al menos 3 elementos", () => {
    expect(distributeItems([title, button], "vertical")).toEqual({});
  });

  it("verticalmente, con el mismo espacio entre ellos", () => {
    const result = distributeItems([button, title, subtitle], "vertical");
    // De 20 a 248: ocupan 60+40+48 = 148, huecos de (228-148)/2 = 40
    expect(result.title?.y).toBe(20);
    expect(result.subtitle?.y).toBe(120);
    expect(result.button?.y).toBe(200);
  });

  it("horizontalmente", () => {
    const a: AlignItem = { key: "title", position: { x: 0, y: 0, w: 20 }, height: 10 };
    const b: AlignItem = { key: "subtitle", position: { x: 25, y: 0, w: 20 }, height: 10 };
    const c: AlignItem = { key: "button", position: { x: 80, y: 0, w: 20 }, height: 10 };
    const result = distributeItems([a, b, c], "horizontal");
    // De 0 a 100, ocupan 60 -> huecos de 20
    expect(result.subtitle?.x).toBe(40);
    expect(result.title?.x).toBe(0);
    expect(result.button?.x).toBe(80);
  });
});

describe("igualar ancho", () => {
  it("todos toman el ancho del elemento de referencia", () => {
    const result = matchWidths([title, button], "title");
    expect(result.button?.w).toBe(40);
    expect(result.title).toBeUndefined();
  });
});

describe("agrandar desde la esquina", () => {
  it("cambia ancho y alto a la vez", () => {
    expect(resizeBox({ x: 10, y: 0, w: 20 }, 100, 30, 1000, 48)).toEqual({ x: 10, y: 0, w: 30, h: 78 });
  });

  it("parte del alto fijo si ya lo tenía", () => {
    expect(resizeBox({ x: 10, y: 0, w: 20, h: 100 }, 0, -20, 1000, 48).h).toBe(80);
  });

  it("respeta los mínimos", () => {
    const result = resizeBox({ x: 10, y: 0, w: 20 }, -5000, -5000, 1000, 48);
    expect(result.w).toBe(5);
    expect(result.h).toBe(16);
  });
});
