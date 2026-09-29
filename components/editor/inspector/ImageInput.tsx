"use client";

import { ImagePlus, Link2, Loader2, Trash2 } from "lucide-react";
import { useRef, useState, type DragEvent, type ReactNode } from "react";

import { imageSrc } from "@/lib/page-model/schema";
import { IMAGE_ACCEPT } from "@/lib/storage/images";
import { uploadImage } from "@/lib/storage/upload-image";

import { useEditorContext } from "../editor-context";

type ImageInputProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
};

/** Imagen: subir desde el equipo (clic o arrastrando el archivo) o pegar un enlace. */
export function ImageInput({ label, value, onChange }: ImageInputProps) {
  const { userId, projectId } = useEditorContext();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    const result = await uploadImage(file, userId, projectId);
    setUploading(false);
    if (result.error !== null) setError(result.error);
    else onChange(result.url);
  }

  function applyUrl() {
    const url = urlDraft.trim();
    if (!imageSrc.safeParse(url).success || !url) {
      setError("Pega un enlace a una imagen que empiece por https://");
      return;
    }
    setError(null);
    onChange(url);
    setShowUrl(false);
    setUrlDraft("");
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setDragOver(false);
    void upload(event.dataTransfer.files[0]);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</span>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
          dragOver ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40" : "border-zinc-300 dark:border-zinc-700"
        }`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa de una URL arbitraria.
          <img src={value} alt="" className="aspect-video w-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex aspect-video w-full flex-col items-center justify-center gap-1.5 text-xs text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <ImagePlus className="size-6" aria-hidden />
            Sube una foto o arrástrala aquí
            <span className="text-[11px] opacity-80">JPG, PNG, WebP o GIF · máx. 5 MB</span>
          </button>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-white/80 text-sm dark:bg-zinc-950/80">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Subiendo…
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(event) => {
          void upload(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div className="flex flex-wrap gap-1.5">
        <SmallButton onClick={() => fileRef.current?.click()} disabled={uploading}>
          <ImagePlus className="size-3.5" aria-hidden />
          {value ? "Cambiar foto" : "Subir foto"}
        </SmallButton>
        <SmallButton onClick={() => setShowUrl((v) => !v)} disabled={uploading}>
          <Link2 className="size-3.5" aria-hidden />
          Usar enlace
        </SmallButton>
        {value && (
          <SmallButton onClick={() => onChange("")} disabled={uploading} danger>
            <Trash2 className="size-3.5" aria-hidden />
            Quitar
          </SmallButton>
        )}
      </div>

      {showUrl && (
        <div className="flex gap-1.5">
          <input
            type="url"
            value={urlDraft}
            placeholder="https://…/foto.jpg"
            aria-label="Enlace de la imagen"
            onChange={(event) => setUrlDraft(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && applyUrl()}
            className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <SmallButton onClick={applyUrl}>Aplicar</SmallButton>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function SmallButton({
  children,
  onClick,
  disabled,
  danger = false,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
        danger
          ? "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
          : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}
