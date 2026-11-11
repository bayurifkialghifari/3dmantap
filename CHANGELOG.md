# Changelog

## 0.3.0 — 2026-11-11

### Added

- Wall-linked doors with gap snapping, canonical wall alignment and linked duplication/deletion in 2D and 3D.
- Direct 3D furniture dragging, with orbit disabled during drag and shared 5 cm snapping.
- Clothed 170 cm reference human, draggable in both room views, adjustable height and SVG/JSON export.
- Worn previews for built-in shirts, hoodies, jackets and pants, including custom colors/artwork; CC0 avatar provenance, integrity hashes and offline precache.
- Domain, ownership/save and browser coverage for room placement and worn previews.

### Fixed

- Sneaker orientation and nonuniform stretching; regenerated catalog thumbnail from the corrected GLB.
- Consistent 2D/3D rotations and attached door poses when walls/opening dimensions change.

### Limits

- Worn previews use a static compatible source pose and do not simulate fit or support arbitrary uploaded GLBs. Room placement validates object centers and opening gaps; furniture collision detection is not included.

## 0.2.0 — 2026-11-11

### Changed

- Rebuilt the storefront around product renders, Inter typography, neutral colors, simpler navigation and responsive Fashion/Interior catalogs.
- Replaced procedural product geometry with sourced local GLBs. Furniture uses extracted board/door components with original UV/PBR maps and physical panel dimensions.
- Added model provenance, public asset credits, source integrity hashes, reproducible TypeScript preparation/capture scripts and GLB validation tests.
- Optimized the shoe to a 1K beach variant; neutralized hat color and removed the tee source logo. Starter hat/duffel names now match their models.
- Fixed quantized mesh artwork projection, product preview clipping, material disposal and shadow artifacts; model loading appears outside Canvas.
- Added camera-dependent room wall cutaway and precaching for public GLBs, WebP previews and WOFF2 fonts.

### Limits

- Fashion uses the source rest pose; the duffel is a low-poly asset. Furniture is assembled from sourced components. Preview materials and print areas require production consultation.
- Dribbble access was unavailable during this redesign; no specific Dribbble design is claimed as reviewed or copied.

## 0.1.0 — 2026-11-11

### Added

- Bun/TypeScript workspace, ESLint 10, Prettier, strict typechecks, migrations, seed, CI, and Docker deployment configuration.
- Original 3DMantap identity, responsive atomic UI, Fashion/Interior catalogs, and interactive previews for 13 starter templates.
- Fashion customization, parametric interior editor, physical artwork layers, shared outlined-font rendering, autosave, undo/redo, and library/sharing.
- Room planner with polygon rooms, walls/partitions, doors/windows, furniture placement, measurements, 2D/3D, sharing, and PNG/SVG/JSON exports.
- Better Auth accounts, secure guest access, and migration of device-owned drafts/assets when signing in.
- Persisted CMS submissions before WhatsApp consultation, archived revisions, final quote approval, private transfer proofs, and server-side production/payment gates.
- CMS templates, customers, consultations, progress photos, statuses, audit log, and configurable business/bank settings.
- Revision-bound production packets, physical-scale 300-DPI artwork/PDF, tiled large prints, furniture cut lists, and persistent export jobs.
- Panel-aware furniture artwork, separate drawer/door columns, shelf clearance validation, and panel IDs/coordinates in production manifests and assembly drawings.
- PWA manifest/install icons, static caching, offline local drafts/public template cache, and update notification.
- PRD, README, architecture, AGENTS, and individual documentation for all 19 features.

### Defaults

- Initial templates and prices require business validation. WhatsApp and bank details are configured in CMS.
- Manual transfer and consultation-first fulfillment. No AI/payment gateway in this release.
