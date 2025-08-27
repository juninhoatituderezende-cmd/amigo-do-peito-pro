import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  Check, 
  X, 
  AlertTriangle, 
  RefreshCw, 
  Link,
  Shield,
  Database,
  RefreshCcw,
  Lock,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface AsaasIntegration {
  id: string;
  environment: string;
  status: string;
  connection_status: string;
  last_sync_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export function AsaasIntegrationManager() {
  const navigate = useNavigate();
  const [integration, setIntegration] = useState<AsaasIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidApiKey, setIsValidApiKey] = useState(false);
  const [autoTestTimer, setAutoTestTimer] = useState<NodeJS.Timeout | null>(null);
  const [form, setForm] = useState({
    apiKey: '',
    environment: 'sandbox' as 'sandbox' | 'production',
    autoSync: false
  });

  useEffect(() => {
    loadIntegration();
  }, []);

  // Auto-test connection after user stops typing API key
  useEffect(() => {
    if (autoTestTimer) {
      clearTimeout(autoTestTimer);
    }

    if (form.apiKey.length > 10) { // Basic validation for API key length
      setAutoTestTimer(setTimeout(() => {
        testConnectionSilent();
      }, 2000));
    } else {
      setIsValidApiKey(false);
    }

    return () => {
      if (autoTestTimer) {
        clearTimeout(autoTestTimer);
      }
    };
  }, [form.apiKey, form.environment]);

  const loadIntegration = async () => {
    try {
      const { data, error } = await supabase
        .from('asaas_integration')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setIntegration(data);
        setForm(prev => ({
          ...prev,
          environment: data.environment as 'sandbox' | 'production',
          autoSync: data.status === 'active'
        }));
      }
    } catch (error) {
      console.error('Error loading integration:', error);
      toast.error('Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!form.apiKey.trim()) {
      toast.error('Informe a API Key do Asaas');
      return;
    }

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-integration-manager', {
        body: {
          action: 'test_connection',
          api_key: form.apiKey,
          environment: form.environment
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Conexão testada com sucesso!');
        return true;
      } else {
        toast.error(data.error || 'Falha na conexão');
        return false;
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Erro ao testar conexão');
      return false;
    } finally {
      setTesting(false);
    }
  };

  // Silent test for auto-validation (no toasts)
  const testConnectionSilent = async () => {
    if (!form.apiKey.trim() || form.apiKey.length < 10) {
      setIsValidApiKey(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('asaas-integration-manager', {
        body: {
          action: 'test_connection',
          api_key: form.apiKey,
          environment: form.environment
        }
      });

      if (error) throw error;

      setIsValidApiKey(data.success);
    } catch (error) {
      console.error('Silent connection test failed:', error);
      setIsValidApiKey(false);
    }
  };

  const saveConfiguration = async () => {
    const connectionTest = await testConnection();
    if (!connectionTest) return;

    try {
      const { data, error } = await supabase.functions.invoke('asaas-integration-manager', {
        body: {
          action: 'save_configuration',
          api_key: form.apiKey,
          environment: form.environment,
          auto_sync: form.autoSync
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Configuração salva com sucesso!');
        await loadIntegration();
      } else {
        toast.error(data.error || 'Erro ao salvar configuração');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Erro ao salvar configuração');
    }
  };

  const syncProducts = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-integration-manager', {
        body: {
          action: 'sync_products'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Sincronização concluída: ${data.synced} produtos sincronizados`);
        await loadIntegration();
      } else {
        toast.error(data.error || 'Erro na sincronização');
      }
    } catch (error) {
      console.error('Error syncing products:', error);
      toast.error('Erro ao sincronizar produtos');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return 'bg-success text-success-foreground';
      case 'disconnected':
      case 'inactive':
        return 'bg-muted text-muted-foreground';
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Integração Asaas</h2>
        <div className="flex items-center gap-4">
          {integration && (
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(integration.connection_status)}>
                {integration.connection_status === 'connected' && <Check className="h-3 w-3 mr-1" />}
                {integration.connection_status === 'disconnected' && <X className="h-3 w-3 mr-1" />}
                {integration.connection_status === 'error' && <AlertTriangle className="h-3 w-3 mr-1" />}
                {integration.connection_status === 'connected' ? 'Conectado' : 
                 integration.connection_status === 'disconnected' ? 'Desconectado' : 'Erro'}
              </Badge>
              <Badge className={getStatusColor(integration.status)}>
                {integration.status === 'active' ? 'Ativo' : 
                 integration.status === 'inactive' ? 'Inativo' : 'Erro'}
              </Badge>
            </div>
          )}
          <Button 
            onClick={() => navigate('/admin/dashboard')}
            variant="outline"
            className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 rounded-lg"
          >
            Voltar ao Painel
          </Button>
        </div>
      </div>

      <Tabs defaultValue="configuration" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            Sincronização
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Monitoramento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configuração da API
              </CardTitle>
              <CardDescription>
                Configure a conexão com a API do Asaas para integração automática
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="apiKey" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    API Key do Asaas
                    {isValidApiKey && (
                      <Check className="h-4 w-4 text-success" />
                    )}
                    {form.apiKey && !isValidApiKey && form.apiKey.length > 10 && (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      placeholder="Insira sua API Key do Asaas"
                      value={form.apiKey}
                      onChange={(e) => setForm(prev => ({ ...prev, apiKey: e.target.value }))}
                      className={`pl-10 pr-12 ${
                        isValidApiKey ? 'border-success' : 
                        form.apiKey && !isValidApiKey && form.apiKey.length > 10 ? 'border-destructive' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {isValidApiKey && (
                    <p className="text-sm text-success flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      API Key válida e conectada
                    </p>
                  )}
                  {form.apiKey && !isValidApiKey && form.apiKey.length > 10 && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <X className="h-3 w-3" />
                      API Key inválida ou erro de conexão
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="environment">Ambiente</Label>
                  <Select 
                    value={form.environment}
                    onValueChange={(value: 'sandbox' | 'production') => 
                      setForm(prev => ({ ...prev, environment: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                      <SelectItem value="production">Produção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="autoSync"
                  checked={form.autoSync}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, autoSync: checked }))}
                />
                <Label htmlFor="autoSync">Sincronização automática ativa</Label>
              </div>

              <Alert>
                <Link className="h-4 w-4" />
                <AlertDescription>
                  A API Key será criptografada antes de ser armazenada no banco de dados.
                  Para ambiente de produção, certifique-se de usar a API Key de produção do Asaas.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button 
                  onClick={testConnection} 
                  disabled={testing || !form.apiKey.trim()}
                  variant="outline"
                >
                  {testing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Testar Conexão
                    </>
                  )}
                </Button>

                <Button 
                  onClick={saveConfiguration}
                  disabled={!isValidApiKey}
                  className={isValidApiKey ? 'bg-success hover:bg-success/90' : ''}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {isValidApiKey ? 'Salvar & Ativar' : 'Salvar Configuração'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync">
          <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCcw className="h-5 w-5" />
              Sincronização de Produtos
            </CardTitle>
              <CardDescription>
                Sincronize produtos e planos automaticamente com o Asaas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {integration && integration.connection_status === 'connected' ? (
                <>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Sincronização Manual</h4>
                      <p className="text-sm text-muted-foreground">
                        Sincroniza todos os produtos e planos com o Asaas
                      </p>
                    </div>
                    <Button 
                      onClick={syncProducts} 
                      disabled={syncing}
                    >
                      {syncing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Sincronizando...
                        </>
                      ) : (
                        <>
                          <RefreshCcw className="h-4 w-4 mr-2" />
                          Sincronizar Agora
                        </>
                      )}
                    </Button>
                  </div>

                  {integration.last_sync_at && (
                    <Alert>
                      <Database className="h-4 w-4" />
                      <AlertDescription>
                        Última sincronização: {new Date(integration.last_sync_at).toLocaleString('pt-BR')}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Configure e teste a conexão primeiro para habilitar a sincronização.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Status da Integração
              </CardTitle>
              <CardDescription>
                Monitore o status e histórico da integração
              </CardDescription>
            </CardHeader>
            <CardContent>
              {integration ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Status da Conexão</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(integration.connection_status)}>
                          {integration.connection_status === 'connected' ? 'Conectado' : 
                           integration.connection_status === 'disconnected' ? 'Desconectado' : 'Erro'}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label>Ambiente</Label>
                      <p className="text-sm mt-1 capitalize">{integration.environment}</p>
                    </div>

                    <div>
                      <Label>Criado em</Label>
                      <p className="text-sm mt-1">
                        {new Date(integration.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Status do Sistema</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(integration.status)}>
                          {integration.status === 'active' ? 'Ativo' : 
                           integration.status === 'inactive' ? 'Inativo' : 'Erro'}
                        </Badge>
                      </div>
                    </div>

                    {integration.last_sync_at && (
                      <div>
                        <Label>Última Sincronização</Label>
                        <p className="text-sm mt-1">
                          {new Date(integration.last_sync_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}

                    <div>
                      <Label>Atualizado em</Label>
                      <p className="text-sm mt-1">
                        {new Date(integration.updated_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {integration.error_message && (
                    <div className="md:col-span-2">
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Último Erro:</strong> {integration.error_message}
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhuma configuração encontrada. Configure a integração primeiro.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}