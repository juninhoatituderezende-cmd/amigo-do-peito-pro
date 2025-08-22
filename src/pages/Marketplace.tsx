import React from 'react';
import { Marketplace as MarketplaceComponent } from "@/components/marketplace/Marketplace";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const Marketplace = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirecionar usuários não logados para login
  if (!user) {
    return <Navigate to="/usuario/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <MarketplaceComponent />
      </main>
      <Footer />
    </div>
  );
};

export default Marketplace;