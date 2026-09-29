-- Etapa 6: imágenes subidas desde el editor (Supabase Storage).
-- Ejecutar una sola vez en Supabase -> SQL Editor.
--
-- Bucket público: las imágenes se ven en las páginas publicadas sin iniciar
-- sesión. Cada usuario solo puede subir y borrar dentro de su carpeta:
--   project-assets/<id del usuario>/<id del proyecto>/<archivo>
-- Solo imágenes rasterizadas (sin SVG, que puede contener código) y hasta 5 MB.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-assets',
  'project-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "Los usuarios suben imágenes a su carpeta"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Los usuarios ven sus imágenes"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Los usuarios borran sus imágenes"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
