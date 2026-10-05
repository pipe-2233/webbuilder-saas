import { describe, expect, it } from "vitest";

import { createBlankPage } from "@/lib/page-model/defaults";
import { parsePageDocument } from "@/lib/page-model/parse";

import { canRedo, canUndo, createEditorState, editorReducer, HISTORY_LIMIT, type EditorState } from "./reducer";

// Página inicial: header, hero, features, footer.
function initial(): EditorState {
  return createEditorState(createBlankPage("Prueba"));
}
const heroTitle = (state: EditorState) => {
  const hero = state.document.sections[1];
  return hero.type === "hero" ? hero.props.title : "";
};
const types = (state: EditorState) => state.document.sections.map((s) => s.type);

describe("deshacer y rehacer", () => {
  it("al empezar no hay nada que deshacer ni rehacer", () => {
    expect(canUndo(initial())).toBe(false);
    expect(canRedo(initial())).toBe(false);
  });

  it("deshace y rehace un cambio", () => {
    const start = initial();
    const changed = editorReducer(start, { type: "addSection", sectionType: "text" });
    const undone = editorReducer(changed, { type: "undo" });
    expect(types(undone)).toEqual(types(start));
    expect(canRedo(undone)).toBe(true);
    const redone = editorReducer(undone, { type: "redo" });
    expect(types(redone)).toEqual(types(changed));
  });

  it("deshacer también cuenta como cambio sin guardar", () => {
    let state = editorReducer(initial(), { type: "addSection", sectionType: "text" });
    state = editorReducer(state, { type: "markSaved", revision: state.revision });
    expect(state.dirty).toBe(false);
    state = editorReducer(state, { type: "undo" });
    expect(state.dirty).toBe(true);
  });

  it("un cambio nuevo borra lo que se podía rehacer", () => {
    let state = editorReducer(initial(), { type: "addSection", sectionType: "text" });
    state = editorReducer(state, { type: "undo" });
    state = editorReducer(state, { type: "addSection", sectionType: "image" });
    expect(canRedo(state)).toBe(false);
  });

  it("seleccionar no se guarda en el historial", () => {
    const start = initial();
    const state = editorReducer(start, { type: "select", id: start.document.sections[0].id });
    expect(canUndo(state)).toBe(false);
  });

  it("no pasa del límite de pasos", () => {
    let state = initial();
    for (let i = 0; i < HISTORY_LIMIT + 20; i++) {
      // Grupo distinto en cada cambio: cada uno es un paso del historial.
      state = editorReducer(state, {
        type: "updateTheme",
        path: ["colors", "text"],
        value: i % 2 ? "#111111" : "#222222",
        group: `paso-${i}`,
      });
    }
    expect(state.past.length).toBe(HISTORY_LIMIT);
  });

  it("si la sección seleccionada desaparece al deshacer, se quita la selección", () => {
    let state = editorReducer(initial(), { type: "addSection", sectionType: "text" });
    expect(state.selectedId).not.toBeNull();
    state = editorReducer(state, { type: "undo" });
    expect(state.selectedId).toBeNull();
  });
});

describe("agrupar cambios seguidos", () => {
  it("escribir en el mismo campo se deshace de una vez", () => {
    const start = initial();
    const id = start.document.sections[1].id;
    let state = start;
    for (const text of ["H", "Ho", "Hol", "Hola"]) {
      state = editorReducer(state, { type: "updateSectionField", id, path: ["title"], value: text, group: `field:${id}:title` });
    }
    expect(state.past.length).toBe(1);
    state = editorReducer(state, { type: "undo" });
    expect(heroTitle(state)).toBe(heroTitle(start));
  });

  it("sin indicar grupo, los cambios seguidos del mismo color se agrupan solos", () => {
    let state = initial();
    for (const color of ["#111111", "#222222", "#333333"]) {
      state = editorReducer(state, { type: "updateTheme", path: ["colors", "primary"], value: color });
    }
    expect(state.past.length).toBe(1);
  });

  it("cambiar de campo empieza un paso nuevo", () => {
    const start = initial();
    const id = start.document.sections[1].id;
    let state = editorReducer(start, { type: "updateSectionField", id, path: ["title"], value: "A", group: "field:title" });
    state = editorReducer(state, { type: "updateSectionField", id, path: ["subtitle"], value: "B", group: "field:subtitle" });
    expect(state.past.length).toBe(2);
  });

  it("seleccionar otra cosa corta el grupo", () => {
    const start = initial();
    const id = start.document.sections[1].id;
    let state = editorReducer(start, { type: "updateSectionField", id, path: ["title"], value: "A", group: "g" });
    state = editorReducer(state, { type: "select", id: start.document.sections[0].id });
    state = editorReducer(state, { type: "updateSectionField", id, path: ["title"], value: "AB", group: "g" });
    expect(state.past.length).toBe(2);
  });

  it("el guardado automático no corta el grupo mientras se escribe", () => {
    const start = initial();
    const id = start.document.sections[1].id;
    let state = editorReducer(start, { type: "updateSectionField", id, path: ["title"], value: "A", group: "g" });
    state = editorReducer(state, { type: "markSaved", revision: state.revision });
    state = editorReducer(state, { type: "updateSectionField", id, path: ["title"], value: "AB", group: "g" });
    expect(state.past.length).toBe(1);
  });
});

describe("duplicar sección", () => {
  it("pone una copia justo debajo, con ids nuevos, y la selecciona", () => {
    const start = initial();
    const features = start.document.sections[2];
    const state = editorReducer(start, { type: "duplicateSection", id: features.id });
    expect(types(state)).toEqual(["header", "hero", "features", "features", "footer"]);
    const copy = state.document.sections[3];
    expect(copy.id).not.toBe(features.id);
    expect(state.selectedId).toBe(copy.id);
    if (copy.type === "features" && features.type === "features") {
      expect(copy.props.items.map((i) => i.title)).toEqual(features.props.items.map((i) => i.title));
      expect(copy.props.items[0].id).not.toBe(features.props.items[0].id);
    }
  });

  it("el documento sigue siendo válido (sin ids repetidos)", () => {
    const start = initial();
    let state = start;
    for (const section of start.document.sections) {
      state = editorReducer(state, { type: "duplicateSection", id: section.id });
    }
    expect(parsePageDocument(JSON.parse(JSON.stringify(state.document))).success).toBe(true);
  });

  it("se puede deshacer", () => {
    const start = initial();
    let state = editorReducer(start, { type: "duplicateSection", id: start.document.sections[1].id });
    state = editorReducer(state, { type: "undo" });
    expect(types(state)).toEqual(types(start));
  });
});
