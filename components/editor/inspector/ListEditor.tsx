"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ListEditorProps<T extends { id: string }> = {
  items: T[];
  max: number;
  /** Nombre en singular para los botones ("enlace", "característica"). */
  noun: string;
  create: () => T;
  onChange: (items: T[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
};

/** Lista editable: añadir, quitar y reordenar elementos. */
export function ListEditor<T extends { id: string }>({
  items,
  max,
  noun,
  create,
  onChange,
  renderItem,
}: ListEditorProps<T>) {
  function move(index: number, direction: -1 | 1) {
    const next = [...items];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 && <p className="text-xs text-zinc-500">No hay elementos.</p>}
      <ol className="flex flex-col gap-2">
        {items.map((item, index) => (
          <li key={item.id} className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-2.5 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">
                {capitalize(noun)} {index + 1}
              </span>
              <div className="flex">
                <IconButton label={`Subir ${noun} ${index + 1}`} disabled={index === 0} onClick={() => move(index, -1)}>
                  <ChevronUp className="size-3.5" />
                </IconButton>
                <IconButton
                  label={`Bajar ${noun} ${index + 1}`}
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ChevronDown className="size-3.5" />
                </IconButton>
                <IconButton label={`Quitar ${noun} ${index + 1}`} onClick={() => onChange(items.filter((i) => i.id !== item.id))}>
                  <Trash2 className="size-3.5" />
                </IconButton>
              </div>
            </div>
            {renderItem(item, index)}
          </li>
        ))}
      </ol>
      <button
        type="button"
        disabled={items.length >= max}
        onClick={() => onChange([...items, create()])}
        className="inline-flex items-center justify-center gap-1.5 rounded-md border border-dashed border-zinc-300 px-2 py-1.5 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
      >
        <Plus className="size-3.5" aria-hidden />
        {items.length >= max ? `Máximo ${max}` : `Añadir ${noun}`}
      </button>
    </div>
  );
}

function IconButton({
  label,
  children,
  ...props
}: { label: string; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
      {...props}
    >
      {children}
    </button>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
