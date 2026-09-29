/**
 * Devuelve blanco o negro según cuál contraste mejor con `hex` (#rrggbb),
 * usando la luminancia relativa de WCAG.
 */
export function readableTextColor(hex: string): "#ffffff" | "#000000" {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];

  // Contraste contra blanco (1.0) y contra negro (0.0).
  const contrastWithWhite = 1.05 / (luminance + 0.05);
  const contrastWithBlack = (luminance + 0.05) / 0.05;
  return contrastWithWhite >= contrastWithBlack ? "#ffffff" : "#000000";
}
