
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
  adminLogin: (password: string) => Promise<void>;
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
      // Check if user is admin
      if (email === "admin@amigodopeito.com") {
        setUser({
          id,
          name: "Administrador",
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

      // Check users table
      const { data: regularUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (regularUser) {
        setUser({
          id: regularUser.id,
          name: regularUser.full_name,
          email: regularUser.email,
          role: null
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
        setUser({
          id: influencer.id,
          name: influencer.full_name,
          email: influencer.email,
          role: "influencer"
        });
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
        password
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        // Insert user data into appropriate table
        if (role === "professional") {
          const { error: insertError } = await supabase
            .from('professionals')
            .insert({
              id: data.user.id,
              ...userData
            });

          if (insertError) {
            throw new Error(insertError.message);
          }
        } else {
          // Regular user
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              ...userData
            });

          if (insertError) {
            throw new Error(insertError.message);
          }
        }

        // For users, don't auto-login, redirect to login page
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

  const adminLogin = async (password: string) => {
    setLoading(true);
    
    try {
      // Verify admin password
      if (password !== "Atitude2025@") {
        throw new Error("Senha incorreta!");
      }

      const adminUser = {
        id: "admin-1",
        name: "Administrador",
        email: "admin@amigodopeito.com",
        role: "admin" as UserRole,
      };

      localStorage.setItem("user", JSON.stringify(adminUser));
      setUser(adminUser);
    } catch (error) {
      console.error("Admin login failed:", error);
      throw error;
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
