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
  { title: "Dashboard", url: "/usuario", icon: LayoutDashboard, roles: [null] },
  { title: "Meus Planos", url: "/usuario/planos", icon: Package, roles: [null] },
  { title: "Indicações", url: "/usuario/indicacoes", icon: Users, roles: [null] },
  { title: "Créditos", url: "/usuario/creditos", icon: Gift, roles: [null] },
  { title: "Carteira", url: "/usuario/carteira", icon: CreditCard, roles: [null] },
];

export function AppSidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  // Filter menu items based on user role
  const filteredItems = menuItems.filter(item => 
    item.roles.includes(user?.role || null)
  );

  const isActive = (path: string) => {
    if (path === currentPath) return true;
    if (path !== '/' && currentPath.startsWith(path)) return true;
    return false;
  };

  const getNavClass = (isActiveRoute: boolean) => 
    isActiveRoute 
      ? "bg-primary text-primary-foreground font-medium" 
      : "hover:bg-muted/50";

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
    <Sidebar className="w-60">
      <SidebarContent>
        {/* User Info */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>
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
                      className={({ isActive }) => getNavClass(isActive)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="ml-2">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel>Ações Rápidas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/suporte" className="hover:bg-muted/50">
                    <Bell className="h-4 w-4" />
                    <span className="ml-2">Suporte</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {user.role === 'admin' && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/configuracoes" className="hover:bg-muted/50">
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