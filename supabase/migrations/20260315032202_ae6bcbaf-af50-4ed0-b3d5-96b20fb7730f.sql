CREATE TABLE public.extraction_schemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  schema_name text NOT NULL DEFAULT 'Default Schema'
);

CREATE TABLE public.extraction_schema_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id uuid REFERENCES public.extraction_schemas(id) ON DELETE CASCADE NOT NULL,
  field_name text NOT NULL,
  field_type text NOT NULL DEFAULT 'number',
  source_document text NOT NULL DEFAULT 'Annual Report',
  is_required boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.extraction_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extraction_schema_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view schemas" ON public.extraction_schemas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert schemas" ON public.extraction_schemas FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator can update schemas" ON public.extraction_schemas FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Creator can delete schemas" ON public.extraction_schemas FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can view schema fields" ON public.extraction_schema_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert schema fields" ON public.extraction_schema_fields FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update schema fields" ON public.extraction_schema_fields FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete schema fields" ON public.extraction_schema_fields FOR DELETE TO authenticated USING (true);