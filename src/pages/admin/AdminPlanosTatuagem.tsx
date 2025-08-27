import { SpecificServicePlansManager } from "@/components/admin/SpecificServicePlansManager";

const serviceType = {
  id: 'tatuador',
  name: 'Planos de Tatuagem',
  description: 'Serviços de tatuagem e arte corporal',
  icon: null,
  table: 'planos_tatuador',
  color: 'bg-gradient-to-br from-red-500 to-pink-600'
};

export default function AdminPlanosTatuagem() {
  return (
    <SpecificServicePlansManager
      serviceType={serviceType}
      onBack={() => window.history.back()}
    />
  );
}