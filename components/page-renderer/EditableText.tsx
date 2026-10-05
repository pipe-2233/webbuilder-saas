"use client";

import { useLayoutEffect, useRef, type CSSProperties, type KeyboardEvent, type SyntheticEvent } from "react";

import type { Path } from "@/lib/editor/set-in";
import type { ElementKey } from "@/lib/page-model/elements";
import { splitHighlight } from "@/lib/page-model/highlight";

import { usePageEdit } from "./edit-context";

type Tag = "h1" | "h2" | "h3" | "p" | "span" | "figcaption";

type EditableTextProps = {
  sectionId: string;
  /** Ruta del texto dentro de `props` de la sección. */
  path: Path;
  value: string;
  as?: Tag;
  className?: string;
  maxLength: number;
  /** Texto de ayuda cuando está vacío (solo en el editor). */
  placeholder: string;
  /** Permite saltos de línea (párrafos). */
  multiline?: boolean;
  /** No puede quedar vacío: si se borra todo, se recupera el texto anterior. */
  required?: boolean;
  /** Estilo propio del elemento (fuente, tamaño, color...). */
  style?: CSSProperties;
  /** Elemento al que pertenece; al hacer clic se selecciona en el editor. */
  elementKey?: ElementKey;
  /** Frase del texto que se pinta con el color principal. */
  highlight?: string;
};

const HIGHLIGHT_CLASS = "text-(--page-primary)";

/**
 * Texto de la página.
 * - En la página publicada: texto normal (y nada si está vacío).
 * - En el editor: se edita haciendo clic y escribiendo directamente.
 */
export function EditableText(props: EditableTextProps) {
  const edit = usePageEdit();
  const { as: Component = "span", value, className, style, sectionId, elementKey, highlight = "" } = props;

  if (!edit) {
    if (!value) return null;
    return (
      <Component className={className} style={style}>
        {splitHighlight(value, highlight).map((part, index) =>
          part.highlight ? (
            <span key={index} className={HIGHLIGHT_CLASS}>
              {part.text}
            </span>
          ) : (
            part.text
          ),
        )}
      </Component>
    );
  }
  return (
    <InlineEditor
      {...props}
      onChange={(text) => edit.updateField(sectionId, props.path, text)}
      onSelect={elementKey ? (additive) => edit.selectElement(sectionId, elementKey, additive) : undefined}
    />
  );
}

function InlineEditor({
  as: Component = "span",
  value,
  className,
  maxLength,
  placeholder,
  multiline = false,
  required = false,
  style,
  highlight = "",
  onChange,
  onSelect,
}: EditableTextProps & { onChange: (value: string) => void; onSelect?: (additive: boolean) => void }) {
  const ref = useRef<HTMLElement>(null);
  const valueOnFocus = useRef(value);

  // El contenido lo gestiona el navegador mientras se escribe (así el cursor
  // no salta). Solo se sincroniza cuando el valor cambia desde fuera, p. ej.
  // desde el panel lateral.
  useLayoutEffect(() => {
    const element = ref.current;
    if (element && document.activeElement !== element) paint(element, value, highlight);
  }, [value, highlight]);

  function handleInput() {
    const element = ref.current;
    if (!element) return;
    let text = readText(element);
    if (!multiline) text = text.replace(/\s*\n\s*/g, " ");
    if (text.length > maxLength) {
      text = text.slice(0, maxLength);
      element.textContent = text;
      moveCaretToEnd(element);
    }
    onChange(text);
  }

  function handleBlur() {
    const element = ref.current;
    if (!element) return;
    const text = readText(element).trim();
    if (required && !text) {
      paint(element, valueOnFocus.current, highlight);
      onChange(valueOnFocus.current);
    } else {
      if (text !== readText(element)) onChange(text);
      // Al terminar de escribir se vuelve a pintar el resaltado.
      paint(element, text, highlight);
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    // Que las teclas no lleguen a la sección (Intro/Espacio la seleccionan).
    event.stopPropagation();
    if (event.key === "Escape" || (event.key === "Enter" && !multiline)) {
      event.preventDefault();
      ref.current?.blur();
    }
  }

  // Pulsar sobre el texto no debe empezar a arrastrar la sección.
  const stop = (event: SyntheticEvent) => event.stopPropagation();

  return (
    <Component
      ref={(node: HTMLElement | null) => {
        ref.current = node;
      }}
      contentEditable="plaintext-only"
      role="textbox"
      aria-multiline={multiline}
      aria-label={placeholder}
      data-placeholder={placeholder}
      spellCheck
      onInput={handleInput}
      onFocus={() => (valueOnFocus.current = value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onMouseDown={stop}
      onTouchStart={stop}
      onClick={(event) => {
        // Seleccionar el elemento (no la sección entera).
        if (!onSelect) return;
        event.stopPropagation();
        onSelect(event.shiftKey || event.ctrlKey || event.metaKey);
      }}
      style={style}
      className={`${className ?? ""} ${multiline ? "whitespace-pre-wrap" : ""} min-w-8 cursor-text rounded-sm outline-none hover:bg-blue-500/5 focus:bg-white/60 focus:ring-2 focus:ring-blue-400/70 empty:before:pointer-events-none empty:before:opacity-40 empty:before:content-[attr(data-placeholder)]`}
    />
  );
}

/**
 * Escribe el texto en el elemento, con la frase resaltada en su propio span.
 * Se usa la API del DOM (no HTML) para que ningún texto se interprete como código.
 */
function paint(element: HTMLElement, value: string, highlight: string) {
  const parts = splitHighlight(value, highlight);
  const current = [...element.childNodes];
  const same =
    current.length === parts.length &&
    parts.every((part, i) => {
      const node = current[i];
      return part.highlight
        ? node instanceof HTMLSpanElement && node.textContent === part.text
        : node.nodeType === Node.TEXT_NODE && node.textContent === part.text;
    });
  if (same) return;
  element.replaceChildren(
    ...parts.map((part) => {
      if (!part.highlight) return document.createTextNode(part.text);
      const span = document.createElement("span");
      span.className = HIGHLIGHT_CLASS;
      span.textContent = part.text;
      return span;
    }),
  );
}

/** Texto del elemento; quita el salto final que algunos navegadores añaden. */
function readText(element: HTMLElement): string {
  return element.innerText.replace(/\n$/, "");
}

function moveCaretToEnd(element: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}
