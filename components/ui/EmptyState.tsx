import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  /** Acción opcional (p. ej. un botón para crear el primer elemento). */
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 px-6 py-16 text-center dark:border-zinc-700">
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="max-w-sm text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
