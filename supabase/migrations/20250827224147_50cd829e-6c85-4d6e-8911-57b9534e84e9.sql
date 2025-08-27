-- Verificar se admin pode gerenciar todos os planos
-- Remover a restrição de professional_id para admins

-- Atualizar política para permitir que admins gerenciem todos os planos
DROP POLICY IF EXISTS "Professionals can manage own plans" ON custom_plans;
DROP POLICY IF EXISTS "Service role can manage all plans" ON custom_plans;
DROP POLICY IF EXISTS "Anyone can view active plans" ON custom_plans;

-- Nova política para admins poderem gerenciar TODOS os planos
CREATE POLICY "Admins can manage all plans" ON custom_plans
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Profissionais podem gerenciar apenas seus próprios planos  
CREATE POLICY "Professionals can manage own plans" ON custom_plans
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.id = custom_plans.professional_id
    AND profiles.role = 'professional'
  )
);

-- Service role pode gerenciar tudo
CREATE POLICY "Service role can manage all plans" ON custom_plans
FOR ALL USING (auth.role() = 'service_role');

-- Visualização pública de planos ativos
CREATE POLICY "Anyone can view active plans" ON custom_plans
FOR SELECT USING (active = true);

-- Limpar professional_id de planos criados por admins (para torná-los gerenciáveis)
UPDATE custom_plans 
SET professional_id = NULL 
WHERE professional_id IS NOT NULL 
AND id IN (
  SELECT cp.id FROM custom_plans cp
  LEFT JOIN profiles p ON p.id = cp.professional_id
  WHERE p.role != 'professional' OR p.role IS NULL
);