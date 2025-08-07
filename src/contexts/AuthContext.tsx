
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type UserRole = "admin" | "professional" | "influencer" | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  category?: string;
  approved?: boolean;
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (email: string, password: string, userData: any, role: UserRole) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setSupabaseUser(session.user);
        await loadUserProfile(session.user.id, session.user.email!);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        await loadUserProfile(session.user.id, session.user.email!);
      } else {
        setSupabaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (id: string, email: string) => {
    try {
      console.log('Loading user profile for:', { id, email });
      
      // Get user data with metadata
      const authUser = (await supabase.auth.getUser()).data.user;
      console.log('Auth user:', authUser);
      
      // Check if user is admin based on user_metadata.is_admin, email or admin_configs table
      const isAdminByMetadata = authUser?.user_metadata?.is_admin === true;
      const isAdminByEmail = email === "admin@amigodopeito.com" || email.includes("admin");
      
      // Check admin_configs table
      const { data: adminConfig } = await supabase
        .from('admin_configs')
        .select('is_active')
        .eq('admin_email', email)
        .single();
      
      const isAdminByConfig = adminConfig?.is_active === true;
      
      if (isAdminByMetadata || isAdminByEmail || isAdminByConfig) {
        console.log('Setting admin user');
        setUser({
          id,
          name: authUser?.user_metadata?.full_name || "Administrador",
          email,
          role: "admin"
        });
        return;
      }

      // Check professionals table
      const { data: professional } = await supabase
        .from('professionals')
        .select('*')
        .eq('id', id)
        .single();

      if (professional) {
        console.log('Setting professional user:', professional);
        setUser({
          id: professional.id,
          name: professional.full_name,
          email: professional.email,
          role: "professional",
          category: professional.category,
          approved: professional.approved
        });
        return;
      }

      // Check influencers table
      const { data: influencer } = await supabase
        .from('influencers')
        .select('*')
        .eq('id', id)
        .single();

      if (influencer) {
        console.log('Setting influencer user:', influencer);
        setUser({
          id: influencer.id,
          name: influencer.full_name,
          email: influencer.email,
          role: "influencer"
        });
        return;
      }

      // Check users table for regular users
      const { data: regularUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (regularUser) {
        console.log('Setting regular user from users table:', regularUser);
        setUser({
          id: regularUser.id,
          name: regularUser.nome || authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || 'Usuário',
          email: regularUser.email,
          role: null
        });
        return;
      }

      // Fallback: usar dados básicos do auth para usuários regulares
      if (authUser) {
        console.log('Setting fallback user from auth data');
        setUser({
          id: authUser.id,
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuário',
          email: authUser.email || '',
          role: null
        });
        return;
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const login = async (email: string, password: string, role: UserRole) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        setSupabaseUser(data.user);
        await loadUserProfile(data.user.id, data.user.email!);
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      throw new Error(error.message || "Falha no login. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, userData: any, role: UserRole) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        // Insert user data into appropriate table based on role
        if (role === "professional") {
          const { error: insertError } = await supabase
            .from('professionals')
            .insert({
              id: data.user.id,
              user_id: data.user.id,
              ...userData
            });

          if (insertError) {
            throw new Error(insertError.message);
          }
        } else if (role === null) {
          // For regular users, insert into users table
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              nome: userData.full_name,
              email: userData.email,
              telefone: userData.phone
            });

          if (insertError) {
            throw new Error(insertError.message);
          }
        }

        // For regular users, don't auto-login, redirect to login page
        if (role === null) {
          return; // Don't set user state, let them login manually
        }

        setSupabaseUser(data.user);
        await loadUserProfile(data.user.id, data.user.email!);
      }
    } catch (error: any) {
      console.error("Registration failed:", error);
      throw new Error(error.message || "Falha no cadastro. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Use Supabase Auth for admin login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new Error(error.message);
      }

      // Verify admin permissions - check user_metadata.is_admin or email
      if (data.user?.user_metadata?.is_admin !== true && 
          data.user?.email !== "admin@amigodopeito.com" && 
          !data.user?.email?.includes("admin")) {
        await supabase.auth.signOut();
        throw new Error("Usuário não possui permissões administrativas");
      }

      if (data.user) {
        setSupabaseUser(data.user);
        await loadUserProfile(data.user.id, data.user.email!);
      }
    } catch (error: any) {
      console.error("Admin login failed:", error);
      throw new Error(error.message || "Falha no login administrativo");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, login, register, adminLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
};
