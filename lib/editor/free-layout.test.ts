import { describe, expect, it } from "vitest";

import { SECTION_ELEMENTS } from "@/lib/page-model/elements";
import { SECTION_TYPES } from "@/lib/page-model/section-info";
import type { SectionType } from "@/lib/page-model/schema";

import { clampHeight, clampPosition, heightToFit, measureFreeLayout, movePosition, resizeWidth } from "./free-layout";

describe("clampPosition", () => {
  it("mantiene el elemento dentro del ancho", () => {
    expect(clampPosition({ x: 90, y: 10, w: 30 })).toEqual({ x: 70, y: 10, w: 30 });
    expect(clampPosition({ x: -5, y: -20, w: 200 })).toEqual({ x: 0, y: 0, w: 100 });
    expect(clampPosition({ x: 0, y: 0, w: 1 }).w).toBe(5);
  });

  it("redondea para no guardar decimales infinitos", () => {
    expect(clampPosition({ x: 12.3456, y: 10.6, w: 33.333 })).toEqual({ x: 12.3, y: 11, w: 33.3 });
  });
});

describe("movePosition", () => {
  it("convierte píxeles horizontales en porcentaje del ancho", () => {
    // 100 px en un contenido de 1000 px = 10 %
    expect(movePosition({ x: 10, y: 50, w: 40 }, 100, 30, 1000)).toEqual({ x: 20, y: 80, w: 40 });
  });

  it("no se sale por los bordes", () => {
    expect(movePosition({ x: 50, y: 10, w: 40 }, 5000, -500, 1000)).toEqual({ x: 60, y: 0, w: 40 });
  });

  it("ignora contenedores sin ancho", () => {
    const start = { x: 1, y: 2, w: 30 };
    expect(movePosition(start, 10, 10, 0)).toBe(start);
  });
});

describe("resizeWidth", () => {
  it("cambia el ancho sin pasar del borde derecho", () => {
    expect(resizeWidth({ x: 10, y: 0, w: 30 }, 200, 1000)).toEqual({ x: 10, y: 0, w: 50 });
    expect(resizeWidth({ x: 70, y: 0, w: 20 }, 5000, 1000)).toEqual({ x: 70, y: 0, w: 30 });
    expect(resizeWidth({ x: 10, y: 0, w: 30 }, -5000, 1000).w).toBe(5);
  });
});

describe("alto de la sección", () => {
  it("crece para que quepa el elemento, con margen", () => {
    expect(heightToFit(300, 350)).toBe(366);
    expect(heightToFit(300, 100)).toBe(300);
    expect(clampHeight(10)).toBe(80);
    expect(clampHeight(99999)).toBe(4000);
  });
});

describe("measureFreeLayout", () => {
  it("convierte la colocación actual en posiciones libres", () => {
    const container = { left: 100, top: 200, width: 1000, height: 400 };
    const layout = measureFreeLayout(container, [
      { key: "title", rect: { left: 200, top: 250, width: 600, height: 60 } },
      { key: "button", rect: { left: 450, top: 500, width: 100, height: 48 } },
    ]);
    // Ancho medido + 4 px de margen, redondeado hacia arriba (604 px de 1000 = 60,4 %).
    expect(layout.items.title).toEqual({ x: 10, y: 50, w: 60.4 });
    expect(layout.items.button).toEqual({ x: 35, y: 300, w: 10.4 });
    expect(layout.height).toBe(400);
  });

  it("nunca deja un elemento más estrecho de lo que mide (el texto no salta de línea)", () => {
    const container = { left: 0, top: 0, width: 1024, height: 300 };
    const measured = 617.9; // 60,34 % -> redondear hacia abajo lo estrecharía
    const layout = measureFreeLayout(container, [
      { key: "title", rect: { left: 0, top: 0, width: measured, height: 60 } },
    ]);
    expect((layout.items.title!.w / 100) * container.width).toBeGreaterThanOrEqual(measured);
  });

  it("el alto cubre el elemento más bajo", () => {
    const layout = measureFreeLayout({ left: 0, top: 0, width: 1000, height: 100 }, [
      { key: "title", rect: { left: 0, top: 150, width: 500, height: 80 } },
    ]);
    expect(layout.height).toBe(230);
  });

  it("omite elementos ocultos (sin ancho)", () => {
    const layout = measureFreeLayout({ left: 0, top: 0, width: 1000, height: 300 }, [
      { key: "subtitle", rect: { left: 0, top: 0, width: 0, height: 0 } },
    ]);
    expect(layout.items).toEqual({});
  });
});

describe("elementos por sección", () => {
  it("cubren exactamente los tipos de sección del modelo", () => {
    const check: Record<SectionType, readonly string[]> = SECTION_ELEMENTS;
    expect(Object.keys(check).sort()).toEqual([...SECTION_TYPES].sort());
  });
});
