import { describe, expect, it } from "vitest";

import { hrefError, normalizeHref } from "./links";

describe("normalizeHref", () => {
  it.each([
    ["miweb.com", "https://miweb.com"],
    ["www.miweb.com/tienda", "https://www.miweb.com/tienda"],
    ["hola@miweb.com", "mailto:hola@miweb.com"],
    ["+57 300 123 4567", "tel:+573001234567"],
    ["contacto", "#contacto"],
    ["  https://ya.com  ", "https://ya.com"],
    ["#inicio", "#inicio"],
    ["/precios", "/precios"],
    ["mailto:a@b.co", "mailto:a@b.co"],
    ["", ""],
  ])("%j -> %j", (input, expected) => {
    expect(normalizeHref(input)).toBe(expected);
  });

  it("no convierte en seguro un enlace peligroso", () => {
    const result = normalizeHref("javascript:alert(1)");
    expect(hrefError(result)).not.toBeNull();
  });
});

describe("hrefError", () => {
  it("acepta enlaces válidos y explica los inválidos", () => {
    expect(hrefError("https://miweb.com")).toBeNull();
    expect(hrefError("hola mundo")).toMatch(/Enlace no válido/);
  });
});
