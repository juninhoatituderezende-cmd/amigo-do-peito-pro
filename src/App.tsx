import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { diagnostics } from "@/lib/diagnostics";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import MLMAdmin from "./pages/admin/MLMAdmin";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminPlanos from "./pages/admin/AdminPlanos";
import AdminPagamentos from "./pages/admin/AdminPagamentos";
import AdminMLM from "./pages/admin/AdminMLM";
import AdminNotificacoes from "./pages/admin/AdminNotificacoes";
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
import QuickLogin from "./pages/QuickLogin";
import UserDashboard from "./pages/user/UserDashboard";
import UserMarketplace from "./pages/user/UserMarketplace";
import UserWithdrawals from "./pages/user/UserWithdrawals";
import UserNotifications from "./pages/user/UserNotifications";
import UserHistory from "./pages/user/UserHistory";
import Marketplace from "./pages/Marketplace";
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
import Todos from "./pages/Todos";

// Initialize diagnostics
console.log("🚀 APP STARTING - Initializing diagnostics...");
diagnostics.enableDebugMode();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/sobre" element={<About />} />
            <Route path="/todos" element={<Todos />} />
            <Route path="/cadastro" element={<Register />} />
            <Route path="/confirmacao" element={<Confirmation />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            
            {/* User Routes */}
            <Route path="/usuario/cadastro" element={<UserRegister />} />
            <Route path="/usuario/login" element={<UserLogin />} />
            <Route path="/login-rapido" element={<QuickLogin />} />
            <Route path="/create-admin" element={<CreateAdmin />} />
            <Route path="/usuario/dashboard" element={
              <ProtectedRoute role="user">
                <UserDashboard />
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
            
            {/* Professional Routes */}
            <Route path="/profissional/login" element={<ProfessionalLogin />} />
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
            
            {/* Influencer Routes */}
            <Route path="/influenciador/cadastro" element={<InfluencerRegister />} />
            <Route path="/influenciador/login" element={<InfluencerLogin />} />
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
            
            {/* MLM Routes */}
            <Route path="/mlm/products" element={<MLMProducts />} />
            <Route path="/mlm/dashboard" element={<MLMDashboard />} />
            <Route path="/mlm/success" element={<MLMSuccess />} />
            <Route path="/mlm/cancel" element={<MLMCancel />} />
            
            {/* Admin Protected Routes */}
            <Route path="/admin" element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/usuarios" element={
              <ProtectedRoute role="admin">
                <AdminUsuarios />
              </ProtectedRoute>
            } />
            <Route path="/admin/planos" element={
              <ProtectedRoute role="admin">
                <AdminPlanos />
              </ProtectedRoute>
            } />
            <Route path="/admin/pagamentos" element={
              <ProtectedRoute role="admin">
                <AdminPagamentos />
              </ProtectedRoute>
            } />
            <Route path="/admin/mlm" element={
              <ProtectedRoute role="admin">
                <AdminMLM />
              </ProtectedRoute>
            } />
            <Route path="/admin/notificacoes" element={
              <ProtectedRoute role="admin">
                <AdminNotificacoes />
              </ProtectedRoute>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;