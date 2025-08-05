-- Table for tracking file uploads
CREATE TABLE IF NOT EXISTS public.file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  bucket TEXT NOT NULL,
  public_url TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own files" ON public.file_uploads
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can upload files" ON public.file_uploads
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own files" ON public.file_uploads
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own files" ON public.file_uploads
FOR DELETE
USING (user_id = auth.uid());

-- Service role can do everything
CREATE POLICY "Service role full access" ON public.file_uploads
FOR ALL
USING (true)
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON public.file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_category ON public.file_uploads(category);
CREATE INDEX IF NOT EXISTS idx_file_uploads_file_type ON public.file_uploads(file_type);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON public.file_uploads(created_at);