/**
 * Guías magnéticas al mover elementos en posición libre: si un borde o el
 * centro del elemento queda cerca (en píxeles) de un borde o el centro de la
 * sección o de otro elemento, se ajusta para quedar alineado y se devuelve la
 * línea de guía que hay que dibujar.
 */

export type Box = { left: number; top: number; width: number; height: number };

export type SnapResult = {
  /** Desplazamiento a aplicar para quedar alineado. */
  dx: number;
  dy: number;
  /** Guías verticales (posición x en píxeles) y horizontales (posición y). */
  guides: { x: number[]; y: number[] };
};

export const SNAP_THRESHOLD = 6;

function lines(start: number, size: number): number[] {
  return [start, start + size / 2, start + size];
}

/** Mejor ajuste de un eje: el más cercano dentro del umbral. */
function bestSnap(moving: number[], targets: number[], threshold: number): { delta: number; at: number } | null {
  let best: { delta: number; at: number } | null = null;
  for (const m of moving) {
    for (const t of targets) {
      const delta = t - m;
      if (Math.abs(delta) <= threshold && (!best || Math.abs(delta) < Math.abs(best.delta))) {
        best = { delta, at: t };
      }
    }
  }
  return best;
}

/**
 * @param moving   caja del elemento que se mueve (en píxeles, relativa a la sección)
 * @param others   cajas de los demás elementos de la sección
 * @param area     tamaño de la zona de contenido de la sección
 */
export function snapBox(
  moving: Box,
  others: Box[],
  area: { width: number; height: number },
  threshold = SNAP_THRESHOLD,
): SnapResult {
  const xTargets = [...lines(0, area.width), ...others.flatMap((o) => lines(o.left, o.width))];
  const yTargets = [...lines(0, area.height), ...others.flatMap((o) => lines(o.top, o.height))];

  const x = bestSnap(lines(moving.left, moving.width), xTargets, threshold);
  const y = bestSnap(lines(moving.top, moving.height), yTargets, threshold);

  return {
    dx: x?.delta ?? 0,
    dy: y?.delta ?? 0,
    guides: { x: x ? [x.at] : [], y: y ? [y.at] : [] },
  };
}
