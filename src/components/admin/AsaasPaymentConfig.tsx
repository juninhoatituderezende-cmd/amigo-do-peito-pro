import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Key, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export function AsaasPaymentConfig() {
  const [apiKey, setApiKey] = useState("");
  const [environment, setEnvironment] = useState<"sandbox" | "production">("sandbox");
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connected" | "error">("disconnected");
  const [config, setConfig] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('asaas_integration')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setConfig(data);
        setEnvironment(data.environment as "sandbox" | "production");
        setConnectionStatus(data.connection_status as "disconnected" | "connected" | "error" || "disconnected");
      }
    } catch (error) {
      console.log("Nenhuma configuração encontrada");
    }
  };

  const testConnection = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira a API key.",
        variant: "destructive",
      });
      return;
    }

    setTestingConnection(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-integration-manager', {
        body: {
          action: 'test_connection',
          api_key: apiKey,
          environment: environment
        }
      });

      if (error) throw error;

      if (data.success) {
        setConnectionStatus("connected");
        toast({
          title: "Conexão bem-sucedida!",
          description: `Conectado à conta: ${data.account?.name || 'Asaas'}`,
        });
      } else {
        setConnectionStatus("error");
        toast({
          title: "Erro na conexão",
          description: data.error || "Não foi possível conectar com a API.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      setConnectionStatus("error");
      toast({
        title: "Erro",
        description: "Erro ao testar a conexão com a API.",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const saveConfiguration = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira a API key.",
        variant: "destructive",
      });
      return;
    }

    if (connectionStatus !== "connected") {
      toast({
        title: "Erro",
        description: "Por favor, teste a conexão antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-integration-manager', {
        body: {
          action: 'save_configuration',
          api_key: apiKey,
          environment: environment
        }
      });

      if (error) throw error;

      if (data.success) {
        setConfig(data.config);
        toast({
          title: "Configuração salva!",
          description: "API key configurada com sucesso.",
        });
        setApiKey(""); // Limpar o campo por segurança
        loadConfiguration(); // Recarregar configurações
      } else {
        throw new Error(data.error || "Erro ao salvar configuração");
      }
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar a configuração.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected": return "text-green-600";
      case "error": return "text-red-600";
      default: return "text-gray-500";
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "connected": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Configuração API Asaas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status atual */}
        {config && (
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Status da integração:</span>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className={`capitalize ${getStatusColor()}`}>
                  {config.connection_status === "connected" ? "Conectado" : "Desconectado"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Ambiente:</span>
                <Badge variant={config.environment === "production" ? "default" : "secondary"} className="ml-2">
                  {config.environment === "production" ? "Produção" : "Sandbox"}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">Última sincronização:</span>
                <span className="ml-2">
                  {config.last_sync_at ? new Date(config.last_sync_at).toLocaleString() : "Nunca"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Formulário de configuração */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="environment">Ambiente</Label>
            <Select value={environment} onValueChange={(value: "sandbox" | "production") => setEnvironment(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ambiente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (Teste)</SelectItem>
                <SelectItem value="production">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key Asaas</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Insira sua API key do Asaas"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Sua API key será armazenada de forma segura e criptografada.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={testConnection}
              disabled={testingConnection || !apiKey.trim()}
              variant="outline"
              className="flex-1"
            >
              {testingConnection ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                "Testar Conexão"
              )}
            </Button>

            <Button
              onClick={saveConfiguration}
              disabled={loading || connectionStatus !== "connected"}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Configuração"
              )}
            </Button>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Como obter sua API Key:</h4>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Acesse sua conta no Asaas</li>
            <li>2. Vá em Configurações → Integrações → API</li>
            <li>3. Copie sua API Key {environment === "sandbox" ? "(Sandbox)" : "(Produção)"}</li>
            <li>4. Cole aqui e teste a conexão</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}