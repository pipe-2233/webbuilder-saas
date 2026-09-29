import { describe, expect, it } from "vitest";

import { readableTextColor } from "./color";

describe("readableTextColor", () => {
  it.each([
    ["#000000", "#ffffff"],
    ["#18181b", "#ffffff"],
    ["#1d4ed8", "#ffffff"],
    ["#ffffff", "#000000"],
    ["#facc15", "#000000"],
    ["#a3e635", "#000000"],
  ])("sobre %s usa %s", (background, expected) => {
    expect(readableTextColor(background)).toBe(expected);
  });
});
