import { EnhancedReportsAnalytics } from "@/components/admin/EnhancedReportsAnalytics";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AdminRelatorios() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <EnhancedReportsAnalytics />
      </main>
      <Footer />
    </div>
  );
}