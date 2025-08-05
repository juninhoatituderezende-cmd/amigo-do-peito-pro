
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import MLMAdmin from "./pages/admin/MLMAdmin";
import Register from "./pages/Register";
import Confirmation from "./pages/Confirmation";
import ProDashboard from "./pages/pro/ProDashboard";
import ProProfile from "./pages/pro/ProProfile";
import ProSchedule from "./pages/pro/ProSchedule";
import ProFinances from "./pages/pro/ProFinances";
import ProServices from "./pages/pro/ProServices";
import UserRegister from "./pages/UserRegister";
import UserLogin from "./pages/UserLogin";
import UserDashboard from "./pages/user/UserDashboard";
import InfluencerRegister from "./pages/InfluencerRegister";
import InfluencerLogin from "./pages/InfluencerLogin";
import InfluencerDashboard from "./pages/influencer/InfluencerDashboard";
import MLMProducts from "./pages/MLMProducts";
import MLMDashboard from "./pages/MLMDashboard";
import MLMSuccess from "./pages/MLMSuccess";
import MLMCancel from "./pages/MLMCancel";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import About from "./pages/About";
import Todos from "./pages/Todos";

const queryClient = new QueryClient();

const App = () => (
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
            <Route path="/usuario/dashboard" element={<UserDashboard />} />
            
            {/* Influencer Routes */}
            <Route path="/influenciador/cadastro" element={<InfluencerRegister />} />
            <Route path="/influenciador/login" element={<InfluencerLogin />} />
            <Route path="/influenciador/dashboard" element={
              <ProtectedRoute role="influencer">
                <InfluencerDashboard />
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
            <Route path="/admin/mlm" element={
              <ProtectedRoute role="admin">
                <MLMAdmin />
              </ProtectedRoute>
            } />
            
            {/* Professional Protected Routes */}
            <Route path="/profissional" element={
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
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
