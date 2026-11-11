# Architecture

## Boundaries

apps/web is a React/Vite SPA with atomic UI and feature-level state. apps/api is a Bun/Hono modular monolith. packages/shared owns Zod contracts, original starter templates, physical geometry, pricing, and production eligibility.

## Data flow

Editor document → shared validation → persisted inquiry snapshot → CMS consultation and revised quote → customer approval → verified transfer → gated production job → approved production packet. WhatsApp only transports a reference and a read-only preview.

Physical units are millimeters; prices are integer IDR. Native furniture geometry, cut lists, real door/drawer print surfaces and estimates share the same generator. SVG artwork rendering is shared across Konva previews, Three textures and server export, with bundled Noto fonts converted to paths. Large prints are cropped/tiled without changing physical scale.

Production manifests carry derived panels, print surfaces, coordinate conventions, and tile offsets so operators can map artwork to actual parts. Drawers reserve the first column; shelves in that column use the remaining upper space and doors occupy subsequent columns.

## Persistence and runtime

MySQL stores templates, designs, rooms, inquiries, payment records, audit events and export jobs. Better Auth stores users/sessions/accounts. Assets are stored on a persistent filesystem with metadata and access checks. A Bun worker leases database jobs and creates revision-bound packets. Production serves built frontend and API on one origin.

## Security

HttpOnly authentication sessions, server-side admin checks, secure guest tokens, separate preview and private inquiry tokens, upload MIME/signature/size checks, SVG filtering, and revision validation on approval/payment/production. No offline caching of authenticated API responses or payment files.

When /me resolves a signed-in account with a valid visitor capability, a transaction claims that visitor's designs, rooms, uploads and inquiries. Quote/design revisions are archived; payment proofs remain available for explicit re-verification. Starting production and inserting its export job occur in one row-locked database transaction. The worker uses SKIP LOCKED, bounded retries and a lease for crash recovery.

## Delivery

Bun workspace and lockfile. ESLint, Prettier, strict typechecks, Bun domain/integration tests, Playwright browser tests. Docker deployment uses persistent database and upload volumes; backup both together.
