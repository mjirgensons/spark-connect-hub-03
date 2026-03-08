
CREATE TABLE IF NOT EXISTS chatbot_missed_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id TEXT NOT NULL,
    product_id UUID REFERENCES products(id),
    page_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chatbot_missed_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert missed attempts" ON chatbot_missed_attempts FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Sellers read own missed attempts" ON chatbot_missed_attempts FOR SELECT TO authenticated USING (seller_id = auth.uid()::text);

CREATE POLICY "Admin reads all missed attempts" ON chatbot_missed_attempts FOR SELECT TO authenticated USING (is_admin());
