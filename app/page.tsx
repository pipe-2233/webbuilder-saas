import Link from "next/link";

import { AUTH_ROUTES } from "@/lib/auth/routes";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">WebBuilder SaaS</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Crea y publica tu página web sin saber programar.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href={AUTH_ROUTES.register}
          className="inline-flex h-10 items-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Crear cuenta
        </Link>
        <Link
          href={AUTH_ROUTES.login}
          className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Iniciar sesión
        </Link>
      </div>
    </main>
  );
}
