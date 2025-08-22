import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type HistoryType = 'compras' | 'creditos' | 'grupos' | 'comissoes' | 'all';
export type SortField = 'date' | 'amount' | 'type' | 'status';
export type SortOrder = 'asc' | 'desc';

export interface HistoryItem {
  id: string;
  type: HistoryType;
  title: string;
  description: string;
  amount?: number;
  status: string;
  date: string;
  metadata?: any;
}

interface UseUserHistoryReturn {
  items: HistoryItem[];
  loading: boolean;
  error: string | null;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  selectedType: HistoryType;
  sortField: SortField;
  sortOrder: SortOrder;
  dateRange: { start: Date | null; end: Date | null };
  minAmount: number;
  maxAmount: number;
  monthlyData: Array<{ month: string; total: number; count: number }>;
  setSelectedType: (type: HistoryType) => void;
  setSortField: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  setDateRange: (range: { start: Date | null; end: Date | null }) => void;
  setAmountRange: (min: number, max: number) => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  refresh: () => Promise<void>;
  exportToPDF: () => void;
  exportToCSV: () => void;
  clearFilters: () => void;
}

const MOCK_HISTORY_ITEMS: HistoryItem[] = [
  {
    id: '1',
    type: 'compras',
    title: 'Procedimento Estético Premium',
    description: 'Tratamento facial completo - Dr. Silva',
    amount: 450.00,
    status: 'concluido',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { professional: 'Dr. Silva', location: 'São Paulo' }
  },
  {
    id: '2',
    type: 'creditos',
    title: 'Crédito Adicionado',
    description: 'Pagamento via PIX confirmado',
    amount: 200.00,
    status: 'confirmado',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { paymentMethod: 'PIX', transactionId: 'TX123456' }
  },
  {
    id: '3',
    type: 'grupos',
    title: 'Grupo "Harmonização Facial"',
    description: 'Participação contemplada - 3ª posição',
    amount: 800.00,
    status: 'contemplado',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { position: 3, totalMembers: 10, groupId: 'G001' }
  },
  {
    id: '4',
    type: 'comissoes',
    title: 'Comissão por Indicação',
    description: 'João Silva se cadastrou usando seu link',
    amount: 25.00,
    status: 'pago',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { referredName: 'João Silva', level: 1 }
  },
  {
    id: '5',
    type: 'compras',
    title: 'Consulta Dermatológica',
    description: 'Avaliação inicial - Dra. Santos',
    amount: 120.00,
    status: 'agendado',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { professional: 'Dra. Santos', scheduledFor: '2024-02-15' }
  },
  {
    id: '6',
    type: 'grupos',
    title: 'Grupo "Botox Premium"',
    description: 'Aguardando contemplação - 8º na fila',
    amount: 600.00,
    status: 'aguardando',
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { position: 8, totalMembers: 12, groupId: 'G002' }
  },
  {
    id: '7',
    type: 'creditos',
    title: 'Débito por Compra',
    description: 'Pagamento do procedimento',
    amount: -450.00,
    status: 'processado',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { relatedPurchase: '1' }
  }
];

export const useUserHistory = (): UseUserHistoryReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedType, setSelectedType] = useState<HistoryType>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [minAmount, setMinAmount] = useState(0);
  const [maxAmount, setMaxAmount] = useState(10000);

  // Load mock data on component mount
  useEffect(() => {
    if (user) {
      setItems(MOCK_HISTORY_ITEMS);
    }
  }, [user]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter(item => {
      // Type filter
      if (selectedType !== 'all' && item.type !== selectedType) return false;
      
      // Date range filter
      if (dateRange.start && new Date(item.date) < dateRange.start) return false;
      if (dateRange.end && new Date(item.date) > dateRange.end) return false;
      
      // Amount filter
      const amount = Math.abs(item.amount || 0);
      if (amount < minAmount || amount > maxAmount) return false;
      
      return true;
    });

    // Sort items
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case 'date':
          aVal = new Date(a.date).getTime();
          bVal = new Date(b.date).getTime();
          break;
        case 'amount':
          aVal = Math.abs(a.amount || 0);
          bVal = Math.abs(b.amount || 0);
          break;
        case 'type':
          aVal = a.type;
          bVal = b.type;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [items, selectedType, sortField, sortOrder, dateRange, minAmount, maxAmount]);

  // Pagination
  const totalItems = filteredAndSortedItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredAndSortedItems.slice(startIndex, startIndex + itemsPerPage);

  // Monthly data for charts
  const monthlyData = useMemo(() => {
    const monthlyStats = new Map();
    
    items.forEach(item => {
      if (item.amount) {
        const month = format(new Date(item.date), 'MMM yyyy', { locale: ptBR });
        const current = monthlyStats.get(month) || { total: 0, count: 0 };
        monthlyStats.set(month, {
          total: current.total + Math.abs(item.amount),
          count: current.count + 1
        });
      }
    });

    return Array.from(monthlyStats.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6); // Last 6 months
  }, [items]);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, fetch from Supabase
      // For now, just simulate refresh
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (user) {
        setItems(MOCK_HISTORY_ITEMS);
      }
    } catch (err) {
      setError('Erro ao carregar histórico');
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    try {
      // This would be implemented with jsPDF
      toast({
        title: "Export realizado",
        description: "Relatório PDF foi gerado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro no export",
        description: "Não foi possível gerar o PDF.",
        variant: "destructive"
      });
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ['Data', 'Tipo', 'Descrição', 'Valor', 'Status'];
      const csvData = filteredAndSortedItems.map(item => [
        format(new Date(item.date), 'dd/MM/yyyy'),
        item.type,
        item.description,
        item.amount ? `R$ ${item.amount.toFixed(2)}` : '-',
        item.status
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `historico-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();

      toast({
        title: "Export realizado",
        description: "Arquivo CSV foi baixado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro no export",
        description: "Não foi possível gerar o CSV.",
        variant: "destructive"
      });
    }
  };

  const clearFilters = () => {
    setSelectedType('all');
    setDateRange({ start: null, end: null });
    setMinAmount(0);
    setMaxAmount(10000);
    setSortField('date');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Set amount range helper
  const setAmountRange = (min: number, max: number) => {
    setMinAmount(min);
    setMaxAmount(max);
  };

  return {
    items: paginatedItems,
    loading,
    error,
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage,
    selectedType,
    sortField,
    sortOrder,
    dateRange,
    minAmount,
    maxAmount,
    monthlyData,
    setSelectedType,
    setSortField,
    setSortOrder,
    setDateRange,
    setAmountRange,
    setCurrentPage,
    setItemsPerPage,
    refresh,
    exportToPDF,
    exportToCSV,
    clearFilters
  };
};