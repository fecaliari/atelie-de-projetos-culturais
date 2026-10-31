export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      answer_versions: {
        Row: {
          answer_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          answer_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          answer_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_versions_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
        ]
      }
      answers: {
        Row: {
          content: string
          field_key: string
          id: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          field_key: string
          id?: string
          project_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          content?: string
          field_key?: string
          id?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          notes: string | null
          occurrences: number
          position: number
          project_id: string
          quantity: number
          unit: string
          unit_value: number
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          occurrences?: number
          position?: number
          project_id: string
          quantity?: number
          unit?: string
          unit_value?: number
          user_id?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          occurrences?: number
          position?: number
          project_id?: string
          quantity?: number
          unit?: string
          unit_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          created_at: string
          id: string
          mime: string | null
          name: string
          path: string
          project_id: string
          size: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mime?: string | null
          name: string
          path: string
          project_id: string
          size?: number | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          mime?: string | null
          name?: string
          path?: string
          project_id?: string
          size?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          accessibility: Json
          category: string | null
          created_at: string
          democratization: Json
          format: string | null
          id: string
          languages: string[]
          last_opened_at: string
          mechanism: string | null
          name: string
          proponent_name: string | null
          proponent_type: string | null
          status: string
          summary: string | null
          template_ref: string
          territory: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accessibility?: Json
          category?: string | null
          created_at?: string
          democratization?: Json
          format?: string | null
          id?: string
          languages?: string[]
          last_opened_at?: string
          mechanism?: string | null
          name: string
          proponent_name?: string | null
          proponent_type?: string | null
          status?: string
          summary?: string | null
          template_ref?: string
          territory?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          accessibility?: Json
          category?: string | null
          created_at?: string
          democratization?: Json
          format?: string | null
          id?: string
          languages?: string[]
          last_opened_at?: string
          mechanism?: string | null
          name?: string
          proponent_name?: string | null
          proponent_type?: string | null
          status?: string
          summary?: string | null
          template_ref?: string
          territory?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schedule_items: {
        Row: {
          activity: string
          created_at: string
          duration: string | null
          end_date: string | null
          id: string
          location: string | null
          phase: string
          position: number
          project_id: string
          start_date: string | null
          user_id: string
        }
        Insert: {
          activity?: string
          created_at?: string
          duration?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          phase?: string
          position?: number
          project_id: string
          start_date?: string | null
          user_id?: string
        }
        Update: {
          activity?: string
          created_at?: string
          duration?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          phase?: string
          position?: number
          project_id?: string
          start_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          name: string
          position: number
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          position?: number
          project_id: string
          role?: string
          user_id?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          position?: number
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          base_key: string | null
          created_at: string
          fields: Json
          id: string
          mechanism: string | null
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          base_key?: string | null
          created_at?: string
          fields?: Json
          id?: string
          mechanism?: string | null
          name: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          base_key?: string | null
          created_at?: string
          fields?: Json
          id?: string
          mechanism?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
