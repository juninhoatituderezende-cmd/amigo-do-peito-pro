import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { getDashboardRoute, shouldRedirectUser, ROUTES } from "@/lib/routes";

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
  loading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<{ error: Error | null }>;
  register: (email: string, password: string, userData: any, role?: UserRole) => Promise<{ error: Error | null }>;
  adminLogin: (email: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', { event, userId: session?.user?.id });
        
        try {
          setSession(session);
          setSupabaseUser(session?.user ?? null);
          
          // Handle OAuth sign-in events
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('🚀 User signed in successfully');
            
            // Check if this is an OAuth login (Google, etc.)
            const isOAuthLogin = session.user.app_metadata?.providers?.includes('google');
            
            if (isOAuthLogin) {
              console.log('🔍 OAuth login detected, processing profile...');
              
              try {
                // Check if profile exists
                const { data: existingProfile, error: profileError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();
                
                if (profileError && profileError.code !== 'PGRST116') {
                  console.error('❌ Error checking profile:', profileError);
                }
                
                if (!existingProfile) {
                  console.log('✨ Creating new profile for OAuth user...');
                  
                  // Create profile automatically for OAuth users as regular users
                  const { error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                      id: session.user.id,
                      email: session.user.email,
                      full_name: session.user.user_metadata?.full_name || 
                                session.user.user_metadata?.name || 
                                session.user.email?.split('@')[0] || '',
                      role: 'user', // Default role for OAuth signups
                    });
                  
                  if (insertError) {
                    console.error('❌ Error creating profile:', insertError);
                  } else {
                    console.log('✅ Profile created successfully for OAuth user');
                  }
                } else {
                  console.log('✅ Existing profile found for OAuth user');
                }
              } catch (profileErr) {
                console.error('❌ Profile processing error:', profileErr);
              }
            }
            
            // Defer profile loading to prevent deadlocks
            setTimeout(() => {
              loadUserProfile(session.user.id);
            }, 100);
          } else if (!session?.user) {
            console.log('👋 User signed out');
            setUser(null);
          }
        } catch (error) {
          console.error('❌ Auth state change error:', error);
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
      console.log('🔍 Loading user profile for:', userId);
      
      // Buscar perfil na nova tabela centralizada
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error loading profile:', error);
        
        // If profile doesn't exist and user is authenticated, create a basic one
        if (error.code === 'PGRST116' && supabaseUser) {
          console.log('🔧 Profile not found, creating basic profile...');
          
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: supabaseUser.email || '',
              full_name: supabaseUser.user_metadata?.full_name || 
                        supabaseUser.user_metadata?.name || 
                        supabaseUser.email?.split('@')[0] || '',
              role: 'user',
            });
          
          if (createError) {
            console.error('❌ Error creating basic profile:', createError);
            return;
          }
          
          // Retry loading after creation
          return loadUserProfile(userId);
        }
        return;
      }

      if (profileData) {
        console.log('✅ Profile loaded successfully:', profileData);
        
        // Para profissionais, buscar dados adicionais
        let additionalData = {};
        if (profileData.role === 'professional') {
          // Get additional professional data from profiles table
          additionalData = { 
            category: 'professional', 
            approved: profileData.approved 
          };
        }

        setUser({
          id: userId,
          email: profileData.email || supabaseUser?.email || '',
          full_name: profileData.full_name,
          name: profileData.full_name, // Compatibility
          phone: profileData.phone,
          role: profileData.role as UserRole,
          avatar_url: null, // Not available in current schema
          ...additionalData
        });
        
        // Handle automatic redirection based on role
        setTimeout(() => {
          handleUserRedirection(profileData.role as UserRole);
        }, 100);
      }
    } catch (error) {
      console.error('❌ Unexpected error loading profile:', error);
    }
  };

  // Handle user redirection based on role and current location
  const handleUserRedirection = (userRole: UserRole) => {
    const currentPath = location.pathname;
    
    // Skip redirection if user is already on the correct dashboard or public pages
    if (!shouldRedirectUser(currentPath, userRole)) {
      return;
    }
    
    const dashboardRoute = getDashboardRoute(userRole);
    console.log(`🔄 Redirecting ${userRole} user to:`, dashboardRoute);
    
    navigate(dashboardRoute, { replace: true });
  };

  const login = async (email: string, password: string, role?: UserRole) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Success - redirection will be handled by loadUserProfile
      console.log('✅ Login successful, user profile will be loaded and redirected');
      
      return { error: null };
    } catch (error: any) {
      console.error('Erro no login:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth removido - sistema simplificado

  const register = async (email: string, password: string, userData: any, role: UserRole = 'user') => {
    try {
      setLoading(true);
      
      // Cadastro com confirmação de email desabilitada
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: userData.fullName || userData.nome || 'Usuário',
            phone: userData.phone || userData.telefone || '',
            role: role,
          }
        }
      });

      if (error) throw error;

      // Se o usuário foi criado com sucesso
      if (data.user && !data.session) {
        console.log('✅ User registered successfully, email confirmation may be required');
        console.log('ℹ️  Please check your email to confirm your account, or disable email confirmation in Supabase settings');
        return { error: null };
      } else if (data.session) {
        console.log('✅ User registered and logged in successfully');
        return { error: null };
      }

      return { error: null };
    } catch (error: any) {
      console.error('Erro durante cadastro:', error);
      return { error };
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
          throw new Error('Email ou senha incorretos');
        }
        
        // Success - redirect to admin dashboard
        console.log('✅ Admin login successful');
        navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
      }

      return { error: null };
    } catch (error: any) {
      console.error('Erro no login admin:', error);
      return { error };
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
      window.location.href = ROUTES.HOME;
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