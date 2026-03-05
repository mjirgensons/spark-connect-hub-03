-- Allow sellers to upload to product-images and product-documents buckets
CREATE POLICY "Sellers can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Sellers can upload product documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Sellers can update own product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Sellers can update own product documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);