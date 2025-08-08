import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

// Types
export type UserRole = 'admin' | 'professional' | 'influencer' | 'user';

interface User {
  id: string;
  email: string;
  full_name?: string;
  name?: string; // Compatibility with existing code
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  category?: string; // For professionals
  approved?: boolean; // For professionals/influencers
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  login: (email: string, password: string, role?: UserRole) => Promise<{ data: any; error: any }>;
  loginWithGoogle: () => Promise<{ data: any; error: any }>;
  register: (
    email: string, 
    password: string, 
    userData: any, 
    role?: UserRole
  ) => Promise<{ data: any; error: any }>;
  adminLogin: (email: string, password: string) => Promise<{ data: any; error: any }>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', { event, userId: session?.user?.id });
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        
        // Handle OAuth sign-in events
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if this is an OAuth login (Google, etc.)
          const isOAuthLogin = session.user.app_metadata?.providers?.includes('google');
          
          if (isOAuthLogin) {
            console.log('🚀 OAuth login detected, checking for existing profile...');
            
            // Check if profile exists
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (!existingProfile) {
              console.log('✨ Creating new profile for OAuth user...');
              
              // Create profile automatically for OAuth users as regular users
              await supabase
                .from('profiles')
                .insert({
                  id: session.user.id,
                  email: session.user.email,
                  full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                  role: 'user', // Default role for OAuth signups
                });
              
              console.log('✅ Profile created successfully for OAuth user');
            }
          }
          
          // Defer profile loading to prevent deadlocks
          setTimeout(() => {
            loadUserProfile(session.user.id);
          }, 0);
        } else if (!session?.user) {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          loadUserProfile(session.user.id);
        }, 0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      // Buscar perfil na nova tabela centralizada
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao carregar perfil:', error);
        return;
      }

      if (profileData) {
        // Para profissionais, buscar dados adicionais
        let additionalData = {};
        if (profileData.role === 'professional') {
          const { data: profData } = await supabase
            .from('professionals')
            .select('category, approved')
            .eq('user_id', userId)
            .single();
          additionalData = { category: profData?.category, approved: profData?.approved };
        }

        setUser({
          id: userId,
          email: profileData.email || supabaseUser?.email || '',
          full_name: profileData.full_name,
          name: profileData.full_name, // Compatibility
          phone: profileData.phone,
          role: profileData.role as UserRole,
          avatar_url: profileData.avatar_url,
          ...additionalData
        });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const login = async (email: string, password: string, role?: UserRole) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Erro no login:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      
      console.log('🚀 Starting Google OAuth login...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) {
        console.error('❌ Google OAuth error:', error);
        throw error;
      }

      console.log('✅ Google OAuth initiated successfully');
      return { data, error: null };
    } catch (error: any) {
      console.error('❌ Google OAuth failed:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string, 
    password: string, 
    userData: any, 
    role: UserRole = 'user'
  ) => {
    try {
      setLoading(true);
      
      console.log('🚀 Starting registration process...');
      console.log('📧 Email:', email);
      console.log('👤 Role:', role);
      console.log('📝 User data:', userData);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name || userData.name,
            phone: userData.phone,
            role
          }
        }
      });

      console.log('📤 Registration response:', { data, error });

      // Se for profissional, criar registro na tabela professionals
      if (error) throw error;
      
      if (data.user && role === 'professional') {
        const { error: profError } = await supabase
          .from('professionals')
          .insert({
            user_id: data.user.id,
            email: userData.email,
            full_name: userData.full_name,
            phone: userData.phone,
            category: userData.category || '',
            location: userData.location || '',
            cep: userData.cep || '',
            instagram: userData.instagram || '',
            cpf: userData.cpf || '',
            description: userData.description || '',
            experience: userData.experience || '',
            approved: false
          });
        
        if (profError) console.warn('Erro ao criar perfil profissional:', profError);
      }
      
      // Se for influenciador, criar registro na tabela influencers
      if (data.user && role === 'influencer') {
        const { error: influencerError } = await supabase
          .from('influencers')
          .insert({
            user_id: data.user.id,
            email: userData.email,
            full_name: userData.full_name,
            phone: userData.phone,
            instagram: userData.instagram || '',
            followers: userData.followers || '',
            approved: false
          });
        
        if (influencerError) console.warn('Erro ao criar perfil influenciador:', influencerError);
      }

      if (error) throw error;

      // Verificar se o usuário foi criado com sucesso
      if (data.user) {
        console.log('✅ User created successfully:', data.user.id);
        
        // Se o email não foi confirmado automaticamente, mostrar mensagem específica
        if (!data.user.email_confirmed_at && !data.session) {
          console.log('📧 Email confirmation required');
          return { 
            data, 
            error: { 
              message: 'Conta criada com sucesso! Verifique seu email para ativar a conta.',
              requiresConfirmation: true 
            } 
          };
        }
        
        console.log('🎉 Registration completed successfully');
      }

      // O perfil será criado automaticamente pelo trigger
      return { data, error: null };
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verificar se é admin via profiles
      if (data.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .eq('role', 'admin')
          .single();

        if (!profileData) {
          await supabase.auth.signOut();
          throw new Error('Usuário não é administrador');
        }
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Erro no login admin:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clean up auth state
      setUser(null);
      setSupabaseUser(null);
      setSession(null);
      
      // Sign out from Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      // Force page reload for clean state
      window.location.href = '/';
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        supabaseUser, 
        session, 
        login,
        loginWithGoogle, 
        register, 
        adminLogin, 
        logout, 
        loading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};