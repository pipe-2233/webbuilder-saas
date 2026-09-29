import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Crear cuenta | WebBuilder SaaS" };

export default function RegisterPage() {
  return (
    <AuthCard title="Crear cuenta" description="Regístrate para empezar a crear tus páginas web.">
      <RegisterForm />
    </AuthCard>
  );
}
