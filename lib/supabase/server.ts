import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

import { getSupabaseEnv } from "./env";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 * Crea una instancia nueva por petición; no la guardes en una variable global.
 */
export async function createClient() {
  // Primero las cookies: así Next.js sabe desde el principio que la página
  // depende de la petición (es dinámica) y no intenta generarla al compilar.
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseEnv();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Llamado desde un Server Component, donde no se pueden escribir cookies.
          // No pasa nada: el proxy de sesión (proxy.ts) ya las renueva.
        }
      },
    },
  });
}
