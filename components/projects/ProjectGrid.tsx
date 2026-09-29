import Link from "next/link";

import { editorPath } from "@/lib/auth/routes";
import type { ProjectSummary } from "@/types/project";

import { ProjectCard } from "./ProjectCard";

type ProjectGridProps = {
  projects: ProjectSummary[];
};

/**
 * Tamaño de cada tarjeta en la cuadrícula bento:
 * - La primera (la más reciente) ocupa 2×2.
 * - Cada 5 tarjetas, una ocupa 2 columnas para romper la monotonía.
 * `grid-flow-dense` rellena los huecos que dejan las tarjetas grandes.
 */
function tileClass(index: number): string {
  if (index === 0) return "sm:col-span-2 sm:row-span-2";
  if (index % 5 === 3) return "sm:col-span-2";
  return "";
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  return (
    <ul className="grid grid-flow-dense auto-rows-[minmax(10rem,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {projects.map((project, index) => (
        <li key={project.id} className={tileClass(index)}>
          <Link
            href={editorPath(project.id)}
            className="block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-50"
          >
            <ProjectCard project={project} featured={index === 0} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
