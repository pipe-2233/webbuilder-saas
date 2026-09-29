export type Path = readonly (string | number)[];

/**
 * Devuelve una copia de `target` con `value` en la ruta `path`, sin modificar
 * el original (solo se copian los objetos y listas de la ruta).
 * Si la ruta no existe o el valor no cambia, devuelve `target` tal cual.
 */
export function setIn<T>(target: T, path: Path, value: unknown): T {
  if (path.length === 0) return value as T;
  const [key, ...rest] = path;

  if (Array.isArray(target)) {
    if (typeof key !== "number" || key < 0 || key >= target.length) return target;
    const child = setIn(target[key], rest, value);
    if (child === target[key]) return target;
    const copy = [...target];
    copy[key] = child;
    return copy as T;
  }

  if (target !== null && typeof target === "object") {
    const record = target as Record<string, unknown>;
    if (typeof key !== "string" || !Object.hasOwn(record, key)) return target;
    const child = setIn(record[key], rest, value);
    if (child === record[key]) return target;
    return { ...record, [key]: child } as T;
  }

  return target;
}
