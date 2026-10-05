import { describe, expect, it } from "vitest";

import { createBlankPage, createSection } from "./defaults";
import { parsePageDocument } from "./parse";
import { LIMITS, type PageDocument, type SectionType } from "./schema";

const SECTION_TYPES: SectionType[] = ["header", "hero", "text", "image", "features", "footer"];

function validDoc(): PageDocument {
  return createBlankPage("Mi tienda de café");
}

/** Devuelve una copia del documento como JSON plano (como llega del cliente o de la BD). */
function asJson(doc: unknown): unknown {
  return JSON.parse(JSON.stringify(doc));
}

describe("página inicial", () => {
  it("es válida según el esquema", () => {
    expect(parsePageDocument(asJson(validDoc())).success).toBe(true);
  });

  it("usa el nombre del sitio en la cabecera y el título", () => {
    const doc = validDoc();
    expect(doc.meta.title).toBe("Mi tienda de café");
    expect(doc.sections[0]).toMatchObject({ type: "header", props: { logoText: "Mi tienda de café" } });
  });

  it("recorta nombres demasiado largos para que sigan siendo válidos", () => {
    const doc = createBlankPage("x".repeat(200));
    expect(parsePageDocument(asJson(doc)).success).toBe(true);
  });

  it("genera ids distintos en cada llamada", () => {
    const a = validDoc().sections.map((s) => s.id);
    const b = validDoc().sections.map((s) => s.id);
    expect(new Set([...a, ...b]).size).toBe(a.length + b.length);
  });
});

describe("secciones", () => {
  it.each(SECTION_TYPES)("la sección '%s' por defecto es válida", (type) => {
    const doc = validDoc();
    doc.sections = [createSection(type)];
    expect(parsePageDocument(asJson(doc)).success).toBe(true);
  });

  it("rechaza un tipo de sección desconocido", () => {
    const doc = asJson(validDoc()) as { sections: unknown[] };
    doc.sections.push({ id: "x", type: "video", props: {} });
    expect(parsePageDocument(doc).success).toBe(false);
  });

  it("rechaza ids de sección duplicados", () => {
    const doc = validDoc();
    doc.sections[1].id = doc.sections[0].id;
    const result = parsePageDocument(asJson(doc));
    expect(result).toMatchObject({ success: false });
    if (!result.success) expect(result.error).toContain("duplicado");
  });

  it(`rechaza más de ${LIMITS.sections} secciones`, () => {
    const doc = validDoc();
    doc.sections = Array.from({ length: LIMITS.sections + 1 }, () => createSection("text"));
    expect(parsePageDocument(asJson(doc)).success).toBe(false);
  });

  it("acepta un color de fondo propio y rechaza uno mal escrito", () => {
    const doc = validDoc();
    doc.sections[1].background = "#FFAA00";
    const ok = parsePageDocument(asJson(doc));
    expect(ok.success && ok.data.sections[1].background).toBe("#ffaa00");

    doc.sections[1].background = "red";
    expect(parsePageDocument(asJson(doc)).success).toBe(false);
  });
});

describe("alineación", () => {
  it.each(["left", "center", "right"] as const)("la portada acepta '%s'", (align) => {
    const doc = validDoc();
    const hero = createSection("hero");
    hero.props.align = align;
    doc.sections = [hero];
    expect(parsePageDocument(asJson(doc)).success).toBe(true);
  });

  it("rechaza alineaciones desconocidas", () => {
    const doc = asJson(validDoc()) as { sections: { type: string; props: { align?: string } }[] };
    const hero = doc.sections.find((s) => s.type === "hero");
    if (hero) hero.props.align = "arriba";
    expect(parsePageDocument(doc).success).toBe(false);
  });

  it("una sección de texto sin alineación (documentos antiguos) usa la izquierda", () => {
    const doc = asJson(validDoc()) as { sections: unknown[] };
    doc.sections = [{ id: "t1", type: "text", props: { title: "Hola", body: "" } }];
    const result = parsePageDocument(doc);
    expect(result.success && result.data.sections[0]).toMatchObject({ props: { align: "left" } });
  });
});

describe("animaciones de los elementos", () => {
  function withTitleStyle(style: Record<string, unknown>) {
    const doc = asJson(validDoc()) as { sections: { styles?: Record<string, unknown> }[] };
    doc.sections[1].styles = { title: style };
    return parsePageDocument(doc);
  }

  it("acepta entrada, continua, ratón y retraso", () => {
    expect(
      withTitleStyle({ animation: "glitch", animationDelay: 300, loop: "float", hover: "tilt" }).success,
    ).toBe(true);
  });

  it("acepta las animaciones clásicas guardadas antes", () => {
    expect(withTitleStyle({ animation: "fade-in" }).success).toBe(true);
  });

  it.each([
    ["entrada desconocida", { animation: "explotar" }],
    ["continua desconocida", { loop: "bailar" }],
    ["ratón desconocido", { hover: "volar" }],
    ["retraso negativo", { animationDelay: -100 }],
    ["retraso enorme", { animationDelay: 99999 }],
  ])("rechaza %s", (_name, style) => {
    expect(withTitleStyle(style).success).toBe(false);
  });
});

describe("formas decorativas", () => {
  const shape = {
    id: "s1",
    type: "circle",
    color: "#ff0000",
    opacity: 50,
    position: { x: 10, y: 10, w: 20, h: 80 },
    zIndex: 0,
  };
  function withShapes(shapes: unknown[]) {
    const doc = asJson(validDoc()) as { sections: { shapes?: unknown[] }[] };
    doc.sections[1].shapes = shapes;
    return parsePageDocument(doc);
  }

  it("acepta una forma válida", () => {
    expect(withShapes([shape]).success).toBe(true);
  });

  it("rechaza más de 30 formas en una sección", () => {
    expect(withShapes(Array.from({ length: 31 }, (_, i) => ({ ...shape, id: `s${i}` }))).success).toBe(false);
  });

  it.each([
    ["sin id", { id: "" }],
    ["giro fuera de rango", { rotation: 1000 }],
    ["capa fuera de rango", { zIndex: 999 }],
    ["borde enorme", { borderWidth: 500 }],
    ["tipo desconocido", { type: "dragon" }],
  ])("rechaza una forma %s", (_name, patch) => {
    expect(withShapes([{ ...shape, ...patch }]).success).toBe(false);
  });
});

describe("seguridad de enlaces e imágenes", () => {
  function withHeroButton(buttonHref: string) {
    const doc = validDoc();
    const hero = createSection("hero");
    hero.props.buttonHref = buttonHref;
    doc.sections = [hero];
    return parsePageDocument(asJson(doc));
  }

  it.each(["https://ejemplo.com", "http://ejemplo.com", "mailto:hola@ejemplo.com", "tel:+573001234567", "#contacto", "/tienda", ""])(
    "acepta el enlace %j",
    (value) => {
      expect(withHeroButton(value).success).toBe(true);
    },
  );

  it.each(["javascript:alert(1)", "JavaScript:alert(1)", "data:text/html,<script>", "//evil.com", "ejemplo.com"])(
    "rechaza el enlace %j",
    (value) => {
      expect(withHeroButton(value).success).toBe(false);
    },
  );

  it("solo acepta imágenes https o rutas locales", () => {
    const doc = validDoc();
    const image = createSection("image");
    doc.sections = [image];

    for (const src of ["", "https://cdn.ejemplo.com/a.png", "/img/a.png"]) {
      image.props.src = src;
      expect(parsePageDocument(asJson(doc)).success).toBe(true);
    }
    for (const src of ["http://ejemplo.com/a.png", "javascript:alert(1)", "//evil.com/a.png"]) {
      image.props.src = src;
      expect(parsePageDocument(asJson(doc)).success).toBe(false);
    }
  });
});

describe("documento", () => {
  it("rechaza valores que no son un documento", () => {
    for (const value of [null, undefined, "texto", 42, [], {}]) {
      expect(parsePageDocument(value).success).toBe(false);
    }
  });

  it("rechaza una versión desconocida", () => {
    const doc = asJson(validDoc()) as { version: number };
    doc.version = 2;
    expect(parsePageDocument(doc).success).toBe(false);
  });

  it("rechaza fuentes que no están en la lista permitida", () => {
    const doc = asJson(validDoc()) as { theme: { fonts: { body: string } } };
    doc.theme.fonts.body = "comic-sans";
    expect(parsePageDocument(doc).success).toBe(false);
  });

  it("recorta espacios sobrantes en los textos", () => {
    const doc = validDoc();
    doc.meta.title = "  Hola  ";
    const result = parsePageDocument(asJson(doc));
    expect(result.success && result.data.meta.title).toBe("Hola");
  });

  it("rechaza un título obligatorio vacío", () => {
    const doc = validDoc();
    const hero = createSection("hero");
    hero.props.title = "   ";
    doc.sections = [hero];
    expect(parsePageDocument(asJson(doc)).success).toBe(false);
  });

  it("indica la ruta del campo con error", () => {
    const doc = asJson(validDoc()) as { theme: { colors: { primary: string } } };
    doc.theme.colors.primary = "azul";
    const result = parsePageDocument(doc);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/^theme\.colors\.primary:/);
  });
});
