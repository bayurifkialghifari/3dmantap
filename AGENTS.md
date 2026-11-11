# Repository instructions

- Use Bun for dependencies, scripts, API runtime, and domain tests. Keep all application code and automation in strict TypeScript.
- Frontend follows atomic design: atoms, molecules, organisms, templates, pages. Keep domain logic, hooks, and stores outside presentational UI.
- Backend is a modular Hono application. Routes validate shared contracts, services enforce business rules, repositories handle persistence.
- Physical geometry and artwork use millimeters. Money uses integer Indonesian Rupiah. Never calculate production eligibility only in the frontend.
- Avatar measurements use millimeters and weight grams. Keep raw profiles owner/CMS scoped; public design, room and WhatsApp previews must project rendering recipes and strip nested private profiles.
- Fit sourced body and compatible garments with the same bind rig. Worn artwork uses UVs so it follows skinning; preserve standing stature and test posed grounding independently of parent scene transforms.
- Submission must persist in CMS before offering WhatsApp consultation. WhatsApp navigation never proves consultation or approval.
- Freeze approved design/quote revisions. Production requires matching customer approval, admin confirmation, and verified required payment.
- Validate uploads, keep proofs/production files private, and scope designs/inquiries to account or secure visitor/access tokens.
- Update PRD.md, CHANGELOG.md, architecture.md and relevant docs when behavior changes. Feature documents describe actual behavior and limitations.
- Use atomic Conventional Commits: one coherent change including its contracts, relevant tests, and documentation. Do not commit secrets, generated database files, or artifacts.
- Product preview geometry comes from sourced GLBs. Record model source, license, modifications and SHA-256 integrity; use models:prepare and models:previews when updating bundled runtime assets. Keep private API assets outside PWA caching.
- Public documentation screenshots/demo media may be committed when captured with synthetic data. Keep source credits and exclude customer records, credentials, uploads and payment proofs.
- Before delivery run lint, format:check, typecheck, test, test:e2e, and build. Add meaningful tests for geometry, permissions, approval gates, and exports.
