# Development

## Prerequisites

- Node.js 22 or later and npm.
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
npm run build
npm run lint
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.node.json --noEmit
```

Vitest is configured for future client tests, but no client test suite is currently checked in. `npm test` reports that no test files exist; it is not evidence of passing application tests. Integration verification requires a configured Supabase project and analysis services.
