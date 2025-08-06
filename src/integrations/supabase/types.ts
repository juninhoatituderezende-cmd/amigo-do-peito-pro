export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          related_order_id: string | null
          source: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          related_order_id?: string | null
          source: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          related_order_id?: string | null
          source?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          created_at: string
          discount_percentage: number
          end_date: string | null
          id: string
          service_id: string
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discount_percentage?: number
          end_date?: string | null
          id?: string
          service_id: string
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discount_percentage?: number
          end_date?: string | null
          id?: string
          service_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      influencers: {
        Row: {
          approved: boolean
          created_at: string
          email: string
          followers: string
          full_name: string
          id: string
          instagram: string
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          email: string
          followers: string
          full_name: string
          id?: string
          instagram: string
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          email?: string
          followers?: string
          full_name?: string
          id?: string
          instagram?: string
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      issues: {
        Row: {
          created_at: string
          description: string
          id: string
          priority: string
          resolved: boolean
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          priority?: string
          resolved?: boolean
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          priority?: string
          resolved?: boolean
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_triggers: {
        Row: {
          created_at: string
          executed: boolean
          executed_at: string | null
          group_id: string | null
          id: string
          scheduled_for: string
          trigger_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          executed?: boolean
          executed_at?: string | null
          group_id?: string | null
          id?: string
          scheduled_for: string
          trigger_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          executed?: boolean
          executed_at?: string | null
          group_id?: string | null
          id?: string
          scheduled_for?: string
          trigger_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_triggers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_text: string | null
          action_url: string | null
          category: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_text?: string | null
          action_url?: string | null
          category?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_text?: string | null
          action_url?: string | null
          category?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      plan_participants: {
        Row: {
          contemplacao_data: string | null
          contemplacao_status: string | null
          created_at: string
          email: string
          id: string
          nome: string
          payment_status: string | null
          service_type: string
          telefone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contemplacao_data?: string | null
          contemplacao_status?: string | null
          created_at?: string
          email: string
          id?: string
          nome: string
          payment_status?: string | null
          service_type: string
          telefone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contemplacao_data?: string | null
          contemplacao_status?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          payment_status?: string | null
          service_type?: string
          telefone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      professionals: {
        Row: {
          approved: boolean
          category: string
          cep: string
          cpf: string
          created_at: string
          description: string | null
          email: string
          experience: string | null
          full_name: string
          id: string
          id_document_url: string | null
          instagram: string
          location: string
          phone: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          approved?: boolean
          category: string
          cep: string
          cpf: string
          created_at?: string
          description?: string | null
          email: string
          experience?: string | null
          full_name: string
          id?: string
          id_document_url?: string | null
          instagram: string
          location: string
          phone: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          approved?: boolean
          category?: string
          cep?: string
          cpf?: string
          created_at?: string
          description?: string | null
          email?: string
          experience?: string | null
          full_name?: string
          id?: string
          id_document_url?: string | null
          instagram?: string
          location?: string
          phone?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string
          created_at: string
          description: string
          duration: string
          id: string
          name: string
          price: number
          professional_id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          duration: string
          id?: string
          name: string
          price: number
          professional_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          duration?: string
          id?: string
          name?: string
          price?: number
          professional_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          professional_id: string
          service_id: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          professional_id: string
          service_id: string
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          professional_id?: string
          service_id?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          available_credits: number
          created_at: string
          id: string
          pending_withdrawal: number
          total_credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_credits?: number
          created_at?: string
          id?: string
          pending_withdrawal?: number
          total_credits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_credits?: number
          created_at?: string
          id?: string
          pending_withdrawal?: number
          total_credits?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          id: string
          pix_key: string
          processed_at: string | null
          professional_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          pix_key: string
          processed_at?: string | null
          professional_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          pix_key?: string
          processed_at?: string | null
          professional_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
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
    Enums: {},
  },
} as const
