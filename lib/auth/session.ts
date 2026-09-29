import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

import { AUTH_ROUTES } from "./routes";

export type SessionUser = {
  id: string;
  email: string;
};

/**
 * Devuelve el usuario autenticado o redirige a /login.
 * Se memoriza por petición, así que el layout y la página pueden llamarla
 * sin repetir la validación contra Supabase.
 */
export const requireUser = cache(async (): Promise<SessionUser> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) redirect(AUTH_ROUTES.login);

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
  };
});
