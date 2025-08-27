import { SpecificServicePlansManager } from "@/components/admin/SpecificServicePlansManager";

const serviceType = {
  id: 'dentista',
  name: 'Planos Odontológicos',
  description: 'Serviços dentários e ortodônticos',
  icon: null,
  table: 'planos_dentista',
  color: 'bg-gradient-to-br from-blue-500 to-cyan-600'
};

export default function AdminPlanosOdontologia() {
  return (
    <SpecificServicePlansManager
      serviceType={serviceType}
      onBack={() => window.history.back()}
    />
  );
}