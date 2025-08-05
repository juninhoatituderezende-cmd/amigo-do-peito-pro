import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface Database {
  public: {
    Tables: {
      professionals: {
        Row: {
          id: string;
          created_at: string;
          full_name: string;
          email: string;
          phone: string;
          category: string;
          location: string;
          cep: string;
          instagram: string;
          cpf: string;
          approved: boolean;
          description: string | null;
          experience: string | null;
          id_document_url: string | null;
          video_url: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          full_name: string;
          email: string;
          phone: string;
          category: string;
          location: string;
          cep: string;
          instagram: string;
          cpf: string;
          approved?: boolean;
          description?: string | null;
          experience?: string | null;
          id_document_url?: string | null;
          video_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          category?: string;
          location?: string;
          cep?: string;
          instagram?: string;
          cpf?: string;
          approved?: boolean;
          description?: string | null;
          experience?: string | null;
          id_document_url?: string | null;
          video_url?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          created_at: string;
          full_name: string;
          email: string;
          phone: string;
          referral_code: string;
          referred_by: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          full_name: string;
          email: string;
          phone: string;
          referral_code: string;
          referred_by?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          referral_code?: string;
          referred_by?: string | null;
        };
      };
      influencers: {
        Row: {
          id: string;
          created_at: string;
          full_name: string;
          email: string;
          phone: string;
          instagram: string;
          followers: string;
          approved: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          full_name: string;
          email: string;
          phone: string;
          instagram: string;
          followers: string;
          approved?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          instagram?: string;
          followers?: string;
          approved?: boolean;
        };
      };
      services: {
        Row: {
          id: string;
          created_at: string;
          professional_id: string;
          name: string;
          description: string;
          price: number;
          duration: string;
          category: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          professional_id: string;
          name: string;
          description: string;
          price: number;
          duration: string;
          category: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          professional_id?: string;
          name?: string;
          description?: string;
          price?: number;
          duration?: string;
          category?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          created_at: string;
          service_id: string;
          user_id: string;
          status: string;
          start_date: string | null;
          end_date: string | null;
          discount_percentage: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          service_id: string;
          user_id: string;
          status?: string;
          start_date?: string | null;
          end_date?: string | null;
          discount_percentage?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          service_id?: string;
          user_id?: string;
          status?: string;
          start_date?: string | null;
          end_date?: string | null;
          discount_percentage?: number;
        };
      };
      transactions: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          professional_id: string;
          service_id: string;
          amount: number;
          type: string;
          status: string;
          description: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          professional_id: string;
          service_id: string;
          amount: number;
          type: string;
          status?: string;
          description: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          professional_id?: string;
          service_id?: string;
          amount?: number;
          type?: string;
          status?: string;
          description?: string;
        };
      };
      withdrawals: {
        Row: {
          id: string;
          created_at: string;
          professional_id: string;
          amount: number;
          pix_key: string;
          status: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          professional_id: string;
          amount: number;
          pix_key: string;
          status?: string;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          professional_id?: string;
          amount?: number;
          pix_key?: string;
          status?: string;
          processed_at?: string | null;
        };
      };
    };
  };
}