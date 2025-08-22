import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useNotifications } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  CreditCard, 
  Settings, 
  Calendar,
  TrendingUp,
  Gift,
  FileText,
  Bell,
  UserCheck,
  DollarSign,
  BarChart3,
  Link as LinkIcon,
  History,
  Network
} from 'lucide-react';

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const menuItems: MenuItem[] = [
  // Admin Items
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, roles: ["admin"] },
  { title: "Usuários", url: "/admin/usuarios", icon: Users, roles: ["admin"] },
  { title: "Marketplace", url: "/admin/marketplace", icon: Package, roles: ["admin"] },
  { title: "Produtos", url: "/admin/produtos", icon: Package, roles: ["admin"] },
  { title: "Planos Custom", url: "/admin/planos", icon: Package, roles: ["admin"] },
  { title: "Pagamentos", url: "/admin/pagamentos", icon: CreditCard, roles: ["admin"] },
  { title: "Relatórios", url: "/admin/relatorios", icon: BarChart3, roles: ["admin"] },
  { title: "MLM (Min)", url: "/admin/mlm", icon: Network, roles: ["admin"] },
  { title: "Notificações", url: "/admin/notificacoes", icon: Bell, roles: ["admin"] },
  
  // Professional Items
  { title: "Dashboard", url: "/profissional", icon: LayoutDashboard, roles: ["professional"] },
  { title: "Meus Clientes", url: "/profissional/clientes", icon: Users, roles: ["professional"] },
  { title: "Agenda", url: "/profissional/agenda", icon: Calendar, roles: ["professional"] },
  { title: "Serviços", url: "/profissional/servicos", icon: Package, roles: ["professional"] },
  { title: "Financeiro", url: "/profissional/financeiro", icon: DollarSign, roles: ["professional"] },
  { title: "Perfil", url: "/profissional/perfil", icon: Settings, roles: ["professional"] },
  
  // Influencer Items
  { title: "Dashboard", url: "/influenciador", icon: LayoutDashboard, roles: ["influencer"] },
  { title: "Meu Link", url: "/influenciador/link", icon: LinkIcon, roles: ["influencer"] },
  { title: "Comissões", url: "/influenciador/comissoes", icon: DollarSign, roles: ["influencer"] },
  { title: "Histórico", url: "/influenciador/historico", icon: History, roles: ["influencer"] },
  { title: "Ferramentas", url: "/influenciador/ferramentas", icon: TrendingUp, roles: ["influencer"] },
  
  // User Items
  { title: "Dashboard", url: "/usuario/dashboard", icon: LayoutDashboard, roles: ["user"] },
  { title: "Marketplace", url: "/usuario/marketplace", icon: Package, roles: ["user"] },
  { title: "Saques", url: "/usuario/saques", icon: DollarSign, roles: ["user"] },
  { title: "Notificações", url: "/usuario/notificacoes", icon: Bell, roles: ["user"] },
  { title: "Histórico", url: "/usuario/historico", icon: History, roles: ["user"] },
  { title: "Créditos", url: "/usuario/creditos", icon: Gift, roles: ["user"] },
];

export function AppSidebar() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const currentPath = location.pathname;

  // Filter menu items based on user role
  const filteredItems = menuItems.filter(item => 
    item.roles.includes(user?.role || "user")
  );

  const isActive = (path: string) => {
    if (path === currentPath) return true;
    if (path !== '/' && currentPath.startsWith(path)) return true;
    return false;
  };

  const getNavClass = (isActiveRoute: boolean) => 
    isActiveRoute 
      ? "bg-primary text-black font-semibold shadow-md border-primary/30" 
      : "text-white hover:bg-primary/20 hover:text-primary border-transparent";

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'admin': return 'Administração';
      case 'professional': return 'Profissional';
      case 'influencer': return 'Influenciador';
      default: return 'Usuário';
    }
  };

  if (!user) return null;

  return (
    <Sidebar className="w-60 gradient-dark border-r border-primary/20">
      <SidebarContent className="bg-transparent">
        {/* User Info */}
        <div className="p-4 border-b border-primary/20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-black text-sm font-bold shadow-md">
              {user.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">{user.full_name || user.email?.split('@')[0]}</p>
              <p className="text-xs text-primary">{getRoleLabel()}</p>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold">
            Menu {getRoleLabel()}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                     <NavLink 
                       to={item.url} 
                       end={item.url === '/admin' || item.url === '/profissional' || item.url === '/influenciador' || item.url === '/usuario'}
                       className={({ isActive }) => `flex items-center p-2 rounded-md border transition-all ${getNavClass(isActive)}`}
                     >
                       <item.icon className="h-4 w-4" />
                       <span className="ml-2">{item.title}</span>
                       {item.title === "Notificações" && unreadCount > 0 && (
                         <Badge variant="destructive" className="ml-auto min-w-[1.5rem] h-5 text-xs bg-primary text-black">
                           {unreadCount}
                         </Badge>
                       )}
                     </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold">Ações Rápidas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/suporte" className="flex items-center p-2 rounded-md text-white hover:bg-primary/20 hover:text-primary transition-all">
                    <Bell className="h-4 w-4" />
                    <span className="ml-2">Suporte</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {user.role === 'admin' && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/configuracoes" className="flex items-center p-2 rounded-md text-white hover:bg-primary/20 hover:text-primary transition-all">
                      <Settings className="h-4 w-4" />
                      <span className="ml-2">Configurações</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}