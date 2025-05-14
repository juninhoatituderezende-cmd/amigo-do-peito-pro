
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Register from "./pages/Register";
import Confirmation from "./pages/Confirmation";
import ProDashboard from "./pages/pro/ProDashboard";
import ProProfile from "./pages/pro/ProProfile";
import ProSchedule from "./pages/pro/ProSchedule";
import ProFinances from "./pages/pro/ProFinances";
import ProServices from "./pages/pro/ProServices";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import About from "./pages/About";

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
            <Route path="/cadastro" element={<Register />} />
            <Route path="/confirmacao" element={<Confirmation />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            
            {/* Admin Protected Routes */}
            <Route path="/admin" element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
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
