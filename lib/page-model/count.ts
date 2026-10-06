/**
 * Contador animado de las cifras: separa el número del resto del texto para
 * poder contar desde 0 conservando el formato ("1.000" -> 0 ... 1.000).
 */
export type CountParts = {
  /** Número entero a alcanzar. */
  target: number;
  /** Separador de miles usado en el original ("." o ","), si había. */
  separator: string;
  /** Texto antes y después del número ("+", "%", "/7"...). */
  prefix: string;
  rest: string;
};

/** null si el valor no empieza (tras un prefijo opcional) por un número entero. */
export function parseCountValue(value: string): CountParts | null {
  const match = value.match(/^(\D{0,3}?)(\d{1,3}(?:([.,])\d{3})+|\d+)(.*)$/);
  if (!match) return null;
  const [, prefix, digits, separator = "", rest] = match;
  const target = Number(digits.replace(/[.,]/g, ""));
  if (!Number.isSafeInteger(target)) return null;
  return { target, separator, prefix, rest };
}

/** Escribe un número con el mismo formato que el original. */
export function formatCount(current: number, parts: CountParts): string {
  const whole = Math.round(current).toString();
  const grouped = parts.separator ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, parts.separator) : whole;
  return `${parts.prefix}${grouped}${parts.rest}`;
}
