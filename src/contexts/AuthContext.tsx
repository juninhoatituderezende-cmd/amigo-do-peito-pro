
import React, { createContext, useContext, useState, useEffect } from "react";

type UserRole = "admin" | "professional" | null;

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
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  adminLogin: (password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem("user");
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    setLoading(true);
    
    try {
      // In a real app, this would be an API call
      // For now, we'll simulate a successful login for demonstration
      const mockUser = {
        id: "pro-123",
        name: "Professional User",
        email,
        role,
        category: "tatuador", // or "dentista"
        approved: role === "admin" ? true : Math.random() > 0.5, // Random approval for demo
      };

      // Store the user in localStorage
      localStorage.setItem("user", JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (error) {
      console.error("Login failed:", error);
      throw new Error("Falha no login. Por favor, tente novamente.");
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

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, adminLogin, logout, loading }}>
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
