import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { logout } from "@/lib/auth/actions";
import { AUTH_ROUTES } from "@/lib/auth/routes";

type DashboardHeaderProps = {
  email: string;
};

export function DashboardHeader({ email }: DashboardHeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <Link href={AUTH_ROUTES.afterLogin} className="font-semibold tracking-tight">
          WebBuilder
        </Link>
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="hidden truncate text-sm text-zinc-600 sm:inline dark:text-zinc-400"
            title={email}
          >
            {email}
          </span>
          <form action={logout}>
            <Button type="submit" variant="secondary" className="h-9">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
