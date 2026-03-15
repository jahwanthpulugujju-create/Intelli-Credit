
-- User roles enum and table
CREATE TYPE public.app_role AS ENUM ('credit_analyst', 'risk_manager', 'admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile and default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'credit_analyst');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  cin TEXT,
  pan TEXT,
  sector TEXT NOT NULL,
  subsector TEXT,
  headquarters TEXT,
  annual_turnover NUMERIC DEFAULT 0,
  total_assets NUMERIC DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  ebitda NUMERIC DEFAULT 0,
  debt_levels NUMERIC DEFAULT 0,
  loan_type TEXT,
  loan_amount NUMERIC DEFAULT 0,
  loan_tenure INTEGER DEFAULT 0,
  interest_rate NUMERIC DEFAULT 0,
  purpose_of_loan TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator can update company" ON public.companies FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view documents" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can upload documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);

-- Document classifications
CREATE TABLE public.document_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  detected_type TEXT NOT NULL,
  confidence NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_type TEXT,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_classifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view classifications" ON public.document_classifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert classifications" ON public.document_classifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update classifications" ON public.document_classifications FOR UPDATE TO authenticated USING (true);

-- Financial signals
CREATE TABLE public.financial_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id),
  signal_name TEXT NOT NULL,
  signal_value NUMERIC,
  unit TEXT,
  period TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view signals" ON public.financial_signals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert signals" ON public.financial_signals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update signals" ON public.financial_signals FOR UPDATE TO authenticated USING (true);

-- Risk signals
CREATE TABLE public.risk_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  risk_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.risk_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view risk signals" ON public.risk_signals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert risk signals" ON public.risk_signals FOR INSERT TO authenticated WITH CHECK (true);

-- GST reconciliations
CREATE TABLE public.gst_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  gstr_2a NUMERIC,
  gstr_3b NUMERIC,
  gap_amount NUMERIC,
  gap_percentage NUMERIC,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gst_reconciliations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view gst" ON public.gst_reconciliations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert gst" ON public.gst_reconciliations FOR INSERT TO authenticated WITH CHECK (true);

-- Credit scores
CREATE TABLE public.credit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  character_score NUMERIC DEFAULT 0,
  capacity_score NUMERIC DEFAULT 0,
  capital_score NUMERIC DEFAULT 0,
  collateral_score NUMERIC DEFAULT 0,
  conditions_score NUMERIC DEFAULT 0,
  total_score NUMERIC DEFAULT 0,
  credit_grade TEXT,
  reasoning JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view scores" ON public.credit_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert scores" ON public.credit_scores FOR INSERT TO authenticated WITH CHECK (true);

-- Secondary research
CREATE TABLE public.secondary_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  research_type TEXT NOT NULL,
  severity TEXT,
  source TEXT,
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.secondary_research ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view research" ON public.secondary_research FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert research" ON public.secondary_research FOR INSERT TO authenticated WITH CHECK (true);

-- Reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL DEFAULT 'investment',
  content JSONB,
  recommendation TEXT,
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view reports" ON public.reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = generated_by);

-- Storage bucket for financial documents
INSERT INTO storage.buckets (id, name, public) VALUES ('financial-documents', 'financial-documents', false);

CREATE POLICY "Authenticated users can upload docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'financial-documents');
CREATE POLICY "Authenticated users can view docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'financial-documents');
