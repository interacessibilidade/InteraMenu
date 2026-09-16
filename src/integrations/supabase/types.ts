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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      menu_items: {
        Row: {
          allergens: string[] | null
          audio_text: string | null
          audio_text_en: string | null
          audio_text_es: string | null
          audio_text_fr: string | null
          category: Database["public"]["Enums"]["menu_category"]
          created_at: string
          description: string | null
          description_en: string | null
          description_es: string | null
          description_fr: string | null
          id: string
          image_alt: string | null
          image_url: string | null
          ingredientes_imagem_url: string | null
          ingredients: string | null
          ingredients_en: string | null
          ingredients_es: string | null
          ingredients_fr: string | null
          is_available: boolean
          is_translating: boolean
          libras_video_url: string | null
          name: string
          name_en: string | null
          name_es: string | null
          name_fr: string | null
          needs_translation: boolean
          price: number
          restaurant_id: string
          sort_order: number
          translated_at: string | null
          updated_at: string
        }
        Insert: {
          allergens?: string[] | null
          audio_text?: string | null
          audio_text_en?: string | null
          audio_text_es?: string | null
          audio_text_fr?: string | null
          category?: Database["public"]["Enums"]["menu_category"]
          created_at?: string
          description?: string | null
          description_en?: string | null
          description_es?: string | null
          description_fr?: string | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          ingredientes_imagem_url?: string | null
          ingredients?: string | null
          ingredients_en?: string | null
          ingredients_es?: string | null
          ingredients_fr?: string | null
          is_available?: boolean
          is_translating?: boolean
          libras_video_url?: string | null
          name: string
          name_en?: string | null
          name_es?: string | null
          name_fr?: string | null
          needs_translation?: boolean
          price: number
          restaurant_id: string
          sort_order?: number
          translated_at?: string | null
          updated_at?: string
        }
        Update: {
          allergens?: string[] | null
          audio_text?: string | null
          audio_text_en?: string | null
          audio_text_es?: string | null
          audio_text_fr?: string | null
          category?: Database["public"]["Enums"]["menu_category"]
          created_at?: string
          description?: string | null
          description_en?: string | null
          description_es?: string | null
          description_fr?: string | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          ingredientes_imagem_url?: string | null
          ingredients?: string | null
          ingredients_en?: string | null
          ingredients_es?: string | null
          ingredients_fr?: string | null
          is_available?: boolean
          is_translating?: boolean
          libras_video_url?: string | null
          name?: string
          name_en?: string | null
          name_es?: string | null
          name_fr?: string | null
          needs_translation?: boolean
          price?: number
          restaurant_id?: string
          sort_order?: number
          translated_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          contact_email: string | null
          created_at: string
          id: string
          name: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      tables: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          restaurant_id: string
          table_number: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          restaurant_id: string
          table_number: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          restaurant_id?: string
          table_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      waiter_calls: {
        Row: {
          attended_at: string | null
          created_at: string
          id: string
          restaurant_id: string
          status: string
          table_number: number
        }
        Insert: {
          attended_at?: string | null
          created_at?: string
          id?: string
          restaurant_id: string
          status?: string
          table_number: number
        }
        Update: {
          attended_at?: string | null
          created_at?: string
          id?: string
          restaurant_id?: string
          status?: string
          table_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "waiter_calls_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_restaurant_and_owner: {
        Args: { _name: string; _slug: string }
        Returns: string
      }
      get_user_restaurant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "restaurant_owner" | "staff"
      menu_category:
        | "prato"
        | "bebida"
        | "sobremesa"
        | "entrada"
        | "acompanhamento"
        | "outros"
        | "cafe_espresso"
        | "chocolate"
        | "empanada_salgado"
        | "metodos_extracao"
        | "paulistinha"
        | "waffles"
        | "almoco"
        | "espresso_gelado"
        | "chocolate_gelado"
        | "drinks_sem_alcool"
        | "chai_latte"
        | "chas"
        | "drinks_especiais"
        | "cervejas"
        | "bebidas"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["super_admin", "restaurant_owner", "staff"],
      menu_category: [
        "prato",
        "bebida",
        "sobremesa",
        "entrada",
        "acompanhamento",
        "outros",
        "cafe_espresso",
        "chocolate",
        "empanada_salgado",
        "metodos_extracao",
        "paulistinha",
        "waffles",
        "almoco",
        "espresso_gelado",
        "chocolate_gelado",
        "drinks_sem_alcool",
        "chai_latte",
        "chas",
        "drinks_especiais",
        "cervejas",
        "bebidas",
      ],
    },
  },
} as const
