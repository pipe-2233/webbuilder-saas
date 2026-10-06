/** Iconos disponibles para los botones (el dibujo está en components/page-renderer/icons.tsx). */
export const BUTTON_ICONS = {
  none: "Sin icono",
  whatsapp: "WhatsApp",
  phone: "Teléfono",
  mail: "Correo",
  calendar: "Calendario",
  arrow: "Flecha",
  location: "Ubicación",
} as const;

export type ButtonIcon = keyof typeof BUTTON_ICONS;
export const BUTTON_ICON_KEYS = Object.keys(BUTTON_ICONS) as [ButtonIcon, ...ButtonIcon[]];

/** Iconos para características, ventajas y listas. */
export const FEATURE_ICONS = {
  none: "Sin icono",
  check: "Visto bueno",
  document: "Documento",
  wallet: "Dinero",
  zap: "Energía",
  home: "Casa",
  map: "Mapa",
  location: "Ubicación",
  shield: "Seguridad",
  star: "Estrella",
  heart: "Corazón",
  clock: "Reloj",
  leaf: "Naturaleza",
  key: "Llave",
  users: "Personas",
  phone: "Teléfono",
  truck: "Envíos",
} as const;

export type FeatureIcon = keyof typeof FEATURE_ICONS;
export const FEATURE_ICON_KEYS = Object.keys(FEATURE_ICONS) as [FeatureIcon, ...FeatureIcon[]];
