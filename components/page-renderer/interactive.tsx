"use client";

import { Check, Copy, Menu, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { formatCount, parseCountValue } from "@/lib/page-model/count";
import type { NavLink } from "@/lib/page-model/schema";

import { usePageEdit } from "./edit-context";

/**
 * Número que cuenta desde 0 cuando aparece en pantalla.
 * - En el servidor y sin JavaScript se ve el valor final (buscadores incluidos).
 * - En el editor y con "reducir movimiento" no se anima.
 */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const edit = usePageEdit();
  const ref = useRef<HTMLSpanElement>(null);
  const [text, setText] = useState(value);
  const parts = parseCountValue(value);

  useLayoutEffect(() => {
    const node = ref.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (edit || !parts || !node || reduced) {
      setText(value);
      return;
    }
    // Antes de pintar se pone a 0; al verse, cuenta hasta el valor.
    setText(formatCount(0, parts));
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const duration = 1600;
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setText(formatCount(parts.target * eased, parts));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
    // `parts` se deriva de `value`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, edit]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}

/** Botón "Copiar número" (en el editor no copia, solo se muestra). */
export function CopyButton({ text, label, className }: { text: string; label: string; className?: string }) {
  const edit = usePageEdit();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        if (edit) return;
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
        } catch {
          // Sin permiso para copiar: no pasa nada, el número sigue a la vista.
        }
      }}
    >
      {copied ? <Check className="size-5" aria-hidden /> : <Copy className="size-5" aria-hidden />}
      <span aria-live="polite">{copied ? "¡Copiado!" : label}</span>
    </button>
  );
}

/** Menú de la cabecera en pantallas estrechas: botón ☰ y lista desplegable. */
export function MobileMenu({ links }: { links: NavLink[] }) {
  const edit = usePageEdit();
  const [open, setOpen] = useState(false);
  if (links.length === 0) return null;

  return (
    <div className="relative @2xl:hidden">
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className="flex size-11 items-center justify-center rounded-xl bg-current/10"
      >
        {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
      </button>
      {open && (
        <ul className="absolute top-full right-0 z-50 mt-2 flex min-w-48 flex-col rounded-xl bg-(--page-bg) p-2 text-(--page-text) shadow-xl ring-1 ring-black/10">
          {links.map((link) => (
            <li key={link.id}>
              {edit ? (
                <span className="block rounded-lg px-3 py-2 font-medium">{link.label}</span>
              ) : (
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 font-medium hover:bg-current/5"
                >
                  {link.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
