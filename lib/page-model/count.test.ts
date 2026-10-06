import { describe, expect, it } from "vitest";

import { formatCount, parseCountValue } from "./count";

describe("contador de cifras", () => {
  it.each([
    ["90", 90, "90"],
    ["1.000", 1000, "1.000"],
    ["3,500", 3500, "3,500"],
    ["1.250.000", 1250000, "1.250.000"],
    ["+500", 500, "+500"],
    ["24/7", 24, "24/7"],
    ["98%", 98, "98%"],
  ])("%s cuenta hasta %i y termina igual que el original", (value, target, end) => {
    const parts = parseCountValue(value);
    expect(parts?.target).toBe(target);
    expect(parts && formatCount(target, parts)).toBe(end);
  });

  it("durante la cuenta conserva el formato", () => {
    const parts = parseCountValue("1.000")!;
    expect(formatCount(0, parts)).toBe("0");
    expect(formatCount(523.4, parts)).toBe("523");
    expect(formatCount(1000, parts)).toBe("1.000");
  });

  it("si no hay número no se anima", () => {
    expect(parseCountValue("Gratis")).toBeNull();
    expect(parseCountValue("")).toBeNull();
  });
});
