"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { register, type AuthFormState } from "@/lib/auth/actions";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/validation";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(register, {});

  if (state.success) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="success">{state.success}</Alert>
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          ¿Ya confirmaste tu correo?{" "}
          <Link href={AUTH_ROUTES.login} className="font-medium underline underline-offset-4">
            Inicia sesión
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error && <Alert variant="error">{state.error}</Alert>}

      <TextField
        name="email"
        type="email"
        label="Correo electrónico"
        autoComplete="email"
        defaultValue={state.email}
        error={state.fieldErrors?.email}
        required
      />
      <TextField
        name="password"
        type="password"
        label="Contraseña"
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
        placeholder={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres, con letras y números`}
        error={state.fieldErrors?.password}
        required
      />
      <TextField
        name="confirmPassword"
        type="password"
        label="Confirmar contraseña"
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword}
        required
      />

      <Button type="submit" loading={pending}>
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </Button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        ¿Ya tienes cuenta?{" "}
        <Link href={AUTH_ROUTES.login} className="font-medium underline underline-offset-4">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
