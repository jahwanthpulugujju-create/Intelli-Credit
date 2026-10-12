# Development

## Prerequisites

- Node.js 22.13 or later and npm.
- A Supabase project with the repository migrations applied.
- An AI gateway credential for workflows that call the edge functions.

Install dependencies with `npm ci`. Keep `package-lock.json` committed whenever dependencies change.

## Client configuration

Provide `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` through your development shell or an ignored local configuration file. No environment files are distributed in this repository.

For example, in PowerShell:

```powershell
$env:VITE_SUPABASE_URL = "https://YOUR_PROJECT.supabase.co"
$env:VITE_SUPABASE_PUBLISHABLE_KEY = "YOUR_PUBLISHABLE_KEY"
npm run dev
```

Vite embeds variables prefixed with `VITE_` in the browser bundle. Never use that prefix for a backend secret.

## Backend configuration

The edge functions read `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `LOVABLE_API_KEY`. Configure backend values using Supabase secret management. The existing `supabase/config.toml` identifies the original project; associate the checkout with your intended project before applying migrations or deploying functions.

## Validation

```sh
npm run check
npm run lint
npm test
npm run build
```

Vitest covers document selection limits and error-message handling. These unit tests run without backend credentials. Authenticated integration verification requires a configured Supabase project and analysis services. Client validation improves selection feedback; the storage and backend layers must independently enforce file-content and access restrictions.
