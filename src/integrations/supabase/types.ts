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
          category_id: string | null
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
          category_id?: string | null
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
          category_id?: string | null
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
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "restaurant_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          restaurant_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          restaurant_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          restaurant_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_categories_restaurant_id_fkey"
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
          enable_ordering: boolean
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          service_fee_percent: number
          show_ingredients_button: boolean
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          enable_ordering?: boolean
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          service_fee_percent?: number
          show_ingredients_button?: boolean
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          enable_ordering?: boolean
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          service_fee_percent?: number
          show_ingredients_button?: boolean
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      table_sessions: {
        Row: {
          closed_at: string | null
          id: string
          opened_at: string
          restaurant_id: string
          service_fee_amount: number | null
          service_fee_percent: number | null
          status: string
          subtotal: number | null
          table_number: number
          total_amount: number | null
        }
        Insert: {
          closed_at?: string | null
          id?: string
          opened_at?: string
          restaurant_id: string
          service_fee_amount?: number | null
          service_fee_percent?: number | null
          status?: string
          subtotal?: number | null
          table_number: number
          total_amount?: number | null
        }
        Update: {
          closed_at?: string | null
          id?: string
          opened_at?: string
          restaurant_id?: string
          service_fee_amount?: number | null
          service_fee_percent?: number | null
          status?: string
          subtotal?: number | null
          table_number?: number
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "table_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          canceled_at: string | null
          canceled_reason: string | null
          confirmed_at: string | null
          created_at: string
          delivered_at: string | null
          id: string
          notes: string | null
          restaurant_id: string
          session_id: string
          status: string
          table_number: number
        }
        Insert: {
          canceled_at?: string | null
          canceled_reason?: string | null
          confirmed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          restaurant_id: string
          session_id: string
          status?: string
          table_number: number
        }
        Update: {
          canceled_at?: string | null
          canceled_reason?: string | null
          confirmed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          restaurant_id?: string
          session_id?: string
          status?: string
          table_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          item_name: string
          item_price: number
          menu_item_id: string | null
          notes: string | null
          order_id: string
          quantity: number
        }
        Insert: {
          id?: string
          item_name: string
          item_price: number
          menu_item_id?: string | null
          notes?: string | null
          order_id: string
          quantity?: number
        }
        Update: {
          id?: string
          item_name?: string
          item_price?: number
          menu_item_id?: string | null
          notes?: string | null
          order_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
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
      create_order: {
        Args: {
          p_restaurant_id: string
          p_table_number: number
          p_items: Json
          p_notes?: string | null
        }
        Returns: string
      }
      get_or_create_open_table_session: {
        Args: { p_restaurant_id: string; p_table_number: number }
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
