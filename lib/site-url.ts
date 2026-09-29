/**
 * URL pública del sitio, usada para construir enlaces absolutos
 * (p. ej. el enlace de confirmación de correo).
 */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return url.replace(/\/+$/, "");
}
