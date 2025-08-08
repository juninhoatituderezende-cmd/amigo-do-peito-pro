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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_configs: {
        Row: {
          admin_email: string
          created_at: string
          id: string
          is_active: boolean
        }
        Insert: {
          admin_email: string
          created_at?: string
          id?: string
          is_active?: boolean
        }
        Update: {
          admin_email?: string
          created_at?: string
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      admin_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      contemplations: {
        Row: {
          contemplated_at: string
          created_at: string
          id: string
          notes: string | null
          professional_id: string | null
          professional_name: string | null
          service_type: string
          status: string
          total_commission: number
          total_referrals: number
          updated_at: string
          user_email: string
          user_id: string
          user_name: string
          voucher_code: string
        }
        Insert: {
          contemplated_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          professional_id?: string | null
          professional_name?: string | null
          service_type: string
          status?: string
          total_commission?: number
          total_referrals?: number
          updated_at?: string
          user_email: string
          user_id: string
          user_name: string
          voucher_code: string
        }
        Update: {
          contemplated_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          professional_id?: string | null
          professional_name?: string | null
          service_type?: string
          status?: string
          total_commission?: number
          total_referrals?: number
          updated_at?: string
          user_email?: string
          user_id?: string
          user_name?: string
          voucher_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "contemplations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
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
      custom_plans: {
        Row: {
          active: boolean
          allow_professional_choice: boolean
          benefits: Json | null
          category_id: string
          created_at: string
          created_by: string | null
          description: string | null
          entry_price: number
          id: string
          image_url: string | null
          max_participants: number
          name: string
          plan_code: string
          professional_id: string | null
          public_enrollment: boolean
          total_price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          allow_professional_choice?: boolean
          benefits?: Json | null
          category_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_price: number
          id?: string
          image_url?: string | null
          max_participants?: number
          name: string
          plan_code: string
          professional_id?: string | null
          public_enrollment?: boolean
          total_price: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          allow_professional_choice?: boolean
          benefits?: Json | null
          category_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_price?: number
          id?: string
          image_url?: string | null
          max_participants?: number
          name?: string
          plan_code?: string
          professional_id?: string | null
          public_enrollment?: boolean
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_plans_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          client_ip: string | null
          component_stack: string | null
          created_at: string
          error_id: string
          id: string
          message: string
          stack: string | null
          timestamp: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          client_ip?: string | null
          component_stack?: string | null
          created_at?: string
          error_id: string
          id?: string
          message: string
          stack?: string | null
          timestamp?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          client_ip?: string | null
          component_stack?: string | null
          created_at?: string
          error_id?: string
          id?: string
          message?: string
          stack?: string | null
          timestamp?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
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
      indicacoes: {
        Row: {
          created_at: string | null
          id: string
          indicado_id: string | null
          indicado_por_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          indicado_id?: string | null
          indicado_por_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          indicado_id?: string | null
          indicado_por_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "indicacoes_indicado_id_fkey"
            columns: ["indicado_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicacoes_indicado_por_id_fkey"
            columns: ["indicado_por_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_commissions: {
        Row: {
          client_id: string
          commission_amount: number
          commission_percentage: number
          created_at: string
          entry_percentage: number
          entry_value: number
          id: string
          influencer_id: string
          payment_date: string | null
          payment_proof_url: string | null
          product_id: string | null
          product_total_value: number
          referral_code: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          commission_amount: number
          commission_percentage?: number
          created_at?: string
          entry_percentage?: number
          entry_value: number
          id?: string
          influencer_id: string
          payment_date?: string | null
          payment_proof_url?: string | null
          product_id?: string | null
          product_total_value: number
          referral_code: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          commission_amount?: number
          commission_percentage?: number
          created_at?: string
          entry_percentage?: number
          entry_value?: number
          id?: string
          influencer_id?: string
          payment_date?: string | null
          payment_proof_url?: string | null
          product_id?: string | null
          product_total_value?: number
          referral_code?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencer_commissions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "custom_plans"
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
      marketplace_products: {
        Row: {
          approved: boolean
          approved_at: string | null
          approved_by: string | null
          ativo: boolean
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          percentual_entrada: number
          professional_id: string | null
          target_audience: string
          updated_at: string
          valor_total: number
        }
        Insert: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          ativo?: boolean
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          percentual_entrada?: number
          professional_id?: string | null
          target_audience?: string
          updated_at?: string
          valor_total: number
        }
        Update: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          ativo?: boolean
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          percentual_entrada?: number
          professional_id?: string | null
          target_audience?: string
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_products_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_sales: {
        Row: {
          buyer_email: string
          buyer_id: string
          buyer_name: string
          comissao_influencer: number | null
          comissao_profissional: number | null
          created_at: string
          id: string
          influencer_code: string | null
          influencer_id: string | null
          payment_id: string | null
          payment_method: string | null
          product_id: string
          status: string
          updated_at: string
          valor_entrada_pago: number
          valor_total: number
        }
        Insert: {
          buyer_email: string
          buyer_id: string
          buyer_name: string
          comissao_influencer?: number | null
          comissao_profissional?: number | null
          created_at?: string
          id?: string
          influencer_code?: string | null
          influencer_id?: string | null
          payment_id?: string | null
          payment_method?: string | null
          product_id: string
          status?: string
          updated_at?: string
          valor_entrada_pago: number
          valor_total: number
        }
        Update: {
          buyer_email?: string
          buyer_id?: string
          buyer_name?: string
          comissao_influencer?: number | null
          comissao_profissional?: number | null
          created_at?: string
          id?: string
          influencer_code?: string | null
          influencer_id?: string | null
          payment_id?: string | null
          payment_method?: string | null
          product_id?: string
          status?: string
          updated_at?: string
          valor_entrada_pago?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          download_count: number
          id: string
          is_active: boolean
          qr_code_url: string | null
          title: string
          type: string
          updated_at: string
          url: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          download_count?: number
          id?: string
          is_active?: boolean
          qr_code_url?: string | null
          title: string
          type: string
          updated_at?: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          download_count?: number
          id?: string
          is_active?: boolean
          qr_code_url?: string | null
          title?: string
          type?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      mlm_commissions: {
        Row: {
          amount: number
          approved_at: string | null
          created_at: string
          id: string
          level: number
          paid_at: string | null
          percentage: number
          referral_id: string | null
          source_user_id: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          created_at?: string
          id?: string
          level: number
          paid_at?: string | null
          percentage: number
          referral_id?: string | null
          source_user_id: string
          status?: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          created_at?: string
          id?: string
          level?: number
          paid_at?: string | null
          percentage?: number
          referral_id?: string | null
          source_user_id?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mlm_commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "mlm_referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      mlm_network: {
        Row: {
          active_referrals: number
          created_at: string
          id: string
          joined_at: string
          level: number
          position_in_level: number
          referral_code: string
          referred_by_user_id: string | null
          status: string
          total_earnings: number
          total_referrals: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active_referrals?: number
          created_at?: string
          id?: string
          joined_at?: string
          level?: number
          position_in_level?: number
          referral_code: string
          referred_by_user_id?: string | null
          status?: string
          total_earnings?: number
          total_referrals?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active_referrals?: number
          created_at?: string
          id?: string
          joined_at?: string
          level?: number
          position_in_level?: number
          referral_code?: string
          referred_by_user_id?: string | null
          status?: string
          total_earnings?: number
          total_referrals?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mlm_referrals: {
        Row: {
          commission_earned: number
          commission_percentage: number
          confirmed_at: string | null
          created_at: string
          id: string
          paid_at: string | null
          referral_code_used: string
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          commission_earned?: number
          commission_percentage?: number
          confirmed_at?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          referral_code_used: string
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          commission_earned?: number
          commission_percentage?: number
          confirmed_at?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          referral_code_used?: string
          referred_id?: string
          referrer_id?: string
          status?: string
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
      participacoes: {
        Row: {
          contemplacao_data: string | null
          contemplacao_status: string | null
          created_at: string | null
          id: string
          payment_status: string | null
          service_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          contemplacao_data?: string | null
          contemplacao_status?: string | null
          created_at?: string | null
          id?: string
          payment_status?: string | null
          service_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          contemplacao_data?: string | null
          contemplacao_status?: string | null
          created_at?: string | null
          id?: string
          payment_status?: string | null
          service_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_logs: {
        Row: {
          action: string
          admin_id: string | null
          amount: number | null
          created_at: string
          id: string
          new_status: string | null
          notes: string | null
          old_status: string | null
          payment_id: string
          payment_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          amount?: number | null
          created_at?: string
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          payment_id: string
          payment_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          amount?: number | null
          created_at?: string
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          payment_id?: string
          payment_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_validations: {
        Row: {
          amount_verified: boolean
          asaas_payment_id: string
          id: string
          payment_id: string
          processed_at: string
          signature_verified: boolean
          webhook_signature: string | null
        }
        Insert: {
          amount_verified?: boolean
          asaas_payment_id: string
          id?: string
          payment_id: string
          processed_at?: string
          signature_verified?: boolean
          webhook_signature?: string | null
        }
        Update: {
          amount_verified?: boolean
          asaas_payment_id?: string
          id?: string
          payment_id?: string
          processed_at?: string
          signature_verified?: boolean
          webhook_signature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_validations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          influencer_code: string | null
          paid_at: string | null
          payment_method: string
          pix_code: string | null
          plan_id: string | null
          status: string
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          influencer_code?: string | null
          paid_at?: string | null
          payment_method?: string
          pix_code?: string | null
          plan_id?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          influencer_code?: string | null
          paid_at?: string | null
          payment_method?: string
          pix_code?: string | null
          plan_id?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          metric_name: string
          metric_value: number
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          metric_name: string
          metric_value: number
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          metric_name?: string
          metric_value?: number
        }
        Relationships: []
      }
      plan_groups: {
        Row: {
          created_at: string
          current_participants: number
          end_date: string | null
          group_number: number
          id: string
          plan_id: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_participants?: number
          end_date?: string | null
          group_number: number
          id?: string
          plan_id: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_participants?: number
          end_date?: string | null
          group_number?: number
          id?: string
          plan_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_groups_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "custom_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_participants: {
        Row: {
          contemplation_date: string | null
          contemplation_status: string
          created_at: string
          group_id: string
          id: string
          joined_at: string
          payment_status: string
          plan_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contemplation_date?: string | null
          contemplation_status?: string
          created_at?: string
          group_id: string
          id?: string
          joined_at?: string
          payment_status?: string
          plan_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contemplation_date?: string | null
          contemplation_status?: string
          created_at?: string
          group_id?: string
          id?: string
          joined_at?: string
          payment_status?: string
          plan_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_participants_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "plan_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_participants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "custom_plans"
            referencedColumns: ["id"]
          },
        ]
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
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
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
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string | null
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
      admin_update_referral_status: {
        Args: { referral_id: string; new_status: string; admin_notes?: string }
        Returns: boolean
      }
      calculate_influencer_commission: {
        Args: {
          p_product_total_value: number
          p_entry_percentage?: number
          p_commission_percentage?: number
        }
        Returns: number
      }
      calculate_mlm_level: {
        Args: { referred_by: string }
        Returns: number
      }
      check_rate_limit: {
        Args: {
          identifier: string
          action_type: string
          max_requests?: number
          window_minutes?: number
        }
        Returns: boolean
      }
      clean_old_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_influencer_commission: {
        Args: {
          p_influencer_id: string
          p_client_id: string
          p_product_id: string
          p_referral_code: string
          p_product_total_value: number
        }
        Returns: string
      }
      generate_plan_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_secure_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_mlm_statistics: {
        Args: { target_user_id?: string }
        Returns: {
          total_users: number
          active_users: number
          total_referrals: number
          total_commissions: number
          pending_commissions: number
          paid_commissions: number
          top_performers: Json
          recent_activity: Json
        }[]
      }
      get_referrals_by_status: {
        Args: { filter_status?: string }
        Returns: {
          referral_id: string
          referrer_name: string
          referrer_email: string
          referred_name: string
          referred_email: string
          referral_code_used: string
          commission_earned: number
          commission_percentage: number
          status: string
          created_at: string
          confirmed_at: string
          paid_at: string
        }[]
      }
      get_user_commissions: {
        Args: { target_user_id: string }
        Returns: {
          total_commissions: number
          pending_commissions: number
          paid_commissions: number
          referral_commissions: number
          bonus_commissions: number
          override_commissions: number
          commission_details: Json
        }[]
      }
      get_user_network: {
        Args: { target_user_id: string }
        Returns: {
          level: number
          user_id: string
          user_name: string
          user_email: string
          referral_code: string
          total_referrals: number
          active_referrals: number
          total_earnings: number
          status: string
          joined_at: string
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          event_type: string
          user_id?: string
          ip_address?: unknown
          user_agent?: string
          details?: Json
        }
        Returns: undefined
      }
      process_influencer_commission: {
        Args: {
          p_client_id: string
          p_referral_code: string
          p_product_total_value: number
        }
        Returns: undefined
      }
      process_mlm_referral: {
        Args: { new_user_id: string; referral_code_used: string }
        Returns: boolean
      }
      validate_financial_transaction: {
        Args: { transaction_type: string; amount: number; user_id: string }
        Returns: boolean
      }
      validate_payment_amount: {
        Args: { payment_id: string; received_amount: number }
        Returns: boolean
      }
      validate_webhook_security: {
        Args: { payload: Json; signature: string; user_agent?: string }
        Returns: boolean
      }
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
