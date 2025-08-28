import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  FileText,
  Package,
  Briefcase,
  DollarSign,
  Receipt
} from "lucide-react";

interface TransacaoContabil {
  id: string;
  valor: number;
  tipo_transacao: string; // Mudado para string genérica
  status: string;
  iss_percentual: number;
  icms_percentual: number;
  pis_cofins_percentual: number;
  valor_impostos: number;
  valor_liquido: number;
  municipio_iss: string;
  regime_tributario: string;
  created_at: string;
  observacoes: string;
}

interface ResumoImpostos {
  total_servicos: number;
  total_produtos: number;
  total_iss: number;
  total_icms: number;
  total_pis_cofins: number;
  total_impostos: number;
  total_liquido: number;
  total_bruto: number;
}

export const RelatoriosContabeis = () => {
  const [transacoes, setTransacoes] = useState<TransacaoContabil[]>([]);
  const [resumo, setResumo] = useState<ResumoImpostos | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'servico' | 'produto'>('todos');
  const [filtroMes, setFiltroMes] = useState<string>(new Date().toISOString().slice(0, 7));
  const { toast } = useToast();

  useEffect(() => {
    carregarDados();
  }, [filtroTipo, filtroMes]);

  const carregarDados = async () => {
    try {
      setLoading(true);

      // Buscar transações
      let query = supabase
        .from('transacoes')
        .select('*')
        .gte('created_at', `${filtroMes}-01`)
        .lt('created_at', `${new Date(filtroMes + '-01').getFullYear()}-${String(new Date(filtroMes + '-01').getMonth() + 2).padStart(2, '0')}-01`)
        .order('created_at', { ascending: false });

      if (filtroTipo !== 'todos') {
        query = query.eq('tipo_transacao', filtroTipo);
      }

      const { data: transacoesData, error: transacoesError } = await query;

      if (transacoesError) {
        throw transacoesError;
      }

      setTransacoes(transacoesData || []);

      // Calcular resumo
      const resumoCalculado = calcularResumo(transacoesData || []);
      setResumo(resumoCalculado);

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados contábeis.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularResumo = (transacoes: TransacaoContabil[]): ResumoImpostos => {
    const servicos = transacoes.filter(t => t.tipo_transacao === 'servico');
    const produtos = transacoes.filter(t => t.tipo_transacao === 'produto');

    const total_servicos = servicos.reduce((sum, t) => sum + t.valor, 0);
    const total_produtos = produtos.reduce((sum, t) => sum + t.valor, 0);
    const total_bruto = total_servicos + total_produtos;

    const total_iss = servicos.reduce((sum, t) => sum + (t.valor * (t.iss_percentual || 0) / 100), 0);
    const total_icms = produtos.reduce((sum, t) => sum + (t.valor * (t.icms_percentual || 0) / 100), 0);
    const total_pis_cofins = produtos.reduce((sum, t) => sum + (t.valor * (t.pis_cofins_percentual || 0) / 100), 0);

    const total_impostos = total_iss + total_icms + total_pis_cofins;
    const total_liquido = total_bruto - total_impostos;

    return {
      total_servicos,
      total_produtos,
      total_iss,
      total_icms,
      total_pis_cofins,
      total_impostos,
      total_liquido,
      total_bruto
    };
  };

  const exportarRelatorio = () => {
    if (!resumo || transacoes.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há dados para exportar.",
        variant: "destructive",
      });
      return;
    }

    // Preparar dados para CSV
    const csvHeader = [
      'Data',
      'Tipo',
      'Valor Bruto',
      'ISS %',
      'ICMS %',
      'PIS/COFINS %',
      'Total Impostos',
      'Valor Líquido',
      'Status',
      'Município',
      'Observações'
    ].join(',');

    const csvRows = transacoes.map(t => [
      new Date(t.created_at).toLocaleDateString('pt-BR'),
      t.tipo_transacao,
      t.valor.toFixed(2),
      (t.iss_percentual || 0).toFixed(2),
      (t.icms_percentual || 0).toFixed(2),
      (t.pis_cofins_percentual || 0).toFixed(2),
      t.valor_impostos.toFixed(2),
      t.valor_liquido.toFixed(2),
      t.status,
      t.municipio_iss || '',
      t.observacoes || ''
    ].join(','));

    const csvContent = [csvHeader, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-contabil-${filtroMes}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Relatório exportado com sucesso!",
    });
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Relatórios Contábeis</h2>
          <p className="text-muted-foreground">
            Controle tributário e fiscal separado por tipo de transação
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="month"
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <Button onClick={exportarRelatorio} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Resumo Geral */}
      {resumo && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bruto</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarMoeda(resumo.total_bruto)}</div>
              <p className="text-xs text-muted-foreground">
                Receita total antes dos impostos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Impostos</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatarMoeda(resumo.total_impostos)}</div>
              <p className="text-xs text-muted-foreground">
                ISS + ICMS + PIS/COFINS
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Líquido</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatarMoeda(resumo.total_liquido)}</div>
              <p className="text-xs text-muted-foreground">
                Receita após impostos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Carga Tributária</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {resumo.total_bruto > 0 ? ((resumo.total_impostos / resumo.total_bruto) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Percentual de impostos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detalhamento por Tipo */}
      <Tabs value={filtroTipo} onValueChange={(value) => setFiltroTipo(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="servico">Serviços</TabsTrigger>
          <TabsTrigger value="produto">Produtos</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Serviços
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Bruto:</span>
                    <span className="font-bold">{formatarMoeda(resumo?.total_servicos || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ISS a Recolher:</span>
                    <span className="font-bold text-red-600">{formatarMoeda(resumo?.total_iss || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tributação:</span>
                    <Badge variant="secondary">ISS Municipal</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Produtos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Bruto:</span>
                    <span className="font-bold">{formatarMoeda(resumo?.total_produtos || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ICMS:</span>
                    <span className="font-bold text-red-600">{formatarMoeda(resumo?.total_icms || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PIS/COFINS:</span>
                    <span className="font-bold text-red-600">{formatarMoeda(resumo?.total_pis_cofins || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tributação:</span>
                    <Badge variant="secondary">ICMS + Federal</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="servico">
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento - Serviços (ISS)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor Bruto</TableHead>
                    <TableHead>ISS %</TableHead>
                    <TableHead>ISS Valor</TableHead>
                    <TableHead>Valor Líquido</TableHead>
                    <TableHead>Município</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transacoes
                    .filter(t => t.tipo_transacao === 'servico')
                    .map((transacao) => (
                    <TableRow key={transacao.id}>
                      <TableCell>
                        {new Date(transacao.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{formatarMoeda(transacao.valor)}</TableCell>
                      <TableCell>{(transacao.iss_percentual || 0).toFixed(1)}%</TableCell>
                      <TableCell className="text-red-600">
                        {formatarMoeda(transacao.valor * (transacao.iss_percentual || 0) / 100)}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {formatarMoeda(transacao.valor_liquido)}
                      </TableCell>
                      <TableCell>{transacao.municipio_iss || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={transacao.status === 'pago' ? 'default' : 'secondary'}>
                          {transacao.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="produto">
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento - Produtos (ICMS + PIS/COFINS)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor Bruto</TableHead>
                    <TableHead>ICMS %</TableHead>
                    <TableHead>PIS/COFINS %</TableHead>
                    <TableHead>Total Impostos</TableHead>
                    <TableHead>Valor Líquido</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transacoes
                    .filter(t => t.tipo_transacao === 'produto')
                    .map((transacao) => (
                    <TableRow key={transacao.id}>
                      <TableCell>
                        {new Date(transacao.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{formatarMoeda(transacao.valor)}</TableCell>
                      <TableCell>{(transacao.icms_percentual || 0).toFixed(1)}%</TableCell>
                      <TableCell>{(transacao.pis_cofins_percentual || 0).toFixed(1)}%</TableCell>
                      <TableCell className="text-red-600">
                        {formatarMoeda(transacao.valor_impostos)}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {formatarMoeda(transacao.valor_liquido)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={transacao.status === 'pago' ? 'default' : 'secondary'}>
                          {transacao.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};