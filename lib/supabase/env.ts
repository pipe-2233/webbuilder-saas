/**
 * Variables de entorno públicas de Supabase.
 *
 * Se leen con `process.env.NEXT_PUBLIC_*` de forma literal para que Next.js
 * pueda incrustarlas en el bundle del navegador.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Faltan variables de entorno de Supabase: NEXT_PUBLIC_SUPABASE_URL y " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. En local, defínelas en .env.local " +
        "(ver .env.example). En Netlify o Vercel, añádelas en la configuración de " +
        "variables de entorno del sitio y vuelve a desplegar.",
    );
  }

  return { url, publishableKey };
}
