import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { AUTH_ROUTES, isGuestOnlyPath, isProtectedPath } from "@/lib/auth/routes";
import type { Database } from "@/types/database";

import { getSupabaseEnv } from "./env";

/**
 * Refresca la sesión de Supabase en cada petición y aplica las reglas de acceso:
 * - Sin sesión en una ruta protegida -> /login?next=<ruta>
 * - Con sesión en /login o /register -> /dashboard
 */
export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // No ejecutar código entre createServerClient y getClaims: getClaims valida
  // el token y lo refresca si ha caducado.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);
  const { pathname, search } = request.nextUrl;

  if (!isAuthenticated && isProtectedPath(pathname)) {
    return redirectWithCookies(request, response, AUTH_ROUTES.login, { next: pathname + search });
  }

  if (isAuthenticated && isGuestOnlyPath(pathname)) {
    return redirectWithCookies(request, response, AUTH_ROUTES.afterLogin);
  }

  return response;
}

/** Redirige conservando las cookies de sesión que Supabase haya actualizado. */
function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
  params: Record<string, string> = {},
) {
  const target = request.nextUrl.clone();
  target.pathname = pathname;
  target.search = new URLSearchParams(params).toString();

  const redirect = NextResponse.redirect(target);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
