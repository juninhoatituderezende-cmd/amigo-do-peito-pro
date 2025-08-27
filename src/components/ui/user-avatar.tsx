import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showFallback?: boolean;
}

export const UserAvatar = ({ size = "md", className = "", showFallback = true }: UserAvatarProps) => {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-16 w-16"
  };

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        // Buscar dados do perfil no Supabase incluindo avatar_url
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setUserName(profile.full_name || user.email || "Usuário");
          
          // Usar avatar_url se disponível
          if (profile.avatar_url) {
            setAvatarUrl(profile.avatar_url);
          }
        } else {
          setUserName(user.email || "Usuário");
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        setUserName(user.email || "Usuário");
      }
    };

    loadUserData();
  }, [user]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {avatarUrl && (
        <AvatarImage 
          src={avatarUrl} 
          alt={userName}
          className="object-cover"
        />
      )}
      <AvatarFallback>
        {showFallback ? (
          userName ? getInitials(userName) : <User className="h-4 w-4" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </AvatarFallback>
    </Avatar>
  );
};