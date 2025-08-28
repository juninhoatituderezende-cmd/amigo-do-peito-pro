import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ValidationResult {
  table: string;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  missing_required_fields: number;
  suspicious_data: number;
  last_check: string;
}

export const DataValidationMonitor = () => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  const runValidation = async () => {
    setLoading(true);
    try {
      console.log('🔍 [DATA-VALIDATION] Iniciando validação de dados...');

      // Validar planos de tatuagem
      const { data: tattooPlans } = await supabase
        .from('planos_tatuador')
        .select('*');

      // Validar planos de dentista
      const { data: dentalPlans } = await supabase
        .from('planos_dentista')
        .select('*');

      // Validar custom plans
      const { data: customPlans } = await supabase
        .from('custom_plans')
        .select('*');

      // Validar produtos
      const { data: products } = await supabase
        .from('products')
        .select('*');

      // Validar profiles (usuários)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*');

      // Validar transações
      const { data: transactions } = await supabase
        .from('transacoes')
        .select('*');

      const results: ValidationResult[] = [
        validateTable('planos_tatuador', tattooPlans || [], ['name', 'price']),
        validateTable('planos_dentista', dentalPlans || [], ['name', 'price']),
        validateTable('custom_plans', customPlans || [], ['name', 'price']),
        validateTable('products', products || [], ['name', 'price']),
        validateTable('profiles', profiles || [], ['full_name', 'email']),
        validateTable('transacoes', transactions || [], ['usuario_id', 'valor'])
      ];

      setValidationResults(results);
      setLastUpdate(new Date());

      const totalIssues = results.reduce((sum, r) => sum + r.invalid_records + r.suspicious_data, 0);
      
      if (totalIssues > 0) {
        toast({
          title: "⚠️ Problemas encontrados",
          description: `${totalIssues} registros com problemas detectados`,
          variant: "default",
        });
      } else {
        toast({
          title: "✅ Validação completa",
          description: "Todos os dados estão válidos",
          variant: "default",
        });
      }

    } catch (error) {
      console.error('❌ [DATA-VALIDATION] Erro:', error);
      toast({
        title: "Erro na validação",
        description: "Falha ao validar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateTable = (tableName: string, data: any[], requiredFields: string[]): ValidationResult => {
    const total = data.length;
    let valid = 0;
    let invalid = 0;
    let missingRequired = 0;
    let suspicious = 0;

    data.forEach(record => {
      let isValid = true;
      let hasMissingRequired = false;
      let isSuspicious = false;

      // Verificar campos obrigatórios
      requiredFields.forEach(field => {
        if (!record[field] || (typeof record[field] === 'string' && record[field].trim() === '')) {
          hasMissingRequired = true;
          isValid = false;
        }
      });

      // Verificar dados suspeitos
      if (record.name && (
        record.name.toLowerCase().includes('test') ||
        record.name.toLowerCase().includes('mock') ||
        record.name.toLowerCase().includes('fake') ||
        record.name.toLowerCase().includes('exemplo')
      )) {
        isSuspicious = true;
        isValid = false;
      }

      // Verificar preços suspeitos
      if (record.price && (record.price <= 0 || record.price > 100000)) {
        isSuspicious = true;
        isValid = false;
      }

      if (isValid) {
        valid++;
      } else {
        invalid++;
        if (hasMissingRequired) missingRequired++;
        if (isSuspicious) suspicious++;
      }
    });

    return {
      table: tableName,
      total_records: total,
      valid_records: valid,
      invalid_records: invalid,
      missing_required_fields: missingRequired,
      suspicious_data: suspicious,
      last_check: new Date().toISOString()
    };
  };

  useEffect(() => {
    runValidation();
  }, []);

  const getStatusColor = (result: ValidationResult) => {
    const issueRate = (result.invalid_records + result.suspicious_data) / result.total_records;
    if (issueRate === 0) return "bg-green-100 text-green-800";
    if (issueRate < 0.1) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getStatusIcon = (result: ValidationResult) => {
    const hasIssues = result.invalid_records > 0 || result.suspicious_data > 0;
    return hasIssues ? 
      <XCircle className="h-4 w-4 text-red-600" /> : 
      <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Monitor de Validação de Dados</h2>
          <p className="text-muted-foreground">
            Verificação automática da qualidade e integridade dos dados
          </p>
        </div>
        
        <Button
          onClick={runValidation}
          disabled={loading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Validar Agora
        </Button>
      </div>

      {lastUpdate && (
        <div className="text-sm text-muted-foreground">
          Última verificação: {lastUpdate.toLocaleString()}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {validationResults.map((result) => (
          <Card key={result.table}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {result.table.replace('_', ' ').toUpperCase()}
                </CardTitle>
                {getStatusIcon(result)}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Total de registros:</span>
                  <span className="font-medium">{result.total_records}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Válidos:</span>
                  <span className="font-medium text-green-600">{result.valid_records}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Inválidos:</span>
                  <span className="font-medium text-red-600">{result.invalid_records}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Campos obrigatórios:</span>
                  <span className="font-medium text-orange-600">{result.missing_required_fields}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Dados suspeitos:</span>
                  <span className="font-medium text-red-600">{result.suspicious_data}</span>
                </div>
                
                <Badge className={getStatusColor(result)} variant="secondary">
                  {result.invalid_records === 0 && result.suspicious_data === 0 ? 
                    "✅ Dados válidos" : 
                    "⚠️ Requer atenção"
                  }
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumo geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Resumo da Validação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {validationResults.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {validationResults.reduce((sum, r) => sum + r.total_records, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total de registros</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {validationResults.reduce((sum, r) => sum + r.valid_records, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Registros válidos</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {validationResults.reduce((sum, r) => sum + r.invalid_records, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Registros inválidos</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {validationResults.reduce((sum, r) => sum + r.suspicious_data, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Dados suspeitos</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};