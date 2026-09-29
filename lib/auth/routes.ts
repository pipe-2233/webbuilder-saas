/** Rutas de autenticación compartidas entre el proxy, las acciones y la UI. */
export const AUTH_ROUTES = {
  login: "/login",
  register: "/register",
  callback: "/auth/callback",
  afterLogin: "/dashboard",
} as const;

export const editorPath = (projectId: string) => `/editor/${projectId}`;

/** Rutas que requieren sesión iniciada (se comprueba por prefijo). */
const PROTECTED_PREFIXES = ["/dashboard", "/editor"];

/** Rutas que solo tienen sentido sin sesión. */
const GUEST_ONLY_ROUTES: string[] = [AUTH_ROUTES.login, AUTH_ROUTES.register];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isGuestOnlyPath(pathname: string): boolean {
  return GUEST_ONLY_ROUTES.includes(pathname);
}

/**
 * Devuelve una ruta interna segura a la que redirigir tras iniciar sesión.
 * Evita redirecciones abiertas a otros dominios (`//evil.com`, `https://...`).
 */
export function safeRedirectPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return AUTH_ROUTES.afterLogin;
  }
  return value;
}
