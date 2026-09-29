import type { Metadata } from "next";

import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireUser } from "@/lib/auth/session";
import { listProjects } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "Mis proyectos | WebBuilder SaaS" };

export default async function DashboardPage() {
  // El layout no se vuelve a ejecutar en cada navegación, así que cada página
  // comprueba la sesión por su cuenta (la llamada está memorizada por petición).
  await requireUser();
  const result = await listProjects();

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Mis proyectos</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Aquí verás las páginas web que crees.
        </p>
      </div>

      {result.error !== null ? (
        <Alert variant="error">{result.error}</Alert>
      ) : result.data.length > 0 ? (
        <ProjectGrid projects={result.data} />
      ) : (
        <EmptyState
          title="Aún no tienes proyectos"
          description="Cuando crees tu primera página web aparecerá aquí para que puedas editarla y publicarla."
        />
      )}
    </>
  );
}
