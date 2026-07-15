
CREATE POLICY "bonsai read" ON storage.objects FOR SELECT USING (bucket_id = 'bonsai');
CREATE POLICY "bonsai insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'bonsai');
CREATE POLICY "bonsai update" ON storage.objects FOR UPDATE USING (bucket_id = 'bonsai') WITH CHECK (bucket_id = 'bonsai');
CREATE POLICY "bonsai delete" ON storage.objects FOR DELETE USING (bucket_id = 'bonsai');
