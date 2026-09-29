import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Iniciar sesión | WebBuilder SaaS" };

const QUERY_ERRORS: Record<string, string> = {
  confirmation: "El enlace de confirmación no es válido o ha caducado. Inicia sesión o regístrate de nuevo.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;

  return (
    <AuthCard title="Iniciar sesión" description="Accede a tu cuenta para gestionar tus páginas.">
      <LoginForm
        next={typeof next === "string" ? next : undefined}
        initialError={typeof error === "string" ? QUERY_ERRORS[error] : undefined}
      />
    </AuthCard>
  );
}
