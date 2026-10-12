# Deployment

## Backend preparation

1. Select the target Supabase project and review the SQL migrations.
2. Apply migrations, including the private financial-document bucket and access policies.
3. Configure the edge-function secrets documented in [Development](development.md).
4. Deploy the five functions in `supabase/functions/` to the same project.
5. Configure authentication redirect URLs for the deployed client origin.

Review function authorization and document-access policies before uploading confidential information. The repository's current function configuration disables platform JWT verification; a production deployment needs explicit, tested authorization at that boundary.

## Client release

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the hosting provider's build environment, then run:

```sh
npm ci
npm run build
```

Publish `dist/` to a static host. Configure SPA fallback routing to `index.html` so direct links to company and report pages resolve. Configuration changes require rebuilding the client.

## Release verification

Verify sign-in, company creation, document upload, classification review, analysis, and report export against a non-sensitive test company. Confirm that unauthorized users cannot read another company's records or documents. Check edge-function failures and missing AI credentials explicitly.

Keep deployed credentials in provider secret storage. Git ignores local environment files; deleting a file from the current tree does not erase earlier commits. Rotate any privileged credential that has been exposed.
