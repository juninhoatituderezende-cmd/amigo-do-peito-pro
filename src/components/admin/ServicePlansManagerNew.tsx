import { useState } from "react";
import { ServiceTypeSelector } from "./ServiceTypeSelector";
import { SpecificServicePlansManager } from "./SpecificServicePlansManager";

interface ServiceType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  table: string;
  color: string;
}

export function ServicePlansManagerNew() {
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);

  const handleSelectType = (serviceType: ServiceType) => {
    setSelectedServiceType(serviceType);
  };

  const handleBack = () => {
    setSelectedServiceType(null);
  };

  if (selectedServiceType) {
    return (
      <SpecificServicePlansManager
        serviceType={selectedServiceType}
        onBack={handleBack}
      />
    );
  }

  return <ServiceTypeSelector onSelectType={handleSelectType} />;
}