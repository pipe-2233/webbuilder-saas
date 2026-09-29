import { describe, expect, it } from "vitest";

import { createBlankPage, createSection } from "@/lib/page-model/defaults";
import { parsePageDocument } from "@/lib/page-model/parse";
import { LIMITS } from "@/lib/page-model/schema";

import {
  canAddSection,
  createEditorState,
  editorReducer,
  gapToIndex,
  type EditorState,
} from "./reducer";

// Página inicial: header, hero, features, footer.
function initial(): EditorState {
  return createEditorState(createBlankPage("Prueba"));
}

const types = (state: EditorState) => state.document.sections.map((s) => s.type);
const ids = (state: EditorState) => state.document.sections.map((s) => s.id);

describe("editorReducer", () => {
  it("empieza sin selección y sin cambios", () => {
    const state = initial();
    expect(state.selectedId).toBeNull();
    expect(state.dirty).toBe(false);
  });

  describe("select", () => {
    it("selecciona una sección existente sin marcar cambios", () => {
      const state = initial();
      const next = editorReducer(state, { type: "select", id: ids(state)[1] });
      expect(next.selectedId).toBe(ids(state)[1]);
      expect(next.dirty).toBe(false);
    });

    it("ignora ids inexistentes", () => {
      const state = initial();
      expect(editorReducer(state, { type: "select", id: "no-existe" })).toBe(state);
    });
  });

  describe("addSection", () => {
    it("sin selección, inserta antes del pie de página y la selecciona", () => {
      const next = editorReducer(initial(), { type: "addSection", sectionType: "text" });
      expect(types(next)).toEqual(["header", "hero", "features", "text", "footer"]);
      expect(next.selectedId).toBe(ids(next)[3]);
      expect(next.dirty).toBe(true);
    });

    it("con selección, inserta justo después de la seleccionada", () => {
      const state = initial();
      const selected = editorReducer(state, { type: "select", id: ids(state)[0] });
      const next = editorReducer(selected, { type: "addSection", sectionType: "image" });
      expect(types(next)).toEqual(["header", "image", "hero", "features", "footer"]);
    });

    it("sin pie de página, inserta al final", () => {
      const state = initial();
      const footerId = ids(state)[3];
      const withoutFooter = editorReducer(state, { type: "removeSection", id: footerId });
      const next = editorReducer(withoutFooter, { type: "addSection", sectionType: "text" });
      expect(types(next).at(-1)).toBe("text");
    });

    it(`no supera el límite de ${LIMITS.sections} secciones`, () => {
      const state = initial();
      state.document.sections = Array.from({ length: LIMITS.sections }, () => createSection("text"));
      expect(canAddSection(state)).toBe(false);
      expect(editorReducer(state, { type: "addSection", sectionType: "text" })).toBe(state);
    });

    it("el documento resultante sigue siendo válido", () => {
      let state = initial();
      for (const sectionType of ["text", "image", "hero", "features", "header", "footer"] as const) {
        state = editorReducer(state, { type: "addSection", sectionType });
      }
      expect(parsePageDocument(JSON.parse(JSON.stringify(state.document))).success).toBe(true);
    });
  });

  describe("removeSection", () => {
    it("borra la sección y selecciona la que ocupa su lugar", () => {
      const state = initial();
      const [, hero, features] = ids(state);
      const selected = editorReducer(state, { type: "select", id: hero });
      const next = editorReducer(selected, { type: "removeSection", id: hero });
      expect(types(next)).toEqual(["header", "features", "footer"]);
      expect(next.selectedId).toBe(features);
    });

    it("al borrar la última, selecciona la anterior", () => {
      const state = initial();
      const footer = ids(state)[3];
      const selected = editorReducer(state, { type: "select", id: footer });
      const next = editorReducer(selected, { type: "removeSection", id: footer });
      expect(next.selectedId).toBe(ids(state)[2]);
    });

    it("mantiene la selección si se borra otra sección", () => {
      const state = initial();
      const selected = editorReducer(state, { type: "select", id: ids(state)[0] });
      const next = editorReducer(selected, { type: "removeSection", id: ids(state)[2] });
      expect(next.selectedId).toBe(ids(state)[0]);
    });

    it("al borrar la única sección, queda sin selección", () => {
      let state = initial();
      for (const id of ids(state).slice(1)) state = editorReducer(state, { type: "removeSection", id });
      state = editorReducer(state, { type: "select", id: ids(state)[0] });
      const next = editorReducer(state, { type: "removeSection", id: ids(state)[0] });
      expect(next.document.sections).toEqual([]);
      expect(next.selectedId).toBeNull();
    });
  });

  describe("moveSection", () => {
    it("sube y baja una sección", () => {
      const state = initial();
      const hero = ids(state)[1];
      const up = editorReducer(state, { type: "moveSection", id: hero, direction: -1 });
      expect(types(up)).toEqual(["hero", "header", "features", "footer"]);
      const down = editorReducer(state, { type: "moveSection", id: hero, direction: 1 });
      expect(types(down)).toEqual(["header", "features", "hero", "footer"]);
      expect(down.dirty).toBe(true);
    });

    it("no hace nada en los extremos", () => {
      const state = initial();
      expect(editorReducer(state, { type: "moveSection", id: ids(state)[0], direction: -1 })).toBe(state);
      expect(editorReducer(state, { type: "moveSection", id: ids(state)[3], direction: 1 })).toBe(state);
    });
  });

  describe("insertSection", () => {
    it("inserta en la posición indicada y la selecciona", () => {
      const next = editorReducer(initial(), { type: "insertSection", sectionType: "image", index: 0 });
      expect(types(next)).toEqual(["image", "header", "hero", "features", "footer"]);
      expect(next.selectedId).toBe(ids(next)[0]);
    });

    it("inserta al final con index = número de secciones", () => {
      const next = editorReducer(initial(), { type: "insertSection", sectionType: "text", index: 4 });
      expect(types(next).at(-1)).toBe("text");
    });

    it("ajusta posiciones fuera de rango", () => {
      expect(types(editorReducer(initial(), { type: "insertSection", sectionType: "text", index: 99 })).at(-1)).toBe("text");
      expect(types(editorReducer(initial(), { type: "insertSection", sectionType: "text", index: -5 }))[0]).toBe("text");
    });
  });

  describe("moveSectionTo", () => {
    it("mueve una sección a una posición concreta y la selecciona", () => {
      const state = initial();
      const footer = ids(state)[3];
      const next = editorReducer(state, { type: "moveSectionTo", id: footer, toIndex: 0 });
      expect(types(next)).toEqual(["footer", "header", "hero", "features"]);
      expect(next.selectedId).toBe(footer);
    });

    it("no hace nada si la posición es la misma", () => {
      const state = initial();
      expect(editorReducer(state, { type: "moveSectionTo", id: ids(state)[1], toIndex: 1 })).toBe(state);
    });
  });

  describe("gapToIndex", () => {
    // Secciones [A, B, C, D]; huecos 0..4.
    it.each([
      // [desde, hueco, posición final]
      [1, 0, 0], // B al principio
      [1, 1, 1], // B justo antes de sí misma: no se mueve
      [1, 2, 1], // B justo después de sí misma: no se mueve
      [1, 3, 2], // B entre C y D
      [1, 4, 3], // B al final
      [3, 0, 0], // D al principio
    ])("desde %i al hueco %i queda en %i", (from, gap, expected) => {
      expect(gapToIndex(from, gap)).toBe(expected);
    });

    it("combinado con moveSectionTo produce el orden esperado", () => {
      const state = initial(); // header, hero, features, footer
      const hero = ids(state)[1];
      const next = editorReducer(state, { type: "moveSectionTo", id: hero, toIndex: gapToIndex(1, 3) });
      expect(types(next)).toEqual(["header", "features", "hero", "footer"]);
    });
  });

  describe("updateSectionField", () => {
    it("cambia un texto de la sección", () => {
      const state = initial();
      const hero = ids(state)[1];
      const next = editorReducer(state, { type: "updateSectionField", id: hero, path: ["title"], value: "Hola" });
      expect(next.document.sections[1]).toMatchObject({ props: { title: "Hola" } });
      expect(next.dirty).toBe(true);
    });

    it("cambia un elemento de una lista", () => {
      const state = initial();
      const features = ids(state)[2];
      const next = editorReducer(state, {
        type: "updateSectionField",
        id: features,
        path: ["items", 1, "title"],
        value: "Envío gratis",
      });
      const section = next.document.sections[2];
      expect(section.type === "features" && section.props.items[1].title).toBe("Envío gratis");
    });

    it("no marca cambios si el valor es el mismo o la ruta no existe", () => {
      const state = initial();
      const hero = state.document.sections[1];
      const title = hero.type === "hero" ? hero.props.title : "";
      expect(editorReducer(state, { type: "updateSectionField", id: hero.id, path: ["title"], value: title })).toBe(state);
      expect(editorReducer(state, { type: "updateSectionField", id: hero.id, path: ["noExiste"], value: 1 })).toBe(state);
      expect(editorReducer(state, { type: "updateSectionField", id: "x", path: ["title"], value: "a" })).toBe(state);
    });
  });

  describe("setSectionBackground", () => {
    it("pone y quita el color de fondo de una sección", () => {
      const state = initial();
      const hero = ids(state)[1];
      const withColor = editorReducer(state, { type: "setSectionBackground", id: hero, color: "#ffeecc" });
      expect(withColor.document.sections[1].background).toBe("#ffeecc");
      const without = editorReducer(withColor, { type: "setSectionBackground", id: hero, color: undefined });
      expect("background" in without.document.sections[1]).toBe(false);
    });

    it("el resultado sigue siendo válido", () => {
      const state = editorReducer(initial(), {
        type: "setSectionBackground",
        id: ids(initial())[0],
        color: "#123456",
      });
      expect(parsePageDocument(JSON.parse(JSON.stringify(state.document))).success).toBe(true);
    });
  });

  describe("updateTheme", () => {
    it("cambia colores y fuentes del tema", () => {
      let state = initial();
      state = editorReducer(state, { type: "updateTheme", path: ["colors", "primary"], value: "#b45309" });
      state = editorReducer(state, { type: "updateTheme", path: ["fonts", "heading"], value: "playfair-display" });
      expect(state.document.theme.colors.primary).toBe("#b45309");
      expect(state.document.theme.fonts.heading).toBe("playfair-display");
      expect(state.dirty).toBe(true);
    });

    it("ignora rutas inexistentes", () => {
      const state = initial();
      expect(editorReducer(state, { type: "updateTheme", path: ["colors", "rosa"], value: "#000000" })).toBe(state);
    });
  });

  describe("markSaved", () => {
    it("quita los cambios pendientes si se guardó la última revisión", () => {
      let state = editorReducer(initial(), { type: "addSection", sectionType: "text" });
      expect(state.dirty).toBe(true);
      state = editorReducer(state, { type: "markSaved", revision: state.revision });
      expect(state.dirty).toBe(false);
    });

    it("sigue habiendo cambios si hubo ediciones mientras se guardaba", () => {
      let state = editorReducer(initial(), { type: "addSection", sectionType: "text" });
      const saving = state.revision;
      state = editorReducer(state, { type: "addSection", sectionType: "image" });
      state = editorReducer(state, { type: "markSaved", revision: saving });
      expect(state.dirty).toBe(true);
      state = editorReducer(state, { type: "markSaved", revision: state.revision });
      expect(state.dirty).toBe(false);
    });

    it("un guardado antiguo que termina tarde no retrocede", () => {
      let state = editorReducer(initial(), { type: "addSection", sectionType: "text" });
      state = editorReducer(state, { type: "addSection", sectionType: "text" });
      state = editorReducer(state, { type: "markSaved", revision: 2 });
      state = editorReducer(state, { type: "markSaved", revision: 1 });
      expect(state.savedRevision).toBe(2);
      expect(state.dirty).toBe(false);
    });

    it("cada cambio aumenta la revisión; seleccionar no", () => {
      const state = initial();
      const selected = editorReducer(state, { type: "select", id: ids(state)[0] });
      expect(selected.revision).toBe(0);
      const changedTheme = editorReducer(selected, { type: "updateTheme", path: ["colors", "text"], value: "#111111" });
      expect(changedTheme.revision).toBe(1);
    });
  });

  it("no modifica el estado anterior (inmutable)", () => {
    const state = initial();
    const before = JSON.stringify(state);
    editorReducer(state, { type: "addSection", sectionType: "text" });
    editorReducer(state, { type: "removeSection", id: ids(state)[0] });
    editorReducer(state, { type: "moveSection", id: ids(state)[1], direction: 1 });
    expect(JSON.stringify(state)).toBe(before);
  });
});
