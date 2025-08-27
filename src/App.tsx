import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AdminLoginRedirect } from "@/components/AdminLoginRedirect";
import { AuthRedirect } from "@/components/AuthRedirect";
import { ScrollToTop, ConnectionStatus } from "@/components/ui/ux-improvements";
import { diagnostics } from "@/lib/diagnostics";
import { ProWallet } from "@/components/pro/ProWallet";
import { InfluencerWallet } from "@/components/influencer/InfluencerWallet";
import { MobileDebugPanel } from "./components/MobileDebugPanel";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminPlanosTatuagem from "./pages/admin/AdminPlanosTatuagem";
import AdminPlanosOdontologia from "./pages/admin/AdminPlanosOdontologia";
import AdminProdutos from "./pages/admin/AdminProdutos";
import AdminMarketplace from "./pages/admin/AdminMarketplace";
import AdminPagamentos from "./pages/admin/AdminPagamentos";
import AdminIntegracaoAsaas from "./pages/admin/AdminIntegracaoAsaas";
import AdminMLM from "./pages/admin/AdminMLM";
import AdminNotificacoes from "./pages/admin/AdminNotificacoes";
import AdminRelatorios from "./pages/admin/AdminRelatorios";
import Register from "./pages/Register";
import ProfessionalLogin from "./pages/ProfessionalLogin";
import Confirmation from "./pages/Confirmation";
import ProDashboard from "./pages/pro/ProDashboard";
import ProProfile from "./pages/pro/ProProfile";
import ProSchedule from "./pages/pro/ProSchedule";
import ProFinances from "./pages/pro/ProFinances";
import ProServices from "./pages/pro/ProServices";
import UserRegister from "./pages/UserRegister";
import UserLogin from "./pages/UserLogin";
import CreateAdmin from "./pages/CreateAdmin";
import CreateAdmins from "./pages/CreateAdmins";
import QuickLogin from "./pages/QuickLogin";
import UserDashboard from "./pages/user/UserDashboard";
import UserMarketplace from "./pages/user/UserMarketplace";
import UserWithdrawals from "./pages/user/UserWithdrawals";
import UserNotifications from "./pages/user/UserNotifications";
import UserHistory from "./pages/user/UserHistory";
import UserGroups from "./pages/user/UserGroups";
import UserReferrals from "./pages/user/UserReferrals";
import UserCredits from "./pages/user/UserCredits";
import UserProfile from "./pages/user/UserProfile";
import Marketplace from "./pages/Marketplace";
import Plans from "./pages/Plans";
import PlanSubscription from "./pages/PlanSubscription";
import { PlanDetails } from "./pages/PlanDetails";
import InfluencerRegister from "./pages/InfluencerRegister";
import InfluencerLogin from "./pages/InfluencerLogin";
import InfluencerDashboard from "./pages/influencer/InfluencerDashboard";
import InfluencerTools from "./pages/influencer/InfluencerTools";
import MLMProducts from "./pages/MLMProducts";
import MLMDashboard from "./pages/MLMDashboard";
import MLMSuccess from "./pages/MLMSuccess";
import MLMCancel from "./pages/MLMCancel";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import About from "./pages/About";
import EmailConfirmationHelp from "./pages/EmailConfirmationHelp";
import Todos from "./pages/Todos";

// Initialize diagnostics

diagnostics.enableDebugMode();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <ConnectionStatus />
            <Toaster />
            <Sonner />
            <AuthRedirect />
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/sobre" element={<About />} />
              <Route path="/confirmacao-email" element={<EmailConfirmationHelp />} />
              <Route path="/todos" element={<Todos />} />
              
              {/* Nova rota unificada de autenticação */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Rotas de compatibilidade - redirecionam para /auth */}
              <Route path="/cadastro" element={<Navigate to="/auth?mode=register" replace />} />
              <Route path="/usuario/cadastro" element={<Navigate to="/auth?mode=register" replace />} />
              <Route path="/usuario/login" element={<Navigate to="/auth?mode=login" replace />} />
              <Route path="/influenciador/cadastro" element={<Navigate to="/auth?mode=register" replace />} />
              <Route path="/influenciador/login" element={<Navigate to="/auth?mode=login" replace />} />
              <Route path="/profissional/login" element={<Navigate to="/auth?mode=login" replace />} />
              
              <Route path="/confirmacao" element={<Confirmation />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/login-rapido" element={<QuickLogin />} />
              <Route path="/create-admin" element={<CreateAdmin />} />
              <Route path="/create-admins" element={<CreateAdmins />} />
              <Route path="/usuario/dashboard" element={
                <ProtectedRoute role="user">
                  <UserDashboard />
                </ProtectedRoute>
              } />
              <Route path="/usuario/grupos" element={
                <ProtectedRoute role="user">
                  <UserGroups />
                </ProtectedRoute>
              } />
              <Route path="/usuario/indicacoes" element={
                <ProtectedRoute role="user">
                  <UserReferrals />
                </ProtectedRoute>
              } />
              <Route path="/usuario/creditos" element={
                <ProtectedRoute role="user">
                  <UserCredits />
                </ProtectedRoute>
              } />
              <Route path="/usuario/perfil" element={
                <ProtectedRoute role="user">
                  <UserProfile />
                </ProtectedRoute>
              } />
              <Route path="/usuario/marketplace" element={
                <ProtectedRoute role="user">
                  <UserMarketplace />
                </ProtectedRoute>
              } />
              <Route path="/usuario/saques" element={
                <ProtectedRoute role="user">
                  <UserWithdrawals />
                </ProtectedRoute>
              } />
              <Route path="/usuario/notificacoes" element={
                <ProtectedRoute role="user">
                  <UserNotifications />
                </ProtectedRoute>
              } />
              <Route path="/usuario/historico" element={
                <ProtectedRoute role="user">
                  <UserHistory />
                </ProtectedRoute>
              } />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/plano/:planCode" element={<PlanSubscription />} />
              <Route path="/plano-detalhes/:planId" element={<PlanDetails />} />
              
              {/* Professional Routes */}
              <Route path="/profissional/dashboard" element={
                <ProtectedRoute role="professional">
                  <ProDashboard />
                </ProtectedRoute>
              } />
              <Route path="/profissional/perfil" element={
                <ProtectedRoute role="professional">
                  <ProProfile />
                </ProtectedRoute>
              } />
              <Route path="/profissional/agenda" element={
                <ProtectedRoute role="professional">
                  <ProSchedule />
                </ProtectedRoute>
              } />
              <Route path="/profissional/financeiro" element={
                <ProtectedRoute role="professional">
                  <ProFinances />
                </ProtectedRoute>
              } />
              <Route path="/profissional/servicos" element={
                <ProtectedRoute role="professional">
                  <ProServices />
                </ProtectedRoute>
              } />
              <Route path="/profissional/marketplace" element={
                <ProtectedRoute role="professional">
                  <Marketplace />
                </ProtectedRoute>
              } />
              <Route path="/profissional/carteira" element={
                <ProtectedRoute role="professional">
                  <div className="min-h-screen bg-background">
                    <div className="flex">
                      <div className="flex-1 p-8">
                        <div className="mb-8">
                          <h1 className="text-3xl font-bold text-foreground mb-2">Carteira</h1>
                          <p className="text-muted-foreground">Gerencie seus ganhos e saques</p>
                        </div>
                        <ProWallet />
                      </div>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              {/* Influencer Routes */}
              <Route path="/influenciador/dashboard" element={
                <ProtectedRoute role="influencer">
                  <InfluencerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/influenciador/ferramentas" element={
                <ProtectedRoute role="influencer">
                  <InfluencerTools />
                </ProtectedRoute>
              } />
              <Route path="/influenciador/marketplace" element={
                <ProtectedRoute role="influencer">
                  <Marketplace />
                </ProtectedRoute>
              } />
              <Route path="/influenciador/carteira" element={
                <ProtectedRoute role="influencer">
                  <div className="min-h-screen bg-background">
                    <div className="flex">
                      <div className="flex-1 p-8">
                        <div className="mb-8">
                          <h1 className="text-3xl font-bold text-foreground mb-2">Carteira</h1>
                          <p className="text-muted-foreground">Gerencie suas comissões e saques</p>
                        </div>
                        <InfluencerWallet />
                      </div>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              {/* MLM Routes */}
              <Route path="/mlm/products" element={<MLMProducts />} />
              <Route path="/mlm/dashboard" element={<MLMDashboard />} />
              <Route path="/mlm/success" element={<MLMSuccess />} />
              <Route path="/mlm/cancel" element={<MLMCancel />} />
              
              {/* Admin Routes - Protected with AdminProtectedRoute */}
              {/* Admin-login route for direct admin access */}
              <Route path="/admin" element={
                <AdminLoginRedirect>
                  <AdminLogin />
                </AdminLoginRedirect>
              } />
              <Route path="/admin/dashboard" element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/usuarios" element={
                <AdminProtectedRoute>
                  <AdminUsuarios />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/planos-tatuagem" element={
                <AdminProtectedRoute>
                  <AdminPlanosTatuagem />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/planos-odontologia" element={
                <AdminProtectedRoute>
                  <AdminPlanosOdontologia />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/pagamentos" element={
                <AdminProtectedRoute>
                  <AdminPagamentos />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/integracao-asaas" element={
                <AdminProtectedRoute>
                  <AdminIntegracaoAsaas />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/marketplace" element={
                <AdminProtectedRoute>
                  <AdminMarketplace />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/produtos" element={
                <AdminProtectedRoute>
                  <AdminProdutos />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/mlm" element={
                <AdminProtectedRoute>
                  <AdminMLM />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/notificacoes" element={
                <AdminProtectedRoute>
                  <AdminNotificacoes />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/relatorios" element={
                <AdminProtectedRoute>
                  <AdminRelatorios />
                </AdminProtectedRoute>
              } />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
      <MobileDebugPanel />
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;