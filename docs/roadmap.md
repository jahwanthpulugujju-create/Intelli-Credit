# Contribution roadmap

This is a direction for discussion, not a delivery schedule. Propose a focused issue before implementing a large change.

## Strengthen the analysis boundary

- Add tenant/company authorization to edge-function entry points and storage policies, with integration tests for cross-company access.
- Validate AI response schemas before persisting extracted figures or research findings.
- Track source provenance and analyst corrections so reports can be traced back to documents.

## Make integrations portable

- Introduce an AI provider interface so deployments can select an OpenAI-compatible gateway without modifying each function.
- Provide a reproducible local Supabase setup and synthetic financial-document fixtures.
- Document model evaluation criteria for extraction accuracy and research reliability.

## Improve contributor feedback

- Add integration coverage for upload, classification review, and report generation.
- Improve accessibility and small-screen layouts in analyst workflows.
- Add end-to-end tests with isolated authentication and database fixtures.

Good first contributions include documentation examples, focused validation cases, and accessible labels. Pick a concrete workflow and explain how the change will be verified.
