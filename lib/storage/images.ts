/** Reglas de las imágenes subidas (deben coincidir con el bucket en Supabase). */
export const IMAGE_BUCKET = "project-assets";
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const IMAGE_ACCEPT = Object.keys(EXTENSIONS).join(",");

/** Devuelve un mensaje de error si el archivo no se puede subir, o null si es válido. */
export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!(file.type in EXTENSIONS)) return "Formato no admitido. Usa JPG, PNG, WebP o GIF.";
  if (file.size > IMAGE_MAX_BYTES) return "La imagen pesa más de 5 MB. Usa una más ligera.";
  if (file.size === 0) return "El archivo está vacío.";
  return null;
}

/** Ruta del archivo en el bucket: <usuario>/<proyecto>/<id aleatorio>.<ext>. */
export function imagePath(userId: string, projectId: string, mimeType: string, fileId: string): string {
  return `${userId}/${projectId}/${fileId}.${EXTENSIONS[mimeType]}`;
}
