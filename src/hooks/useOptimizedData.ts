import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// Cache global para dados reutilizáveis
const globalCache = new Map<string, CacheEntry<any>>();

// Hook otimizado para carregar dados com cache
export const useOptimizedData = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number; // Cache TTL em ms (padrão: 5 minutos)
    immediate?: boolean; // Carregar imediatamente (padrão: true)
    refetchOnMount?: boolean; // Recarregar ao montar (padrão: false)
  } = {}
) => {
  const {
    ttl = 5 * 60 * 1000, // 5 minutos
    immediate = true,
    refetchOnMount = false
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  // Verificar cache
  const getCachedData = useCallback(() => {
    const cached = globalCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    return null;
  }, [key]);

  // Salvar no cache
  const setCachedData = useCallback((newData: T) => {
    globalCache.set(key, {
      data: newData,
      timestamp: Date.now(),
      ttl
    });
  }, [key, ttl]);

  // Função para buscar dados
  const fetchData = useCallback(async (force = false) => {
    // Verificar cache primeiro se não for forçado
    if (!force) {
      const cached = getCachedData();
      if (cached) {
        setData(cached);
        return cached;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result);
        setCachedData(result);
      }
      return result;
    } catch (err) {
      const error = err as Error;
      if (mountedRef.current) {
        setError(error);
        console.error(`Error fetching data for key "${key}":`, error);
      }
      throw error;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [key, fetcher, getCachedData, setCachedData]);

  // Carregar dados iniciais
  useEffect(() => {
    if (immediate || refetchOnMount) {
      const cached = getCachedData();
      if (cached && !refetchOnMount) {
        setData(cached);
      } else {
        fetchData();
      }
    }

    return () => {
      mountedRef.current = false;
    };
  }, [immediate, refetchOnMount, fetchData, getCachedData]);

  // Função para invalidar cache
  const invalidateCache = useCallback(() => {
    globalCache.delete(key);
  }, [key]);

  // Função para refetch
  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidateCache,
    fetchData: () => fetchData(false)
  };
};

// Hook específico para dados de marketplace
export const useMarketplaceProducts = () => {
  return useOptimizedData(
    'marketplace-products',
    async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(service => ({
        id: service.id,
        title: service.name,
        description: service.description || '',
        full_price: Number(service.price),
        down_payment: Number(service.price) * 0.1, // 10% down payment
        category: service.category || 'General',
        professional_name: 'Profissional',
        professional_id: service.professional_id,
        professional_avatar: null,
        image_url: service.image_url,
        external_link: null,
        visibility: 'both' as 'client' | 'professional' | 'both',
        is_active: service.active,
        created_at: service.created_at,
        total_sales: 0, // Placeholder
        rating: 4.5 // Placeholder - implementar sistema de avaliações depois
      }));
    },
    { ttl: 2 * 60 * 1000 } // Cache por 2 minutos
  );
};

// Hook específico para estatísticas de admin
export const useAdminStats = () => {
  return useOptimizedData(
    'admin-stats',
    async () => {
      // Buscar estatísticas reais
      const [profilesResult, productsResult, creditsResult] = await Promise.all([
        supabase.from('profiles').select('count', { count: 'exact', head: true }),
        supabase.from('products').select('count', { count: 'exact', head: true }),
        supabase.from('user_credits').select('count', { count: 'exact', head: true })
      ]);

      return {
        totalParticipants: profilesResult.count || 0,
        totalProfessionals: profilesResult.count || 0,
        totalProducts: productsResult.count || 0,
        activeGroups: 12, // Mock data
        monthlyRevenue: 45000,
        contemplatedThisMonth: 8
      };
    },
    { ttl: 10 * 60 * 1000 } // Cache por 10 minutos
  );
};

// Limpar cache expirado periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of globalCache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      globalCache.delete(key);
    }
  }
}, 60000); // Verificar a cada minuto