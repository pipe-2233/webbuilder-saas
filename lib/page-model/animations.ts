/**
 * Catálogo de animaciones de los elementos.
 * - Entrada: se reproduce una vez cuando el elemento aparece en pantalla.
 * - Continua: se repite sin parar (flotar, latir...).
 * - Al pasar el ratón: reacciona cuando el visitante pasa el puntero por encima.
 *
 * Cada clave tiene su clase CSS en app/globals.css (animate-*, loop-*, hover-*).
 */

export const ENTRANCE_ANIMATIONS = {
  curtain: { label: "Cortina", description: "Se descubre de arriba abajo, como un telón." },
  "blur-in": { label: "Enfoque", description: "Aparece desenfocado y se vuelve nítido." },
  "flip-3d": { label: "Giro 3D", description: "Gira desde atrás, como una tarjeta." },
  elastic: { label: "Rebote elástico", description: "Crece con un rebote juguetón." },
  typewriter: { label: "Máquina de escribir", description: "Se va revelando de izquierda a derecha." },
  glitch: { label: "Glitch", description: "Entra con un parpadeo digital." },
  spotlight: { label: "Foco", description: "Se abre desde el centro como un círculo de luz." },
  "rise-skew": { label: "Despegue", description: "Sube inclinado y se endereza." },
  "fade-in": { label: "Aparecer", description: "Aparece suavemente (clásica)." },
  "slide-up": { label: "Subir", description: "Sube desde abajo (clásica)." },
  "slide-right": { label: "Desde el lado", description: "Entra desde la izquierda (clásica)." },
  "zoom-in": { label: "Acercar", description: "Crece un poco al aparecer (clásica)." },
} as const;

export const LOOP_ANIMATIONS = {
  float: { label: "Flotar", description: "Sube y baja suavemente." },
  pulse: { label: "Latido", description: "Late como un corazón. Ideal para botones." },
  shine: { label: "Brillo", description: "Un destello cruza el elemento cada pocos segundos." },
  wobble: { label: "Balanceo", description: "Se mece de lado a lado." },
  "gradient-text": { label: "Degradado vivo", description: "El texto cambia de color en movimiento." },
  glow: { label: "Neón", description: "Un resplandor con el color principal que respira." },
  "spin-slow": { label: "Giro lento", description: "Da vueltas despacio. Ideal para imágenes o insignias." },
} as const;

export const HOVER_EFFECTS = {
  lift: { label: "Elevar", description: "Sube un poco y proyecta sombra." },
  grow: { label: "Crecer", description: "Se agranda ligeramente." },
  tilt: { label: "Inclinar 3D", description: "Se inclina en perspectiva." },
  glow: { label: "Resplandor", description: "Se ilumina con el color principal." },
  underline: { label: "Subrayado", description: "Una línea se dibuja bajo el texto." },
  shake: { label: "Sacudir", description: "Tiembla un instante. Llama la atención." },
} as const;

export type EntranceAnimation = keyof typeof ENTRANCE_ANIMATIONS;
export type LoopAnimation = keyof typeof LOOP_ANIMATIONS;
export type HoverEffect = keyof typeof HOVER_EFFECTS;

export const ENTRANCE_KEYS = Object.keys(ENTRANCE_ANIMATIONS) as [EntranceAnimation, ...EntranceAnimation[]];
export const LOOP_KEYS = Object.keys(LOOP_ANIMATIONS) as [LoopAnimation, ...LoopAnimation[]];
export const HOVER_KEYS = Object.keys(HOVER_EFFECTS) as [HoverEffect, ...HoverEffect[]];

/** Retrasos disponibles para la animación de entrada (ms), para escalonar elementos. */
export const ANIMATION_DELAYS = [0, 150, 300, 500, 800, 1200] as const;
