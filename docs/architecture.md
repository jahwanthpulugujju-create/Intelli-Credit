# Architecture

## Application layers

The browser client uses React Router for page navigation, TanStack Query for server-state coordination, and Supabase for authentication and database access. `src/App.tsx` defines the routes; `AuthContext` supplies the session and application roles. Shared layouts wrap authenticated workflows.

Supabase PostgreSQL stores companies, financial records, document classifications, credit analysis, and reports. SQL migrations are the schema source of truth. Generated TypeScript types live beside the Supabase client. Financial uploads use the private `financial-documents` storage bucket.

Five Deno edge functions handle document classification, financial extraction, company research, credit scoring, and investment-report generation. These functions use server-side Supabase credentials and an external AI gateway.

## Data flow

```text
Analyst → React workspace → Supabase authentication
                         → PostgreSQL and private document storage
                         → Edge function → AI gateway
                                         → Persisted analysis → Report
```

## Trust boundaries

Browser configuration is public: only the Supabase project URL and publishable key belong in Vite configuration. Service-role credentials and AI gateway credentials belong exclusively in backend secret storage.

Client route guards control navigation; database and function authorization must enforce access independently. The checked-in function configuration currently disables platform JWT verification. Existing storage policies grant authenticated users access within the document bucket. Both require review and appropriate tenant/company authorization before a confidential-data deployment.

Company research is model-generated from company context, rather than an independently verified external research feed. Analysts must verify material claims and extracted figures against source documents.
