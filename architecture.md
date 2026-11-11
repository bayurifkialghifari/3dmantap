# Architecture

## Boundaries

apps/web is a React/Vite SPA with atomic UI and feature-level state. apps/api is a Bun/Hono modular monolith. packages/shared owns Zod contracts, original starter templates, physical geometry, pricing, and production eligibility.

## Data flow

Editor document → shared validation → persisted inquiry snapshot → CMS consultation and revised quote → customer approval → verified transfer → gated production job → approved production packet. WhatsApp only transports a reference and a read-only preview.

Physical units are millimeters; prices are integer IDR. Furniture panel dimensions, cut lists, real door/drawer print surfaces and estimates share the same generator. The viewer instantiates sourced GLB board/door components at those panel dimensions. Fashion/accessory viewers load local GLBs or a template-uploaded model and preserve original UV/PBR maps. Skeletons are cloned per instance; material clones are disposed without modifying cached source meshes. SVG artwork rendering is shared across Konva previews, Three textures and server export, with bundled Noto fonts converted to paths. Quantized mesh attributes are converted to Float32 on the projection copy. Large prints are cropped/tiled without changing physical scale.

Production manifests carry derived panels, print surfaces, coordinate conventions, and tile offsets so operators can map artwork to actual parts. Drawers reserve the first column; shelves in that column use the remaining upper space and doors occupy subsequent columns.

## Persistence and runtime

MySQL stores templates, designs, rooms, inquiries, payment records, audit events and export jobs. Better Auth stores users/sessions/accounts. Assets are stored on a persistent filesystem with metadata and access checks. A Bun worker leases database jobs and creates revision-bound packets. Production serves built frontend and API on one origin.

## Security

HttpOnly authentication sessions, server-side admin checks, secure guest tokens, separate preview and private inquiry tokens, upload MIME/signature/size checks, SVG filtering, and revision validation on approval/payment/production. No offline caching of authenticated API responses or payment files.

When /me resolves a signed-in account with a valid visitor capability, a transaction claims that visitor's designs, rooms, uploads and inquiries. Quote/design revisions are archived; payment proofs remain available for explicit re-verification. Starting production and inserting its export job occur in one row-locked database transaction. The worker uses SKIP LOCKED, bounded retries and a lease for crash recovery.

## Delivery

Asset processing uses glTF Transform and Sharp in TypeScript scripts. Sources are pinned/hash-locked, and bundled output hashes are checked in domain tests. WebP previews are captured from the application viewer with Playwright. Model credits are shipped publicly. PWA precaches public GLBs, previews and local fonts; private API assets stay outside cache. Room walls use a camera-facing cutaway while physical floorplan data remains unchanged.

Bun workspace and lockfile. ESLint, Prettier, strict typechecks, Bun domain/integration tests, Playwright browser tests. Docker deployment uses persistent database and upload volumes; backup both together.
