import { NextResponse, type NextRequest } from "next/server";

import { AUTH_ROUTES, safeRedirectPath } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

/**
 * Destino del enlace de confirmación de correo. Supabase redirige aquí con un
 * `code` de un solo uso que se intercambia por una sesión.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}${AUTH_ROUTES.login}?error=confirmation`);
}
