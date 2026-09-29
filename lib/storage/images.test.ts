import { describe, expect, it } from "vitest";

import { IMAGE_MAX_BYTES, imagePath, validateImageFile } from "./images";

describe("validateImageFile", () => {
  it.each(["image/jpeg", "image/png", "image/webp", "image/gif"])("acepta %s", (type) => {
    expect(validateImageFile({ type, size: 1000 })).toBeNull();
  });

  it.each(["image/svg+xml", "text/html", "application/pdf", ""])("rechaza %j", (type) => {
    expect(validateImageFile({ type, size: 1000 })).toMatch(/Formato no admitido/);
  });

  it("rechaza archivos de más de 5 MB y vacíos", () => {
    expect(validateImageFile({ type: "image/png", size: IMAGE_MAX_BYTES + 1 })).toMatch(/5 MB/);
    expect(validateImageFile({ type: "image/png", size: IMAGE_MAX_BYTES })).toBeNull();
    expect(validateImageFile({ type: "image/png", size: 0 })).toMatch(/vacío/);
  });
});

describe("imagePath", () => {
  it("guarda en la carpeta del usuario y del proyecto", () => {
    expect(imagePath("u1", "p1", "image/webp", "abc")).toBe("u1/p1/abc.webp");
  });
});
