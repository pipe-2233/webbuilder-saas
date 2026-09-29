"use server";

import { redirect } from "next/navigation";

import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

import { authErrorMessage } from "./errors";
import { AUTH_ROUTES, safeRedirectPath } from "./routes";
import { readString, validateLogin, validateRegister, type FieldErrors } from "./validation";

export type AuthFormState = {
  error?: string;
  success?: string;
  fieldErrors?: FieldErrors;
  /** Correo introducido, para no vaciar el campo tras un error. */
  email?: string;
};

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = readString(formData, "email");
  const parsed = validateLogin(formData);
  if (!parsed.success) return { fieldErrors: parsed.errors, email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: authErrorMessage(error), email };

  redirect(safeRedirectPath(formData.get("next")));
}

export async function register(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = readString(formData, "email");
  const parsed = validateRegister(formData);
  if (!parsed.success) return { fieldErrors: parsed.errors, email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${getSiteUrl()}${AUTH_ROUTES.callback}` },
  });
  if (error) return { error: authErrorMessage(error), email };

  // Si la confirmación de correo está desactivada, Supabase devuelve la sesión.
  if (data.session) redirect(AUTH_ROUTES.afterLogin);

  // Con confirmación activada. Si el correo ya estaba registrado, Supabase no
  // lo indica (para no revelar qué cuentas existen), así que el mensaje es el mismo.
  return {
    success: `Te enviamos un enlace de confirmación a ${parsed.data.email}. Ábrelo para activar tu cuenta.`,
  };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(AUTH_ROUTES.login);
}
