import { describe, expect, it } from "vitest";

import { createBlankPage } from "@/lib/page-model/defaults";
import { parsePageDocument } from "@/lib/page-model/parse";

import { createEditorState, editorReducer, type EditorState } from "./reducer";

// Página inicial: header, hero, features, footer.
function initial(): EditorState {
  return createEditorState(createBlankPage("Prueba"));
}
const heroId = (state: EditorState) => state.document.sections[1].id;
const hero = (state: EditorState) => state.document.sections[1];
const isValid = (state: EditorState) =>
  parsePageDocument(JSON.parse(JSON.stringify(state.document))).success;

describe("selectElement", () => {
  it("selecciona la sección y el elemento", () => {
    const start = initial();
    const state = editorReducer(start, { type: "selectElement", id: heroId(start), key: "button" });
    expect(state.selectedId).toBe(heroId(start));
    expect(state.selectedElement).toBe("button");
  });

  it("ignora elementos que la sección no tiene", () => {
    const start = initial();
    const state = editorReducer(start, { type: "selectElement", id: heroId(start), key: "itemTitle" });
    expect(state.selectedElement).toBeNull();
  });

  it("seleccionar una sección quita el elemento seleccionado", () => {
    const start = initial();
    let state = editorReducer(start, { type: "selectElement", id: heroId(start), key: "title" });
    state = editorReducer(state, { type: "select", id: heroId(start) });
    expect(state.selectedElement).toBeNull();
  });
});

describe("selección múltiple", () => {
  it("Mayús + clic añade elementos; el último es el principal", () => {
    const start = initial();
    let state = editorReducer(start, { type: "selectElement", id: heroId(start), key: "title" });
    state = editorReducer(state, { type: "selectElement", id: heroId(start), key: "button", additive: true });
    expect(state.selectedElements).toEqual(["title", "button"]);
    expect(state.selectedElement).toBe("button");
  });

  it("Mayús + clic sobre uno ya seleccionado lo quita", () => {
    const start = initial();
    let state = editorReducer(start, { type: "selectElement", id: heroId(start), key: "title" });
    state = editorReducer(state, { type: "selectElement", id: heroId(start), key: "button", additive: true });
    state = editorReducer(state, { type: "selectElement", id: heroId(start), key: "button", additive: true });
    expect(state.selectedElements).toEqual(["title"]);
    expect(state.selectedElement).toBe("title");
  });

  it("un clic normal deja solo ese elemento", () => {
    const start = initial();
    let state = editorReducer(start, { type: "selectElement", id: heroId(start), key: "title" });
    state = editorReducer(state, { type: "selectElement", id: heroId(start), key: "button", additive: true });
    state = editorReducer(state, { type: "selectElement", id: heroId(start), key: "subtitle" });
    expect(state.selectedElements).toEqual(["subtitle"]);
  });

  it("no mezcla elementos de secciones distintas", () => {
    const start = initial();
    const features = start.document.sections[2].id;
    let state = editorReducer(start, { type: "selectElement", id: heroId(start), key: "title" });
    state = editorReducer(state, { type: "selectElement", id: features, key: "title", additive: true });
    expect(state.selectedId).toBe(features);
    expect(state.selectedElements).toEqual(["title"]);
  });

  it("seleccionar la sección vacía la selección de elementos", () => {
    const start = initial();
    let state = editorReducer(start, { type: "selectElement", id: heroId(start), key: "title" });
    state = editorReducer(state, { type: "select", id: heroId(start) });
    expect(state.selectedElements).toEqual([]);
  });
});

describe("updateElementStyle", () => {
  it("guarda el estilo de un elemento y sigue siendo válido", () => {
    const start = initial();
    const state = editorReducer(start, {
      type: "updateElementStyle",
      id: heroId(start),
      key: "title",
      patch: { font: "playfair-display", size: "6xl", color: "#ff0000", bold: true, italic: true, align: "left" },
    });
    expect(hero(state).styles?.title).toMatchObject({ font: "playfair-display", size: "6xl", color: "#ff0000" });
    expect(state.dirty).toBe(true);
    expect(isValid(state)).toBe(true);
  });

  it("un valor undefined vuelve al predeterminado y no deja objetos vacíos", () => {
    const start = initial();
    let state = editorReducer(start, { type: "updateElementStyle", id: heroId(start), key: "button", patch: { background: "#123456" } });
    state = editorReducer(state, { type: "updateElementStyle", id: heroId(start), key: "button", patch: { background: undefined } });
    expect("styles" in hero(state)).toBe(false);
  });

  it("resetElementStyle borra el estilo del elemento", () => {
    const start = initial();
    let state = editorReducer(start, { type: "updateElementStyle", id: heroId(start), key: "subtitle", patch: { italic: true } });
    state = editorReducer(state, { type: "resetElementStyle", id: heroId(start), key: "subtitle" });
    expect(hero(state).styles).toBeUndefined();
  });

  it("no marca cambios si el estilo es el mismo", () => {
    const start = initial();
    const state = editorReducer(start, { type: "updateElementStyle", id: heroId(start), key: "title", patch: { bold: true } });
    expect(editorReducer(state, { type: "updateElementStyle", id: heroId(start), key: "title", patch: { bold: true } })).toBe(state);
  });
});

describe("setElementOrder", () => {
  it("cambia el orden y completa los elementos que falten", () => {
    const start = initial();
    const state = editorReducer(start, { type: "setElementOrder", id: heroId(start), order: ["button", "title"] });
    expect(hero(state).layout?.order).toEqual(["button", "title", "eyebrow", "subtitle", "image"]);
    expect(isValid(state)).toBe(true);
  });

  it("descarta elementos ajenos y repetidos", () => {
    const start = initial();
    const state = editorReducer(start, {
      type: "setElementOrder",
      id: heroId(start),
      order: ["logo", "subtitle", "subtitle", "title"],
    });
    expect(hero(state).layout?.order).toEqual(["subtitle", "title", "eyebrow", "button", "image"]);
  });
});

describe("posición libre", () => {
  const free = {
    height: 400,
    items: { title: { x: 10, y: 20, w: 60 }, button: { x: 10, y: 200, w: 20 } },
  };

  it("se activa con las posiciones medidas y es válida", () => {
    const start = initial();
    const state = editorReducer(start, { type: "setFreeLayout", id: heroId(start), free });
    expect(hero(state).layout?.free?.items.title).toEqual({ x: 10, y: 20, w: 60 });
    expect(isValid(state)).toBe(true);
  });

  it("funciona en todas las secciones, por ejemplo en la cabecera", () => {
    const start = initial();
    const headerId = start.document.sections[0].id;
    const state = editorReducer(start, {
      type: "setFreeLayout",
      id: headerId,
      free: { height: 80, items: { logo: { x: 0, y: 10, w: 30 }, links: { x: 60, y: 10, w: 40 } } },
    });
    expect(state.document.sections[0].layout?.free?.items.logo).toEqual({ x: 0, y: 10, w: 30 });
    expect(isValid(state)).toBe(true);
  });

  it("en características se mueve el grupo de tarjetas, no cada título por separado", () => {
    const start = initial();
    const featuresId = start.document.sections[2].id;
    const state = editorReducer(start, {
      type: "setFreeLayout",
      id: featuresId,
      free: { height: 400, items: { items: { x: 0, y: 80, w: 100 }, itemTitle: { x: 0, y: 0, w: 10 } } },
    });
    const items = state.document.sections[2].layout?.free?.items;
    expect(items?.items).toEqual({ x: 0, y: 80, w: 100 });
    expect(items?.itemTitle).toBeUndefined();
  });

  it("mueve un elemento, lo mantiene dentro y agranda la sección si hace falta", () => {
    const start = initial();
    let state = editorReducer(start, { type: "setFreeLayout", id: heroId(start), free });
    state = editorReducer(state, {
      type: "setFreePosition",
      id: heroId(start),
      key: "button",
      position: { x: 95, y: 500, w: 20 },
      minHeight: 560,
    });
    expect(hero(state).layout?.free).toMatchObject({ height: 560, items: { button: { x: 80, y: 500, w: 20 } } });
  });

  it("cambia el alto dentro de los límites", () => {
    const start = initial();
    let state = editorReducer(start, { type: "setFreeLayout", id: heroId(start), free });
    state = editorReducer(state, { type: "setFreeHeight", id: heroId(start), height: 10 });
    expect(hero(state).layout?.free?.height).toBe(80);
  });

  it("se puede quitar para volver a la colocación automática", () => {
    const start = initial();
    let state = editorReducer(start, { type: "setFreeLayout", id: heroId(start), free });
    state = editorReducer(state, { type: "setFreeLayout", id: heroId(start), free: undefined });
    expect(hero(state).layout).toBeUndefined();
  });

  it("mueve varios elementos a la vez y guarda el alto fijo", () => {
    const start = initial();
    let state = editorReducer(start, { type: "setFreeLayout", id: heroId(start), free });
    state = editorReducer(state, {
      type: "setFreePositions",
      id: heroId(start),
      positions: { title: { x: 0, y: 0, w: 60 }, button: { x: 0, y: 100, w: 30, h: 64 } },
    });
    expect(hero(state).layout?.free?.items).toMatchObject({
      title: { x: 0, y: 0, w: 60 },
      button: { x: 0, y: 100, w: 30, h: 64 },
    });
    expect(isValid(state)).toBe(true);
  });

  it("mover sin posición libre activada no hace nada", () => {
    const start = initial();
    expect(
      editorReducer(start, { type: "setFreePosition", id: heroId(start), key: "title", position: { x: 1, y: 1, w: 50 } }),
    ).toBe(start);
  });
});
