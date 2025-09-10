-- יצירת טבלאות מערכת LAWCOPILOT ב-Supabase (גרסה מתוקנת)

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
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
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
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת אסמכתאות
CREATE TABLE IF NOT EXISTS public.obligation_proofs (
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
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id BIGSERIAL PRIMARY KEY,
    obligation_id BIGINT REFERENCES public.obligations(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    performed_by TEXT NOT NULL,
    performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת התראות
CREATE TABLE IF NOT EXISTS public.notification_logs (
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
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת התחייבויות שנוצרו מפגישות
CREATE TABLE IF NOT EXISTS public.meeting_obligations (
    id BIGSERIAL PRIMARY KEY,
    meeting_id BIGINT REFERENCES public.meeting_summaries(id) ON DELETE CASCADE,
    obligation_id BIGINT REFERENCES public.obligations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_contracts_client_email ON public.contracts(client_email);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON public.contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_obligations_contract_id ON public.obligations(contract_id);
CREATE INDEX IF NOT EXISTS idx_obligations_due_date ON public.obligations(due_date);
CREATE INDEX IF NOT EXISTS idx_obligations_status ON public.obligations(status);
CREATE INDEX IF NOT EXISTS idx_obligations_created_by ON public.obligations(created_by);

-- פונקציה לעדכון updated_at אוטומטי
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- טריגרים לעדכון updated_at
DROP TRIGGER IF EXISTS update_contracts_updated_at ON public.contracts;
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_obligations_updated_at ON public.obligations;
CREATE TRIGGER update_obligations_updated_at BEFORE UPDATE ON public.obligations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- הרשאות RLS (Row Level Security)
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obligation_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_obligations ENABLE ROW LEVEL SECURITY;

-- מדיניות RLS - משתמשים יכולים לראות רק את הנתונים שלהם
CREATE POLICY "Users can manage their own contracts" ON public.contracts
    FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Users can manage their own obligations" ON public.obligations
    FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Users can manage contract parties for their contracts" ON public.contract_parties
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.contracts 
            WHERE public.contracts.id = public.contract_parties.contract_id 
            AND public.contracts.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own meeting summaries" ON public.meeting_summaries
    FOR ALL USING (created_by = auth.uid());

-- מדיניות לטבלאות נוספות
CREATE POLICY "Users can view obligation proofs for their obligations" ON public.obligation_proofs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.obligations 
            WHERE public.obligations.id = public.obligation_proofs.obligation_id 
            AND public.obligations.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert obligation proofs for their obligations" ON public.obligation_proofs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.obligations 
            WHERE public.obligations.id = public.obligation_proofs.obligation_id 
            AND public.obligations.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can view activity logs for their obligations" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.obligations 
            WHERE public.obligations.id = public.activity_logs.obligation_id 
            AND public.obligations.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert activity logs for their obligations" ON public.activity_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.obligations 
            WHERE public.obligations.id = public.activity_logs.obligation_id 
            AND public.obligations.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can view notification logs for their obligations" ON public.notification_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.obligations 
            WHERE public.obligations.id = public.notification_logs.obligation_id 
            AND public.obligations.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can manage meeting obligations for their meetings" ON public.meeting_obligations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.meeting_summaries 
            WHERE public.meeting_summaries.id = public.meeting_obligations.meeting_id 
            AND public.meeting_summaries.created_by = auth.uid()
        )
    );

-- הרשאות לטבלאות
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- הוספת נתוני דמו (אופציונלי)
-- INSERT INTO public.contracts (name, client_name, client_email, signing_date, contract_type, status)
-- VALUES 
--   ('חוזה שירותי ייעוץ משפטי', 'חברת טכנולוגיה בע"מ', 'info@techcompany.co.il', '2024-01-15', 'שירותים', 'פעיל'),
--   ('חוזה אספקת ציוד משרדי', 'משרד רואי חשבון', 'office@cpa.co.il', '2024-02-01', 'אספקה', 'פעיל');

COMMIT;
