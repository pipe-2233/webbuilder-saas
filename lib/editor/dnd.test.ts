import { describe, expect, it } from "vitest";

import { dragId, parseDragId, resolveDrop } from "./dnd";

const ids = ["a", "b", "c", "d"];

describe("parseDragId", () => {
  it("interpreta cada tipo de id", () => {
    expect(parseDragId(dragId.palette("hero"))).toEqual({ kind: "palette", sectionType: "hero" });
    expect(parseDragId(dragId.list("x-1"))).toEqual({ kind: "list", sectionId: "x-1" });
    expect(parseDragId(dragId.canvas("x-1"))).toEqual({ kind: "canvas", sectionId: "x-1" });
    expect(parseDragId(dragId.gap(3))).toEqual({ kind: "gap", index: 3 });
  });

  it("conserva ids con dos puntos", () => {
    expect(parseDragId("list:a:b")).toEqual({ kind: "list", sectionId: "a:b" });
  });

  it.each(["", "sin-prefijo", "palette:video", "gap:-1", "gap:1.5", "gap:x", "list:", "otro:a"])(
    "rechaza %j",
    (value) => {
      expect(parseDragId(value)).toBeNull();
    },
  );
});

describe("resolveDrop", () => {
  it("sin destino no hace nada", () => {
    expect(resolveDrop(dragId.palette("text"), null, ids)).toBeNull();
  });

  describe("bloque nuevo desde el menú", () => {
    it("en un hueco de la página: inserta en ese hueco", () => {
      expect(resolveDrop(dragId.palette("image"), dragId.gap(2), ids)).toEqual({
        type: "insertSection",
        sectionType: "image",
        index: 2,
      });
    });

    it("en una fila de la lista: inserta antes de esa fila", () => {
      expect(resolveDrop(dragId.palette("text"), dragId.list("c"), ids)).toEqual({
        type: "insertSection",
        sectionType: "text",
        index: 2,
      });
    });
  });

  describe("sección desde la página", () => {
    it("a un hueco posterior", () => {
      // a al hueco 3 (entre c y d) -> queda en la posición 2
      expect(resolveDrop(dragId.canvas("a"), dragId.gap(3), ids)).toEqual({
        type: "moveSectionTo",
        id: "a",
        toIndex: 2,
      });
    });

    it("a un hueco anterior", () => {
      expect(resolveDrop(dragId.canvas("d"), dragId.gap(0), ids)).toEqual({
        type: "moveSectionTo",
        id: "d",
        toIndex: 0,
      });
    });

    it("sobre una fila de la lista: se coloca antes de esa fila", () => {
      // a antes de c -> queda entre b y c (posición 1)
      expect(resolveDrop(dragId.canvas("a"), dragId.list("c"), ids)).toEqual({
        type: "moveSectionTo",
        id: "a",
        toIndex: 1,
      });
      expect(resolveDrop(dragId.canvas("d"), dragId.list("a"), ids)).toEqual({
        type: "moveSectionTo",
        id: "d",
        toIndex: 0,
      });
    });

    it("a los huecos que la rodean no hace nada", () => {
      expect(resolveDrop(dragId.canvas("b"), dragId.gap(1), ids)).toBeNull();
      expect(resolveDrop(dragId.canvas("b"), dragId.gap(2), ids)).toBeNull();
    });
  });

  describe("sección desde la lista", () => {
    it("sobre otra fila ocupa su posición", () => {
      expect(resolveDrop(dragId.list("a"), dragId.list("c"), ids)).toEqual({
        type: "moveSectionTo",
        id: "a",
        toIndex: 2,
      });
    });

    it("sobre sí misma no hace nada", () => {
      expect(resolveDrop(dragId.list("b"), dragId.list("b"), ids)).toBeNull();
    });

    it("también puede soltarse en un hueco de la página", () => {
      expect(resolveDrop(dragId.list("a"), dragId.gap(4), ids)).toEqual({
        type: "moveSectionTo",
        id: "a",
        toIndex: 3,
      });
    });
  });

  it("ignora secciones que ya no existen", () => {
    expect(resolveDrop(dragId.canvas("z"), dragId.gap(0), ids)).toBeNull();
    expect(resolveDrop(dragId.palette("text"), dragId.list("z"), ids)).toBeNull();
  });

  it("no se puede soltar sobre algo que no es destino", () => {
    expect(resolveDrop(dragId.canvas("a"), dragId.canvas("b"), ids)).toBeNull();
    expect(resolveDrop(dragId.canvas("a"), dragId.palette("text"), ids)).toBeNull();
  });
});
