# Contributing to 3DMantap

Bug reports, documentation improvements and focused pull requests are welcome. The application UI is Indonesian; issues and pull requests may use Indonesian or English.

## Development

Follow the local setup in [README](README.md), then read [AGENTS.md](AGENTS.md) and [architecture.md](architecture.md). Use Bun and strict TypeScript. Keep UI components in the atomic layers, domain state in features/shared, and business rules in Hono services.

Create a branch for a focused change. Use Conventional Commits, with each commit including its related contracts, implementation, meaningful tests and documentation. Run the quality commands in README before opening a pull request. Backend tests require the configured MySQL database; browser tests use the local API and seeded admin account.

## Product invariants

- Physical geometry/artwork uses millimeters; money uses integer IDR.
- Persist submissions before offering WhatsApp consultation. Opening WhatsApp does not prove approval.
- Production requires the current approved revision, admin confirmation and verified payment. Preserve server-side ownership and production checks.
- Record source, license and hashes for bundled models; retain third-party credits.
- Keep credentials, databases, customer uploads, payment proofs and test traces out of commits.

Describe the problem, resulting behavior and validation in the pull request. Include screenshots for visible UI changes. Update PRD, changelog, architecture and the relevant feature document when behavior changes.

## Community

Be respectful and specific. Discuss the work without personal attacks, harassment or sharing private information. Maintainers may remove abusive content and close contributions that break these expectations.

For suspected security issues, follow [SECURITY.md](SECURITY.md).
