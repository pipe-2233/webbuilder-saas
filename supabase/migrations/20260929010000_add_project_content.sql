-- Etapa 5: contenido de la página (modelo de página) en cada proyecto.
-- Ejecutar una sola vez en Supabase -> SQL Editor, DESPUÉS de
-- 20260929000000_create_projects.sql.
--
-- `content` guarda el documento JSON definido en lib/page-model/schema.ts.
-- NULL significa "todavía sin contenido": la app usa la página inicial.
-- La validación completa se hace en el servidor (Zod); aquí solo se ponen
-- límites básicos de forma y tamaño.

alter table public.projects
  add column content jsonb
    check (content is null or jsonb_typeof(content) = 'object'),
  add constraint projects_content_size_check
    check (content is null or octet_length(content::text) <= 500000);

comment on column public.projects.content is
  'Documento de la página (lib/page-model/schema.ts). NULL = página inicial.';

-- Permitir que los usuarios editen el contenido de sus proyectos
-- (RLS ya limita la edición a los proyectos propios).
grant update (content) on public.projects to authenticated;
