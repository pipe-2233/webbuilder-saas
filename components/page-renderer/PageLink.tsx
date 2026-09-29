"use client";

import type { CSSProperties, ReactNode } from "react";

import { usePageEdit } from "./edit-context";

type PageLinkProps = { href: string; children: ReactNode; className?: string; style?: CSSProperties };

/**
 * Enlace de la página. En el editor se dibuja como <span> para que su texto se
 * pueda editar y un clic no navegue.
 */
export function PageLink({ href, children, className, style }: PageLinkProps) {
  const edit = usePageEdit();
  if (edit) {
    return (
      <span className={className} style={style}>
        {children}
      </span>
    );
  }

  const external = /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      className={className}
      style={style}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
