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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      asaas_subaccounts: {
        Row: {
          access_token: string | null
          account_key: string | null
          account_number: string | null
          agency: string | null
          created_at: string | null
          id: string
          professional_id: string | null
          status: string | null
          subaccount_id: string
          updated_at: string | null
          wallet_id: string | null
        }
        Insert: {
          access_token?: string | null
          account_key?: string | null
          account_number?: string | null
          agency?: string | null
          created_at?: string | null
          id?: string
          professional_id?: string | null
          status?: string | null
          subaccount_id: string
          updated_at?: string | null
          wallet_id?: string | null
        }
        Update: {
          access_token?: string | null
          account_key?: string | null
          account_number?: string | null
          agency?: string | null
          created_at?: string | null
          id?: string
          professional_id?: string | null
          status?: string | null
          subaccount_id?: string
          updated_at?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asaas_subaccounts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          commission_rate: number | null
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          reference_table: string | null
          related_user_id: string | null
          source_type: string | null
          status: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string | null
        }
        Insert: {
          amount: number
          commission_rate?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_table?: string | null
          related_user_id?: string | null
          source_type?: string | null
          status?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id?: string | null
        }
        Update: {
          amount?: number
          commission_rate?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_table?: string | null
          related_user_id?: string | null
          source_type?: string | null
          status?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string | null
        }
        Relationships: []
      }
      custom_plans: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string | null
          description: string | null
          duration_months: number | null
          features: Json | null
          id: string
          max_participants: number | null
          name: string
          price: number
          professional_id: string | null
          stripe_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_months?: number | null
          features?: Json | null
          id?: string
          max_participants?: number | null
          name: string
          price: number
          professional_id?: string | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_months?: number | null
          features?: Json | null
          id?: string
          max_participants?: number | null
          name?: string
          price?: number
          professional_id?: string | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_plans_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_participants: {
        Row: {
          amount_paid: number
          group_id: string | null
          id: string
          joined_at: string | null
          referrer_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount_paid: number
          group_id?: string | null
          id?: string
          joined_at?: string | null
          referrer_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount_paid?: number
          group_id?: string | null
          id?: string
          joined_at?: string | null
          referrer_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_participants_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "plan_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_participants_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_sales: {
        Row: {
          buyer_id: string | null
          created_at: string | null
          credits_used: number | null
          id: string
          payment_id: string | null
          payment_method: string
          referrer_id: string | null
          seller_id: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string | null
          credits_used?: number | null
          id?: string
          payment_id?: string | null
          payment_method: string
          referrer_id?: string | null
          seller_id?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string | null
          created_at?: string | null
          credits_used?: number | null
          id?: string
          payment_id?: string | null
          payment_method?: string
          referrer_id?: string | null
          seller_id?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_sales_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_sales_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_sales_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_sales_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_triggers: {
        Row: {
          created_at: string | null
          data: Json | null
          event_type: string
          id: string
          message: string
          sent: boolean | null
          sent_at: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          event_type: string
          id?: string
          message: string
          sent?: boolean | null
          sent_at?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          event_type?: string
          id?: string
          message?: string
          sent?: boolean | null
          sent_at?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_split_rules: {
        Row: {
          created_at: string | null
          id: string
          platform_percentage: number | null
          professional_percentage: number | null
          referrer_percentage: number | null
          service_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform_percentage?: number | null
          professional_percentage?: number | null
          referrer_percentage?: number | null
          service_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          platform_percentage?: number | null
          professional_percentage?: number | null
          referrer_percentage?: number | null
          service_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_split_rules_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: true
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_splits: {
        Row: {
          created_at: string | null
          id: string
          payment_id: string
          platform_amount: number
          processed_at: string | null
          professional_amount: number
          professional_id: string | null
          referrer_amount: number | null
          referrer_id: string | null
          service_id: string | null
          status: string | null
          total_amount: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_id: string
          platform_amount: number
          processed_at?: string | null
          professional_amount: number
          professional_id?: string | null
          referrer_amount?: number | null
          referrer_id?: string | null
          service_id?: string | null
          status?: string | null
          total_amount: number
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_id?: string
          platform_amount?: number
          processed_at?: string | null
          professional_amount?: number
          professional_id?: string | null
          referrer_amount?: number | null
          referrer_id?: string | null
          service_id?: string | null
          status?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_splits_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_splits_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_splits_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_groups: {
        Row: {
          contemplated_at: string | null
          created_at: string | null
          current_amount: number | null
          current_participants: number | null
          group_number: number
          id: string
          max_participants: number | null
          service_id: string | null
          status: Database["public"]["Enums"]["group_status"] | null
          target_amount: number
          updated_at: string | null
          winner_id: string | null
        }
        Insert: {
          contemplated_at?: string | null
          created_at?: string | null
          current_amount?: number | null
          current_participants?: number | null
          group_number: number
          id?: string
          max_participants?: number | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["group_status"] | null
          target_amount: number
          updated_at?: string | null
          winner_id?: string | null
        }
        Update: {
          contemplated_at?: string | null
          created_at?: string | null
          current_amount?: number | null
          current_participants?: number | null
          group_number?: number
          id?: string
          max_participants?: number | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["group_status"] | null
          target_amount?: number
          updated_at?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_groups_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string | null
          description: string | null
          external_link: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          name: string
          price: number
          professional_id: string | null
          stock_quantity: number | null
          target_audience: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          external_link?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          professional_id?: string | null
          stock_quantity?: number | null
          target_audience?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          external_link?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          professional_id?: string | null
          stock_quantity?: number | null
          target_audience?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved: boolean | null
          cpf: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          approved?: boolean | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          approved?: boolean | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          professional_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          professional_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          professional_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          available_credits: number | null
          created_at: string | null
          id: string
          pending_credits: number | null
          total_credits: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          available_credits?: number | null
          created_at?: string | null
          id?: string
          pending_credits?: number | null
          total_credits?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          available_credits?: number | null
          created_at?: string | null
          id?: string
          pending_credits?: number | null
          total_credits?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_purchases: {
        Row: {
          amount_paid: number
          created_at: string | null
          id: string
          payment_method: string | null
          plan_id: string | null
          product_id: string | null
          purchase_type: string | null
          status: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          id?: string
          payment_method?: string | null
          plan_id?: string | null
          product_id?: string | null
          purchase_type?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          id?: string
          payment_method?: string | null
          plan_id?: string | null
          product_id?: string | null
          purchase_type?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_purchases_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "custom_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          amount: number
          bank_account: Json | null
          created_at: string | null
          id: string
          method: string | null
          notes: string | null
          pix_key: string | null
          processed_at: string | null
          processed_by: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          bank_account?: Json | null
          created_at?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          pix_key?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          bank_account?: Json | null
          created_at?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          pix_key?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_login_validation: {
        Args: { login_email: string; login_password: string }
        Returns: {
          profile_email: string
          profile_id: string
          profile_name: string
          profile_role: string
        }[]
      }
    }
    Enums: {
      group_status: "forming" | "complete" | "contemplated" | "cancelled"
      payment_status:
        | "pending"
        | "completed"
        | "failed"
        | "refunded"
        | "cancelled"
      transaction_type:
        | "earned"
        | "spent"
        | "refund"
        | "withdrawal_request"
        | "withdrawal_completed"
        | "service_payment"
        | "referral_commission"
        | "marketplace_commission"
        | "professional_earnings"
      user_role: "user" | "professional" | "admin" | "influencer"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      group_status: ["forming", "complete", "contemplated", "cancelled"],
      payment_status: [
        "pending",
        "completed",
        "failed",
        "refunded",
        "cancelled",
      ],
      transaction_type: [
        "earned",
        "spent",
        "refund",
        "withdrawal_request",
        "withdrawal_completed",
        "service_payment",
        "referral_commission",
        "marketplace_commission",
        "professional_earnings",
      ],
      user_role: ["user", "professional", "admin", "influencer"],
    },
  },
} as const
