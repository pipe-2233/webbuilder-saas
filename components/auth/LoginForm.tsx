"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { login, type AuthFormState } from "@/lib/auth/actions";
import { AUTH_ROUTES } from "@/lib/auth/routes";

type LoginFormProps = {
  next?: string;
  initialError?: string;
};

export function LoginForm({ next, initialError }: LoginFormProps) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(login, {
    error: initialError,
  });

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {next && <input type="hidden" name="next" value={next} />}

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
        autoComplete="current-password"
        error={state.fieldErrors?.password}
        required
      />

      <Button type="submit" loading={pending}>
        {pending ? "Iniciando sesión..." : "Iniciar sesión"}
      </Button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        ¿No tienes cuenta?{" "}
        <Link href={AUTH_ROUTES.register} className="font-medium underline underline-offset-4">
          Regístrate
        </Link>
      </p>
    </form>
  );
}
