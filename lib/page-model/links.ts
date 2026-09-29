import { href } from "./schema";

/**
 * Completa lo que escribe una persona sin conocimientos técnicos:
 * - "miweb.com"          -> "https://miweb.com"
 * - "hola@miweb.com"     -> "mailto:hola@miweb.com"
 * - "+57 300 123 4567"   -> "tel:+573001234567"
 * - "contacto"           -> "#contacto" (ancla a una parte de la página)
 * Lo demás se deja igual.
 */
export function normalizeHref(input: string): string {
  const value = input.trim();
  if (!value) return value;
  if (/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(value)) return value;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
  if (/^\+?[\d\s().-]{7,}$/.test(value)) return `tel:${value.replace(/[^\d+]/g, "")}`;
  if (/^[^\s/]+\.[a-z]{2,}(\/\S*)?$/i.test(value)) return `https://${value}`;
  if (/^[\w-]+$/.test(value)) return `#${value}`;
  return value;
}

/** Mensaje de error si el enlace no es válido; null si lo es. */
export function hrefError(value: string): string | null {
  const result = href.safeParse(value);
  return result.success ? null : (result.error.issues[0]?.message ?? "Enlace no válido.");
}
