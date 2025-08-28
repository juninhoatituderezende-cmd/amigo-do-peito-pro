import { AsaasPaymentConfig } from "@/components/admin/AsaasPaymentConfig";

export default function AdminIntegracaoAsaas() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Integração Asaas</h1>
        <p className="text-muted-foreground">Configure a API do Asaas para processar pagamentos dos planos.</p>
      </div>
      <AsaasPaymentConfig />
    </div>
  );
}