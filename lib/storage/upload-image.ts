import { createClient } from "@/lib/supabase/client";

import { IMAGE_BUCKET, imagePath, validateImageFile } from "./images";

export type UploadResult = { url: string; error: null } | { url: null; error: string };

/**
 * Sube una imagen al bucket público desde el navegador y devuelve su URL.
 * Las políticas de Storage solo permiten subir a la carpeta del propio usuario.
 */
export async function uploadImage(file: File, userId: string, projectId: string): Promise<UploadResult> {
  const invalid = validateImageFile(file);
  if (invalid) return { url: null, error: invalid };

  const supabase = createClient();
  const path = imagePath(userId, projectId, file.type, crypto.randomUUID());
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });

  if (error) {
    console.error("[uploadImage]", error.message);
    const message = /bucket not found/i.test(error.message)
      ? "El almacenamiento de imágenes aún no está configurado en Supabase."
      : "No se pudo subir la imagen. Inténtalo de nuevo.";
    return { url: null, error: message };
  }

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
