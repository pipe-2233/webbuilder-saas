"use client";

import { useId, useState, type ReactNode } from "react";

import { hrefError, normalizeHref } from "@/lib/page-model/links";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

type FieldProps = {
  label: string;
  hint?: string;
  error?: string | null;
  children: (id: string) => ReactNode;
};

/** Etiqueta + control + ayuda/error, con los ids accesibles conectados. */
export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      {children(id)}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : (
        hint && <p className="text-xs text-zinc-500">{hint}</p>
      )}
    </div>
  );
}

type TextInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  multiline?: boolean;
};

export function TextInput({ label, value, onChange, maxLength, placeholder, hint, required, multiline }: TextInputProps) {
  const error = required && !value.trim() ? "Este campo es obligatorio." : null;
  return (
    <Field label={label} hint={hint} error={error}>
      {(id) =>
        multiline ? (
          <textarea
            id={id}
            value={value}
            maxLength={maxLength}
            placeholder={placeholder}
            rows={5}
            onChange={(event) => onChange(event.target.value)}
            className={`${inputClass} resize-y`}
          />
        ) : (
          <input
            id={id}
            type="text"
            value={value}
            maxLength={maxLength}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
            className={inputClass}
          />
        )
      }
    </Field>
  );
}

type LinkInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Permite dejarlo vacío (p. ej. el botón de la portada). */
  optional?: boolean;
};

/** Enlace: completa https://, mailto: o tel: al salir del campo y avisa si no es válido. */
export function LinkInput({ label, value, onChange, optional = false }: LinkInputProps) {
  const [touched, setTouched] = useState(false);
  const error = touched && !(optional && value === "") ? hrefError(value) : null;
  return (
    <Field label={label} hint="Una web (miweb.com), un correo, un teléfono o #seccion." error={error}>
      {(id) => (
        <input
          id={id}
          type="text"
          inputMode="url"
          value={value}
          maxLength={2048}
          placeholder="miweb.com"
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => {
            setTouched(true);
            const normalized = normalizeHref(value);
            if (normalized !== value) onChange(normalized);
          }}
          className={inputClass}
        />
      )}
    </Field>
  );
}

type ColorInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
};

export function ColorInput({ label, value, onChange, hint }: ColorInputProps) {
  // El campo de texto admite valores a medio escribir; solo se aplica un color completo.
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-label={`${label}: selector de color`}
            className="h-8 w-10 shrink-0 cursor-pointer rounded border border-zinc-300 bg-transparent p-0.5 dark:border-zinc-700"
          />
          <input
            id={id}
            type="text"
            value={draft}
            maxLength={7}
            spellCheck={false}
            onChange={(event) => {
              const next = event.target.value.startsWith("#") ? event.target.value : `#${event.target.value}`;
              setDraft(next);
              if (/^#[0-9a-f]{6}$/i.test(next)) onChange(next.toLowerCase());
            }}
            onBlur={() => setDraft(value)}
            className={`${inputClass} font-mono uppercase`}
          />
        </div>
      )}
    </Field>
  );
}

type SegmentedProps<T extends string> = {
  label: string;
  value: T;
  options: { value: T; label: string; icon?: ReactNode }[];
  onChange: (value: T) => void;
};

export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            onClick={() => onChange(option.value)}
            className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              option.value === value
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            }`}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Título de un grupo de campos. */
export function PanelGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h3>
      {children}
    </section>
  );
}
