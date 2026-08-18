export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      store_menu_categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: number;
          name: string;
          store_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: number;
          name: string;
          store_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: number;
          name?: string;
          store_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "store_menu_categories_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      store_menu_category_item_sort_indexes: {
        Row: {
          created_at: string;
          id: number;
          order_index: number;
          store_menu_category_id: number;
          store_menu_category_item_id: number;
        };
        Insert: {
          created_at?: string;
          id?: number;
          order_index: number;
          store_menu_category_id: number;
          store_menu_category_item_id: number;
        };
        Update: {
          created_at?: string;
          id?: number;
          order_index?: number;
          store_menu_category_id?: number;
          store_menu_category_item_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "category_items_indexes_category_id_fkey";
            columns: ["store_menu_category_id"];
            isOneToOne: false;
            referencedRelation: "store_menu_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "item_sort_indexes_item_id_fkey";
            columns: ["store_menu_category_item_id"];
            isOneToOne: false;
            referencedRelation: "store_menu_category_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "smcis_category_id_fkey";
            columns: ["store_menu_category_id"];
            isOneToOne: false;
            referencedRelation: "store_menu_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "smcis_item_id_fkey";
            columns: ["store_menu_category_item_id"];
            isOneToOne: false;
            referencedRelation: "store_menu_category_items";
            referencedColumns: ["id"];
          },
        ];
      };
      store_menu_category_items: {
        Row: {
          created_at: string;
          description: string | null;
          id: number;
          image_path: string | null;
          image_url: string | null;
          name: string;
          price: number;
          store_id: string;
          store_menu_category_id: number;
          tagline: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: number;
          image_path?: string | null;
          image_url?: string | null;
          name: string;
          price: number;
          store_id: string;
          store_menu_category_id: number;
          tagline?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: number;
          image_path?: string | null;
          image_url?: string | null;
          name?: string;
          price?: number;
          store_id?: string;
          store_menu_category_id?: number;
          tagline?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "store_menu_category_items_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "store_menu_category_items_store_menu_category_id_fkey";
            columns: ["store_menu_category_id"];
            isOneToOne: false;
            referencedRelation: "store_menu_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      store_menu_category_sort_indexes: {
        Row: {
          category_id: number;
          created_at: string;
          id: number;
          order_index: number;
          store_id: string;
        };
        Insert: {
          category_id: number;
          created_at?: string;
          id?: number;
          order_index: number;
          store_id: string;
        };
        Update: {
          category_id?: number;
          created_at?: string;
          id?: number;
          order_index?: number;
          store_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "store_menu_category_sort_indexes_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "store_menu_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "store_menu_category_sort_indexes_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      store_menu_qr_codes: {
        Row: {
          created_at: string;
          encoded_url: string | null;
          id: number;
          public_url: string;
          store_id: string;
        };
        Insert: {
          created_at?: string;
          encoded_url?: string | null;
          id?: number;
          public_url: string;
          store_id: string;
        };
        Update: {
          created_at?: string;
          encoded_url?: string | null;
          id?: number;
          public_url?: string;
          store_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "store_menu_qr_codes_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      stores: {
        Row: {
          created_at: string;
          id: string;
          image_path: string | null;
          image_url: string | null;
          menu_seo_description: string | null;
          menu_seo_title: string | null;
          menu_slug: string;
          name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_path?: string | null;
          image_url?: string | null;
          menu_seo_description?: string | null;
          menu_seo_title?: string | null;
          menu_slug: string;
          name: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_path?: string | null;
          image_url?: string | null;
          menu_seo_description?: string | null;
          menu_seo_title?: string | null;
          menu_slug?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          created_at: string;
          current_period_end: string;
          current_period_start: string;
          id: string;
          status: Database["public"]["Enums"]["SUBSCRIPTION_STATUS"];
          store_id: string;
          stripe_customer_id: string;
          stripe_price_id: string;
          stripe_subscription_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          current_period_end: string;
          current_period_start: string;
          id?: string;
          status: Database["public"]["Enums"]["SUBSCRIPTION_STATUS"];
          store_id: string;
          stripe_customer_id: string;
          stripe_price_id: string;
          stripe_subscription_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          current_period_end?: string;
          current_period_start?: string;
          id?: string;
          status?: Database["public"]["Enums"]["SUBSCRIPTION_STATUS"];
          store_id?: string;
          stripe_customer_id?: string;
          stripe_price_id?: string;
          stripe_subscription_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: true;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      user_feedback: {
        Row: {
          created_at: string;
          feedback: string;
          id: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          feedback: string;
          id?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          feedback?: string;
          id?: number;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      SUBSCRIPTION_STATUS:
        | "incomplete"
        | "incomplete_expired"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "paused";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      SUBSCRIPTION_STATUS: [
        "incomplete",
        "incomplete_expired",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "paused",
      ],
    },
  },
} as const;
