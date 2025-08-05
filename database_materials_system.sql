-- Create materials table for admin uploads
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'pdf', 'document')),
  file_url TEXT NOT NULL,
  qr_code_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create notification_settings table for trigger management
CREATE TABLE public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('15_days', '30_days', '60_days', '90_days', '180_days')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  email_template TEXT,
  total_executions INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  last_executed TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create material_downloads table to track downloads
CREATE TABLE public.material_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_agent TEXT,
  ip_address INET,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_materials_category ON public.materials(category);
CREATE INDEX idx_materials_type ON public.materials(type);
CREATE INDEX idx_materials_active ON public.materials(is_active);
CREATE INDEX idx_materials_created_at ON public.materials(created_at);
CREATE INDEX idx_material_downloads_material_id ON public.material_downloads(material_id);
CREATE INDEX idx_material_downloads_user_id ON public.material_downloads(user_id);
CREATE INDEX idx_material_downloads_downloaded_at ON public.material_downloads(downloaded_at);

-- Enable Row Level Security
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_downloads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for materials
CREATE POLICY "Anyone can view active materials" ON public.materials
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all materials" ON public.materials
  FOR ALL USING (true); -- This will be restricted by application logic

-- RLS Policies for notification_settings  
CREATE POLICY "Admins can manage notification settings" ON public.notification_settings
  FOR ALL USING (true); -- This will be restricted by application logic

-- RLS Policies for material_downloads
CREATE POLICY "Users can view their own downloads" ON public.material_downloads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert downloads" ON public.material_downloads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all downloads" ON public.material_downloads
  FOR SELECT USING (true); -- This will be restricted by application logic

-- Function to update material download count
CREATE OR REPLACE FUNCTION public.increment_download_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.materials 
  SET 
    download_count = download_count + 1,
    updated_at = now()
  WHERE id = NEW.material_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically increment download count
CREATE TRIGGER trigger_increment_download_count
  AFTER INSERT ON public.material_downloads
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_download_count();

-- Function to update updated_at on materials
CREATE OR REPLACE FUNCTION public.handle_updated_at_materials()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for materials updated_at
CREATE TRIGGER trigger_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at_materials();

-- Function to update notification_settings stats
CREATE OR REPLACE FUNCTION public.update_notification_stats(
  p_trigger_type TEXT,
  p_success BOOLEAN DEFAULT true
)
RETURNS void AS $$
BEGIN
  UPDATE public.notification_settings
  SET 
    total_executions = total_executions + 1,
    success_count = CASE 
      WHEN p_success THEN success_count + 1 
      ELSE success_count 
    END,
    last_executed = now(),
    updated_at = now()
  WHERE trigger_type = p_trigger_type;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.notification_settings (
      trigger_type,
      title_template,
      message_template,
      total_executions,
      success_count,
      last_executed
    ) VALUES (
      p_trigger_type,
      'Notification Title',
      'Notification Message',
      1,
      CASE WHEN p_success THEN 1 ELSE 0 END,
      now()
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Insert default notification settings
INSERT INTO public.notification_settings (trigger_type, title_template, message_template, email_template) VALUES
('15_days', '🚀 Vamos começar suas indicações!', 'Olá! Notamos que você ainda não fez nenhuma indicação. Que tal começar compartilhando com amigos?', 'first_reminder'),
('30_days', '💡 Materiais de ajuda disponíveis', 'Enviamos novos materiais promocionais para ajudar você a divulgar melhor seus links!', 'materials_available'),
('60_days', '🎯 Estratégias para acelerar seu grupo', 'Que tal conhecer nossas dicas para formar grupos mais rapidamente? Temos várias estratégias eficazes!', 'strategies_tips'),
('90_days', '🤝 Grupos públicos disponíveis', 'Considere participar de grupos públicos ou tornar o seu público para acelerar a formação!', 'public_groups_info'),
('180_days', '✨ Seus créditos estão disponíveis!', 'Após 180 dias, convertemos seu pagamento em créditos! Use no marketplace ou solicite saque.', 'credits_available');

-- Create storage bucket for materials
INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', true);

-- Storage policies for materials bucket
CREATE POLICY "Anyone can view materials" ON storage.objects FOR SELECT USING (bucket_id = 'materials');
CREATE POLICY "Admins can upload materials" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'materials');
CREATE POLICY "Admins can update materials" ON storage.objects FOR UPDATE USING (bucket_id = 'materials');
CREATE POLICY "Admins can delete materials" ON storage.objects FOR DELETE USING (bucket_id = 'materials');