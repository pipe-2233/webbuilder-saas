import { createSection } from "@/lib/page-model/defaults";
import { elementsOf, supportsFreeLayout, type ElementKey } from "@/lib/page-model/elements";
import {
  LIMITS,
  type ElementStyle,
  type FreeLayout,
  type FreePosition,
  type PageDocument,
  type Section,
  type SectionType,
} from "@/lib/page-model/schema";

import { clampHeight, clampPosition } from "./free-layout";
import { setIn, type Path } from "./set-in";

/**
 * Estado del editor y sus cambios. Son funciones puras (sin React) para poder
 * probarlas y reutilizarlas; el componente Editor las usa con useReducer.
 */

export type EditorState = {
  document: PageDocument;
  selectedId: string | null;
  /** Elemento seleccionado dentro de la sección (título, botón...), si hay. */
  selectedElement: ElementKey | null;
  /**
   * Todos los elementos seleccionados de la sección (Mayús o Ctrl + clic para
   * añadir). El principal (`selectedElement`) es el último que se seleccionó.
   */
  selectedElements: ElementKey[];
  /** Hay cambios que todavía no se han guardado. */
  dirty: boolean;
  /** Aumenta con cada cambio del documento. */
  revision: number;
  /** Última revisión guardada en la base de datos. */
  savedRevision: number;
};

export type EditorAction =
  | { type: "select"; id: string | null }
  | { type: "addSection"; sectionType: SectionType }
  /** Inserta una sección nueva en `index` (arrastrar desde el menú de bloques). */
  | { type: "insertSection"; sectionType: SectionType; index: number }
  | { type: "removeSection"; id: string }
  | { type: "moveSection"; id: string; direction: -1 | 1 }
  /** Mueve una sección para que quede en la posición `toIndex` (arrastrar y soltar). */
  | { type: "moveSectionTo"; id: string; toIndex: number }
  /** Cambia un valor dentro de `props` de una sección (p. ej. ["items", 0, "title"]). */
  | { type: "updateSectionField"; id: string; path: Path; value: unknown }
  /** Color de fondo propio de una sección; `undefined` vuelve al del tema. */
  | { type: "setSectionBackground"; id: string; color: string | undefined }
  /** Cambia un valor del tema (p. ej. ["colors", "primary"] o ["fonts", "heading"]). */
  | { type: "updateTheme"; path: Path; value: unknown }
  /**
   * Se guardó la revisión `revision`. Si hubo cambios mientras se guardaba,
   * sigue habiendo cambios pendientes.
   */
  | { type: "markSaved"; revision: number }
  /** Selecciona un elemento de una sección (y la sección). */
  | { type: "selectElement"; id: string; key: ElementKey | null; additive?: boolean }
  /** Cambia el estilo de un elemento; un valor `undefined` vuelve al predeterminado. */
  | { type: "updateElementStyle"; id: string; key: ElementKey; patch: Partial<ElementStyle> }
  /** Borra todo el estilo propio de un elemento. */
  | { type: "resetElementStyle"; id: string; key: ElementKey }
  /** Orden de los elementos en columna (móvil). */
  | { type: "setElementOrder"; id: string; order: ElementKey[] }
  /** Activa (con las posiciones medidas) o quita la posición libre de una sección. */
  | { type: "setFreeLayout"; id: string; free: FreeLayout | undefined }
  /** Mueve o redimensiona un elemento en posición libre. */
  | { type: "setFreePosition"; id: string; key: ElementKey; position: FreePosition; minHeight?: number }
  /** Mueve varios elementos a la vez (arrastrar un grupo, alinear, distribuir). */
  | { type: "setFreePositions"; id: string; positions: Partial<Record<ElementKey, FreePosition>>; minHeight?: number }
  /** Alto de la zona de contenido en posición libre. */
  | { type: "setFreeHeight"; id: string; height: number };

export function createEditorState(document: PageDocument): EditorState {
  return {
    document,
    selectedId: null,
    selectedElement: null,
    selectedElements: [],
    dirty: false,
    revision: 0,
    savedRevision: 0,
  };
}

export function canAddSection(state: EditorState): boolean {
  return state.document.sections.length < LIMITS.sections;
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  const { sections } = state.document;

  switch (action.type) {
    case "select": {
      if (action.id !== null && !sections.some((s) => s.id === action.id)) return state;
      if (action.id === state.selectedId && state.selectedElements.length === 0) return state;
      return { ...state, selectedId: action.id, selectedElement: null, selectedElements: [] };
    }

    case "selectElement": {
      const section = sections.find((s) => s.id === action.id);
      if (!section) return state;
      const key = action.key && elementsOf(section.type).includes(action.key) ? action.key : null;

      let selected: ElementKey[];
      if (action.additive && key && state.selectedId === action.id) {
        // Mayús/Ctrl + clic: añade o quita de la selección (solo en la misma sección).
        selected = state.selectedElements.includes(key)
          ? state.selectedElements.filter((k) => k !== key)
          : [...state.selectedElements, key];
      } else {
        selected = key ? [key] : [];
      }
      const primary = selected.at(-1) ?? null;
      if (
        state.selectedId === action.id &&
        state.selectedElement === primary &&
        selected.join() === state.selectedElements.join()
      ) {
        return state;
      }
      return { ...state, selectedId: action.id, selectedElement: primary, selectedElements: selected };
    }

    case "updateElementStyle":
      return updateSection(state, action.id, (section) => {
        if (!elementsOf(section.type).includes(action.key)) return section;
        const current = section.styles?.[action.key] ?? {};
        const next: Record<string, unknown> = { ...current };
        for (const [field, value] of Object.entries(action.patch)) {
          if (value === undefined) delete next[field];
          else next[field] = value;
        }
        if (shallowEqual(current, next)) return section;
        return withElementStyle(section, action.key, next as ElementStyle);
      });

    case "resetElementStyle":
      return updateSection(state, action.id, (section) =>
        section.styles?.[action.key] ? withElementStyle(section, action.key, {}) : section,
      );

    case "setElementOrder":
      return updateSection(state, action.id, (section) => {
        const allowed = elementsOf(section.type);
        // Conserva solo elementos de la sección, sin repetir, y añade los que falten.
        const order = [...new Set(action.order.filter((key) => allowed.includes(key)))];
        for (const key of allowed) if (!order.includes(key)) order.push(key);
        const current = section.layout?.order ?? allowed;
        if (order.join() === current.join()) return section;
        return { ...section, layout: { ...section.layout, order } };
      });

    case "setFreeLayout":
      return updateSection(state, action.id, (section) => {
        if (!supportsFreeLayout(section.type)) return section;
        if (!action.free) {
          if (!section.layout?.free) return section;
          const rest = { ...section.layout };
          delete rest.free;
          return withLayout(section, rest);
        }
        const items: FreeLayout["items"] = {};
        for (const [key, position] of Object.entries(action.free.items) as [ElementKey, FreePosition][]) {
          if (elementsOf(section.type).includes(key)) items[key] = clampPosition(position);
        }
        return withLayout(section, { ...section.layout, free: { height: clampHeight(action.free.height), items } });
      });

    case "setFreePosition":
      return updateSection(state, action.id, (section) =>
        withFreePositions(section, { [action.key]: action.position }, action.minHeight),
      );

    case "setFreePositions":
      return updateSection(state, action.id, (section) =>
        withFreePositions(section, action.positions, action.minHeight),
      );

    case "setFreeHeight":
      return updateSection(state, action.id, (section) => {
        const free = section.layout?.free;
        const height = clampHeight(action.height);
        if (!free || free.height === height) return section;
        return withLayout(section, { ...section.layout, free: { ...free, height } });
      });

    case "addSection":
      return insertSection(state, action.sectionType, insertionIndex(state));

    case "insertSection":
      return insertSection(state, action.sectionType, action.index);

    case "removeSection": {
      const index = sections.findIndex((s) => s.id === action.id);
      if (index === -1) return state;
      const next = sections.filter((s) => s.id !== action.id);
      // Tras borrar, selecciona la sección que ocupa su lugar (o la anterior).
      const selectedId =
        state.selectedId === action.id ? (next[index] ?? next[index - 1])?.id ?? null : state.selectedId;
      const keepElements = selectedId === state.selectedId;
      return {
        ...withSections(state, next, selectedId),
        selectedElement: keepElements ? state.selectedElement : null,
        selectedElements: keepElements ? state.selectedElements : [],
      };
    }

    case "moveSection": {
      const from = sections.findIndex((s) => s.id === action.id);
      const to = from + action.direction;
      if (from === -1 || to < 0 || to >= sections.length) return state;
      const next = [...sections];
      [next[from], next[to]] = [next[to], next[from]];
      return withSections(state, next, state.selectedId);
    }

    case "moveSectionTo": {
      const from = sections.findIndex((s) => s.id === action.id);
      const to = clamp(action.toIndex, 0, sections.length - 1);
      if (from === -1 || from === to) return state;
      const next = [...sections];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return withSections(state, next, action.id);
    }

    // Los cambios de contenido no se validan aquí (se permite, por ejemplo,
    // dejar un título vacío mientras se escribe): se validan al guardar.
    case "updateSectionField":
      return updateSection(state, action.id, (section) => {
        const props = setIn(section.props, action.path, action.value);
        return props === section.props ? section : ({ ...section, props } as Section);
      });

    case "setSectionBackground":
      return updateSection(state, action.id, (section) => {
        if (section.background === action.color) return section;
        const next = { ...section };
        if (action.color) next.background = action.color;
        else delete next.background;
        return next;
      });

    case "updateTheme": {
      const theme = setIn(state.document.theme, action.path, action.value);
      if (theme === state.document.theme) return state;
      return changed(state, { ...state.document, theme }, state.selectedId);
    }

    case "markSaved": {
      const savedRevision = Math.max(state.savedRevision, action.revision);
      return { ...state, savedRevision, dirty: state.revision !== savedRevision };
    }
  }
}

/** Sección con nuevas posiciones libres (solo si ya usa posición libre). */
function withFreePositions(
  section: Section,
  positions: Partial<Record<ElementKey, FreePosition>>,
  minHeight = 0,
): Section {
  const free = section.layout?.free;
  if (!free) return section;
  const allowed = elementsOf(section.type);
  const items = { ...free.items };
  let changed = false;
  for (const [key, position] of Object.entries(positions) as [ElementKey, FreePosition][]) {
    if (!allowed.includes(key)) continue;
    const next = clampPosition(position);
    const current = items[key];
    if (current && shallowEqual(current, next)) continue;
    items[key] = next;
    changed = true;
  }
  const height = clampHeight(Math.max(free.height, minHeight));
  if (!changed && height === free.height) return section;
  return withLayout(section, { ...section.layout, free: { height, items } });
}

/** Sección con el estilo de un elemento cambiado; sin campos vacíos en el JSON. */
function withElementStyle(section: Section, key: ElementKey, style: ElementStyle): Section {
  const styles = { ...section.styles };
  if (Object.keys(style).length === 0) delete styles[key];
  else styles[key] = style;
  const next: Section = { ...section };
  if (Object.keys(styles).length === 0) delete next.styles;
  else next.styles = styles;
  return next;
}

/** Sección con otra disposición; sin campos vacíos en el JSON. */
function withLayout(section: Section, layout: NonNullable<Section["layout"]>): Section {
  const next: Section = { ...section };
  if (Object.values(layout).every((value) => value === undefined)) delete next.layout;
  else next.layout = layout;
  return next;
}

function shallowEqual(a: object, b: object): boolean {
  const aEntries = Object.entries(a);
  return aEntries.length === Object.keys(b).length && aEntries.every(([k, v]) => (b as Record<string, unknown>)[k] === v);
}

function updateSection(state: EditorState, id: string, update: (section: Section) => Section): EditorState {
  const { sections } = state.document;
  const index = sections.findIndex((s) => s.id === id);
  if (index === -1) return state;
  const updated = update(sections[index]);
  if (updated === sections[index]) return state;
  const next = [...sections];
  next[index] = updated;
  return withSections(state, next, state.selectedId);
}

/**
 * Convierte un hueco entre secciones (0 = antes de la primera, n = después de
 * la última) en la posición final de una sección que se mueve desde `from`.
 * Al sacar la sección de su sitio, los huecos posteriores se desplazan uno.
 */
export function gapToIndex(from: number, gap: number): number {
  return gap > from ? gap - 1 : gap;
}

function insertSection(state: EditorState, sectionType: SectionType, index: number): EditorState {
  if (!canAddSection(state)) return state;
  const { sections } = state.document;
  const at = clamp(index, 0, sections.length);
  const section = createSection(sectionType);
  const next = [...sections.slice(0, at), section, ...sections.slice(at)];
  return withSections(state, next, section.id);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Dónde se inserta una sección nueva:
 * - Justo después de la seleccionada.
 * - Si no hay selección, antes del pie de página (si la última sección lo es).
 * - Si no, al final.
 */
function insertionIndex({ document, selectedId }: EditorState): number {
  const { sections } = document;
  const selected = sections.findIndex((s) => s.id === selectedId);
  if (selected !== -1) return selected + 1;
  const last = sections.at(-1);
  return last?.type === "footer" ? sections.length - 1 : sections.length;
}

function withSections(
  state: EditorState,
  sections: PageDocument["sections"],
  selectedId: string | null,
): EditorState {
  return changed(state, { ...state.document, sections }, selectedId);
}

function changed(state: EditorState, document: PageDocument, selectedId: string | null): EditorState {
  return { ...state, document, selectedId, dirty: true, revision: state.revision + 1 };
}
