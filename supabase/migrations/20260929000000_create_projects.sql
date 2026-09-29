-- Etapa 4: tabla de proyectos (una página web por proyecto).
-- Ejecutar una sola vez en Supabase -> SQL Editor.

-- ---------------------------------------------------------------------------
-- Tabla
-- ---------------------------------------------------------------------------
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid()
                references auth.users (id) on delete cascade,
  name        text not null
                check (char_length(btrim(name)) between 1 and 80),
  -- Identificador público; se usará como subdominio al publicar.
  slug        text not null unique
                check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$'),
  status      text not null default 'draft'
                check (status in ('draft', 'published')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.projects is 'Proyectos (sitios web) de cada usuario.';

create index projects_user_id_updated_at_idx
  on public.projects (user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Seguridad a nivel de fila (RLS): cada usuario solo accede a sus proyectos.
-- ---------------------------------------------------------------------------
alter table public.projects enable row level security;

create policy "Los usuarios ven sus proyectos"
  on public.projects for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Los usuarios crean sus proyectos"
  on public.projects for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Los usuarios editan sus proyectos"
  on public.projects for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Los usuarios borran sus proyectos"
  on public.projects for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Solo se pueden editar estas columnas (no el dueño, el id ni las fechas).
-- Supabase concede UPDATE sobre toda la tabla por defecto, así que se retira
-- y se vuelve a conceder por columnas.
revoke update on public.projects from authenticated, anon;
grant update (name, slug, status) on public.projects to authenticated;
