# Intelli-Credit

Credit intelligence software that brings company onboarding, financial-document analysis, risk signals, and underwriting reports into one analyst workspace.

## Product workflow

1. Create a company profile and record the financing request.
2. Upload financial documents and review their classification.
3. Extract financial data, review risk indicators, and run company analysis.
4. Generate an underwriting report for analyst review and export.

The application combines a React and TypeScript client with Supabase authentication, PostgreSQL, private document storage, and server-side analysis functions. AI-generated findings require analyst verification before use in a lending decision.

## Repository structure

- `src/pages/` — company, document, analysis, reporting, and administration workflows.
- `src/components/` — application layouts, credit visualizations, document review, and UI primitives.
- `src/contexts/`, `src/hooks/`, `src/lib/` — authentication state and shared client utilities.
- `src/integrations/supabase/` — typed database client and generated schema types.
- `supabase/functions/` — document classification, extraction, research, scoring, and report generation.
- `supabase/migrations/` — database schema, access policies, and storage setup.
- `docs/` — architecture, development, and deployment guidance.

## Local development

Use Node.js 22 or later and npm. Configure the Supabase connection as described in [Development](docs/development.md), then run:

```sh
npm ci
npm run dev
```

The development server runs at `http://localhost:8080`. npm and `package-lock.json` are the dependency source of truth.

## Engineering documentation

- [Architecture](docs/architecture.md) — components, data flow, and trust boundaries.
- [Development](docs/development.md) — prerequisites, configuration, and validation commands.
- [Deployment](docs/deployment.md) — client hosting, backend setup, and release checks.

## Current boundaries

This repository implements an underwriting application; it does not establish regulatory compliance or validate model accuracy. The analysis functions use an external AI gateway. Function authorization and document-access policies require a deployment-specific security review before processing confidential financial data.
