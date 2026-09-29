/**
 * Tipos de la base de datos de Supabase.
 *
 * Escritos a mano siguiendo el formato de `supabase gen types`. Deben coincidir
 * con supabase/migrations/. Para regenerarlos automáticamente:
 * `npx supabase gen types typescript --project-id <id> > types/database.ts`
 */
export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          slug: string;
          status: ProjectStatus;
          content: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          slug: string;
          status?: ProjectStatus;
          content?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          status?: ProjectStatus;
          content?: Json | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProjectStatus = "draft" | "published";

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
