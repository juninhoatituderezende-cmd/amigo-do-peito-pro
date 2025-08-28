import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Plans queries
export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('unified-plans-loader');
      if (error) throw error;
      return data.plans || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCustomPlans() {
  return useQuery({
    queryKey: ['custom-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_plans')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Users queries
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
}

export function useUserProfile(userId?: string) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Groups queries
export function usePlanGroups() {
  return useQuery({
    queryKey: ['plan-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_groups')
        .select(`
          *,
          custom_plans (name, price, description),
          group_participants (
            id,
            user_id,
            amount_paid,
            status,
            joined_at,
            profiles (full_name, email)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000, // 30 seconds (groups change frequently)
    gcTime: 2 * 60 * 1000,
  });
}

// Payment queries
export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          profiles (full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
  });
}

// Marketplace queries
export function useMarketplaceSales() {
  return useQuery({
    queryKey: ['marketplace-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_sales')
        .select(`
          *,
          buyer:buyer_id (full_name, email),
          seller:seller_id (full_name, email),
          referrer:referrer_id (full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// Credit queries
export function useUserCredits(userId?: string) {
  return useQuery({
    queryKey: ['user-credits', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds (credits change frequently)
    gcTime: 2 * 60 * 1000,
  });
}

// Mutation hooks
export function useCreatePlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (planData: any) => {
      const { data, error } = await supabase
        .from('custom_plans')
        .insert(planData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['custom-plans'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', variables.userId] });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('custom_plans')
        .update({ active: false })
        .eq('id', planId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['custom-plans'] });
    },
  });
}