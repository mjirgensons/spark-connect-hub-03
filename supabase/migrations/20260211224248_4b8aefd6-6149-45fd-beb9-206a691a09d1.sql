
-- Create storage bucket for product documents (PDFs, etc.)
INSERT INTO storage.buckets (id, name, public) VALUES ('product-documents', 'product-documents', true);

-- Allow anyone to download product documents
CREATE POLICY "Product documents are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-documents');

-- Allow authenticated users to upload documents
CREATE POLICY "Authenticated users can upload product documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-documents');

-- Allow authenticated users to update documents
CREATE POLICY "Authenticated users can update product documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-documents');

-- Allow authenticated users to delete documents
CREATE POLICY "Authenticated users can delete product documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-documents');
