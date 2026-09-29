import type { AuthError } from "@supabase/supabase-js";

const MESSAGES: Record<string, string> = {
  invalid_credentials: "Correo o contraseña incorrectos.",
  email_not_confirmed:
    "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.",
  user_already_exists: "Ya existe una cuenta con este correo.",
  email_exists: "Ya existe una cuenta con este correo.",
  weak_password: "La contraseña es demasiado débil. Usa una más larga y variada.",
  over_email_send_rate_limit:
    "Se enviaron demasiados correos. Espera unos minutos e inténtalo de nuevo.",
  over_request_rate_limit: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
  signup_disabled: "El registro de nuevas cuentas está desactivado.",
};

/** Traduce un error de Supabase Auth a un mensaje para el usuario. */
export function authErrorMessage(error: AuthError): string {
  return (
    (error.code && MESSAGES[error.code]) || "Ocurrió un error inesperado. Inténtalo de nuevo."
  );
}
