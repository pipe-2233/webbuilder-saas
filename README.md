# WebBuilder SaaS

Plataforma SaaS para crear, editar, personalizar, guardar y publicar páginas web sin necesidad de programar.

## Estado

- **Etapa 1 – Configuración inicial:** Next.js (App Router) + TypeScript + Tailwind CSS + clientes de Supabase.
- **Etapa 2 – Autenticación:** registro con confirmación de correo, inicio y cierre de sesión, rutas protegidas.
- **Etapa 3 – Dashboard:** layout protegido a ancho completo con cabecera (usuario y cierre de sesión) y vista "Mis proyectos" en cuadrícula bento.
- **Etapa 4 – Base de datos:** tabla `projects` con RLS (cada usuario solo accede a sus proyectos).
- **Etapa 5 – Modelo de página:** documento JSON validado con Zod, guardado en `projects.content`.
- **Etapa 6 – Editor visual:** secciones arrastrables, edición de textos sobre la página, estilo por
  elemento (fuente, tamaño, color, botones), posición libre en escritorio y columna en móvil, colores
  y fuentes del sitio, imágenes y guardado automático.

## Modelo de página

Cada proyecto guarda su página como un documento JSON en `projects.content`
(`NULL` = todavía sin editar; se usa la página inicial).

```
PageDocument
├── version   1
├── meta      { title, description }            SEO
├── theme     { colors: { primary, background, text, muted }, fonts: { heading, body } }
└── sections  Section[]  (máx. 50, en orden)
      └── { id, type, background?, props }
```

| Tipo       | Props                                                            |
| ---------- | ---------------------------------------------------------------- |
| `header`   | `logoText`, `links[]`                                            |
| `hero`     | `title`, `subtitle`, `buttonLabel`, `buttonHref`, `imageUrl`, `align` |
| `text`     | `title`, `body`                                                  |
| `image`    | `src`, `alt`, `caption`                                          |
| `features` | `title`, `items[]` (`title`, `description`)                      |
| `footer`   | `text`, `links[]`                                                |

- `lib/page-model/schema.ts` – esquema Zod (fuente única de los tipos).
- `lib/page-model/defaults.ts` – página inicial y secciones nuevas.
- `lib/page-model/parse.ts` – validación segura (`parsePageDocument`).
- `lib/projects/content.ts` – cargar el documento de un proyecto (servidor).
- `lib/projects/actions.ts` – `savePageContent` (Server Action, valida antes de guardar).

Los enlaces solo aceptan `https://`, `http://`, `mailto:`, `tel:`, `#ancla` y `/ruta`
(se bloquean `javascript:` y `data:`). Las imágenes solo `https://` o rutas locales.

## Base de datos

Las migraciones están en `supabase/migrations/`. Para aplicarlas, copia el contenido de cada archivo
(en orden) en Supabase → *SQL Editor* y ejecútalo. Los tipos de `types/database.ts` deben coincidir
con el esquema.

Las imágenes que se suben desde el editor van al bucket público `project-assets` de Supabase Storage,
en la carpeta `<usuario>/<proyecto>/`. Solo JPG, PNG, WebP o GIF de hasta 5 MB.

## Requisitos

- Node.js 20.9 o superior
- npm

## Variables de entorno

1. Crea un proyecto en [Supabase](https://supabase.com/dashboard).
2. Copia `.env.example` como `.env.local` (ya existe uno vacío).
3. En Supabase → *Project Settings → API*, copia la **Project URL** y la **Publishable key** en:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

4. Reinicia `npm run dev` después de cambiar `.env.local`.

La clave secreta (`service_role`) nunca debe llevar el prefijo `NEXT_PUBLIC_`.

## Supabase

- `lib/supabase/client.ts` – cliente para Client Components.
- `lib/supabase/server.ts` – cliente para Server Components, Server Actions y Route Handlers.
- `lib/supabase/env.ts` – lectura y validación de las variables.
- `lib/supabase/proxy.ts` – refresco de sesión y reglas de acceso (usado por `proxy.ts`).
- `types/database.ts` – tipos de la base de datos (provisional hasta la Etapa 4).

## Autenticación

| Ruta             | Descripción                                             |
| ---------------- | ------------------------------------------------------- |
| `/register`      | Registro con correo y contraseña                        |
| `/login`         | Inicio de sesión                                        |
| `/auth/callback` | Destino del enlace de confirmación de correo            |
| `/dashboard`     | Ruta protegida (sin sesión redirige a `/login`)         |

- La lógica está en `lib/auth/` (acciones de servidor, validación, rutas y mensajes de error).
- `proxy.ts` refresca la sesión en cada petición y redirige según las reglas de `lib/auth/routes.ts`.
- En Supabase → *Authentication → URL Configuration*, añade `http://localhost:3000/**` a **Redirect URLs**
  (y tu dominio de producción cuando despliegues).

## Scripts

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo en http://localhost:3000
npm run build    # compilación de producción
npm run start    # servir la compilación
npm run lint     # ESLint
npm test         # pruebas (Vitest)
```

## Estructura

```
app/         Rutas y layouts (App Router)
components/  Componentes reutilizables de UI
hooks/       Hooks de React
lib/         Clientes y lógica compartida
types/       Tipos de TypeScript
utils/       Funciones utilitarias
public/      Archivos estáticos
.env.local   Variables de entorno locales (no versionado)
```
