
-- Create the public bucket for menu images
INSERT INTO storage.buckets (id, name, public)
VALUES ('cardapio-imagens', 'cardapio-imagens', true);

-- Allow anyone to view files (public bucket)
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'cardapio-imagens');

-- Allow anyone to upload files (MVP, no auth)
CREATE POLICY "Public upload access" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'cardapio-imagens');

-- Allow anyone to update files
CREATE POLICY "Public update access" ON storage.objects
  FOR UPDATE TO public
  USING (bucket_id = 'cardapio-imagens');

-- Allow anyone to delete files
CREATE POLICY "Public delete access" ON storage.objects
  FOR DELETE TO public
  USING (bucket_id = 'cardapio-imagens');
