import type { ProjectSummary } from "@/types/project";

type ProjectCardProps = {
  project: ProjectSummary;
  featured?: boolean;
};

const STATUS = {
  draft: {
    label: "Borrador",
    className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
  published: {
    label: "Publicado",
    className: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  },
} as const;

const dateFormatter = new Intl.DateTimeFormat("es", { dateStyle: "medium" });

export function ProjectCard({ project, featured = false }: ProjectCardProps) {
  const status = STATUS[project.status];

  return (
    <article className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3">
        <h2
          className={`min-w-0 break-words font-semibold tracking-tight ${featured ? "text-2xl" : "text-lg"}`}
        >
          {project.name}
        </h2>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        <span className="truncate font-mono text-xs">{project.slug}</span>
        <span>Editado el {dateFormatter.format(new Date(project.updated_at))}</span>
      </div>
    </article>
  );
}
