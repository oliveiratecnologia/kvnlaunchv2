-- Script para configurar o bucket de storage para ebooks
-- Execute este script no Supabase SQL Editor

-- Criar bucket para ebooks se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('ebooks', 'ebooks', true)
ON CONFLICT (id) DO NOTHING;

-- Configurar políticas de acesso para o bucket ebooks
-- Permitir leitura pública
CREATE POLICY "Public read access for ebooks" ON storage.objects
FOR SELECT USING (bucket_id = 'ebooks');

-- Permitir upload para usuários autenticados (opcional - ajuste conforme necessário)
CREATE POLICY "Authenticated users can upload ebooks" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'ebooks');

-- Permitir atualização para usuários autenticados (opcional)
CREATE POLICY "Authenticated users can update ebooks" ON storage.objects
FOR UPDATE USING (bucket_id = 'ebooks');

-- Permitir exclusão para usuários autenticados (opcional)
CREATE POLICY "Authenticated users can delete ebooks" ON storage.objects
FOR DELETE USING (bucket_id = 'ebooks');

-- Verificar se o bucket foi criado
SELECT * FROM storage.buckets WHERE id = 'ebooks';
