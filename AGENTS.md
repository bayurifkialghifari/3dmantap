# Repository instructions

- Use Bun for dependencies, scripts, API runtime, and domain tests. Keep all application code and automation in strict TypeScript.
- Frontend follows atomic design: atoms, molecules, organisms, templates, pages. Keep domain logic, hooks, and stores outside presentational UI.
- Backend is a modular Hono application. Routes validate shared contracts, services enforce business rules, repositories handle persistence.
- Physical geometry and artwork use millimeters. Money uses integer Indonesian Rupiah. Never calculate production eligibility only in the frontend.
- Submission must persist in CMS before offering WhatsApp consultation. WhatsApp navigation never proves consultation or approval.
- Freeze approved design/quote revisions. Production requires matching customer approval, admin confirmation, and verified required payment.
- Validate uploads, keep proofs/production files private, and scope designs/inquiries to account or secure visitor/access tokens.
- Update PRD.md, CHANGELOG.md, architecture.md and relevant docs when behavior changes. Feature documents describe actual behavior and limitations.
- Use atomic Conventional Commits: one coherent change including its contracts, relevant tests, and documentation. Do not commit secrets, generated database files, or artifacts.
- Product preview geometry comes from sourced GLBs. Record model source, license, modifications and SHA-256 integrity; use models:prepare and models:previews when updating bundled runtime assets. Keep private API assets outside PWA caching.
- Before delivery run lint, format:check, typecheck, test, test:e2e, and build. Add meaningful tests for geometry, permissions, approval gates, and exports.
