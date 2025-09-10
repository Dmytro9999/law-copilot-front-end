-- יצירת טבלאות מערכת ContractPilot ב-Supabase

-- טבלת חוזים
CREATE TABLE IF NOT EXISTS public.contracts (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    client_id TEXT,
    signing_date DATE NOT NULL,
    contract_type TEXT,
    value TEXT,
    status TEXT DEFAULT 'פעיל',
    risk_level TEXT,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת צדדים בחוזה
CREATE TABLE IF NOT EXISTS public.contract_parties (
    id BIGSERIAL PRIMARY KEY,
    contract_id BIGINT REFERENCES public.contracts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    id_number TEXT,
    role TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת התחייבויות
CREATE TABLE IF NOT EXISTS public.obligations (
    id BIGSERIAL PRIMARY KEY,
    contract_id BIGINT REFERENCES public.contracts(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'ממתין',
    priority TEXT NOT NULL,
    responsible_party TEXT NOT NULL,
    category TEXT NOT NULL,
    requires_proof BOOLEAN DEFAULT FALSE,
    amount TEXT,
    ai_generated BOOLEAN DEFAULT FALSE,
    proof_uploaded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת אסמכתאות
CREATE TABLE IF NOT EXISTS obligation_proofs (
    id BIGSERIAL PRIMARY KEY,
    obligation_id BIGINT REFERENCES public.obligations(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    uploaded_by TEXT NOT NULL CHECK (uploaded_by IN ('client', 'lawyer')),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT
);

-- טבלת לוג פעילות
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    obligation_id BIGINT REFERENCES public.obligations(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    performed_by TEXT NOT NULL,
    performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת התראות
CREATE TABLE IF NOT EXISTS notification_logs (
    id BIGSERIAL PRIMARY KEY,
    obligation_id BIGINT REFERENCES public.obligations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp', 'internal')),
    recipient TEXT NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed'))
);

-- טבלת סיכומי פגישות
CREATE TABLE IF NOT EXISTS public.meeting_summaries (
    id BIGSERIAL PRIMARY KEY,
    contract_id BIGINT REFERENCES public.contracts(id) ON DELETE CASCADE,
    meeting_date DATE NOT NULL,
    participants TEXT[] NOT NULL,
    summary TEXT NOT NULL,
    ai_insights JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת התחייבויות שנוצרו מפגישות
CREATE TABLE IF NOT EXISTS meeting_obligations (
    id BIGSERIAL PRIMARY KEY,
    meeting_id BIGINT REFERENCES public.meeting_summaries(id) ON DELETE CASCADE,
    obligation_id BIGINT REFERENCES public.obligations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_contracts_client_email ON public.contracts(client_email);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_obligations_contract_id ON public.obligations(contract_id);
CREATE INDEX IF NOT EXISTS idx_obligations_due_date ON public.obligations(due_date);
CREATE INDEX IF NOT EXISTS idx_obligations_status ON public.obligations(status);

-- פונקציה לעדכון updated_at אוטומטי
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- טריגרים לעדכון updated_at
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_obligations_updated_at BEFORE UPDATE ON public.obligations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- הרשאות RLS (Row Level Security)
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE obligation_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_obligations ENABLE ROW LEVEL SECURITY;

-- מדיניות RLS - משתמשים יכולים לראות רק את הנתונים שלהם
CREATE POLICY "Authenticated users can manage contracts" ON public.contracts
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage obligations" ON public.obligations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage contract parties" ON public.contract_parties
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage meeting summaries" ON public.meeting_summaries
    FOR ALL USING (auth.role() = 'authenticated');

-- מדיניות דומה לשאר הטבלאות
CREATE POLICY "Users can view obligation proofs" ON obligation_proofs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.obligations 
            WHERE public.obligations.id = obligation_proofs.obligation_id 
            AND public.obligations.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can view activity logs" ON activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.obligations 
            WHERE public.obligations.id = activity_logs.obligation_id 
            AND public.obligations.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can view notification logs" ON notification_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.obligations 
            WHERE public.obligations.id = notification_logs.obligation_id 
            AND public.obligations.created_by = auth.uid()
        )
    );

-- Additional policies for meeting_obligations table
CREATE POLICY "Users can view meeting obligations" ON meeting_obligations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.meeting_summaries 
            WHERE public.meeting_summaries.id = meeting_obligations.meeting_id 
            AND public.meeting_summaries.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert meeting obligations" ON meeting_obligations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.meeting_summaries 
            WHERE public.meeting_summaries.id = meeting_obligations.meeting_id 
            AND public.meeting_summaries.created_by = auth.uid()
        )
    );

-- Additional policies for contract_parties table
CREATE POLICY "Users can update contract parties" ON public.contract_parties
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.contracts 
            WHERE public.contracts.id = public.contract_parties.contract_id 
            AND public.contracts.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete contract parties" ON public.contract_parties
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.contracts 
            WHERE public.contracts.id = public.contract_parties.contract_id 
            AND public.contracts.created_by = auth.uid()
        )
    );

-- Additional policies for obligation_proofs table
CREATE POLICY "Users can insert obligation proofs" ON obligation_proofs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.obligations 
            WHERE public.obligations.id = obligation_proofs.obligation_id 
            AND public.obligations.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update obligation proofs" ON obligation_proofs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.obligations 
            WHERE public.obligations.id = obligation_proofs.obligation_id 
            AND public.obligations.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete obligation proofs" ON obligation_proofs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.obligations 
            WHERE public.obligations.id = obligation_proofs.obligation_id 
            AND public.obligations.created_by = auth.uid()
        )
    );

-- Additional policies for activity_logs table
CREATE POLICY "Users can insert activity logs" ON activity_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.obligations 
            WHERE public.obligations.id = activity_logs.obligation_id 
            AND public.obligations.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update activity logs" ON activity_logs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.obligations 
            WHERE public.obligations.id = activity_logs.obligation_id 
            AND public.obligations.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete activity logs" ON activity_logs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.obligations 
            WHERE public.obligations.id = activity_logs.obligation_id 
            AND public.obligations.created_by = auth.uid()
        )
    );
