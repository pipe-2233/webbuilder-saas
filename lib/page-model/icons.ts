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
