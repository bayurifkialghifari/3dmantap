# Security policy

Security fixes target the latest main branch. This project is under active development; there are no separately maintained release branches yet.

Please use the repository's private vulnerability reporting under the Security tab to report a suspected vulnerability. Include reproduction steps, the affected revision and the impact. Do not post credentials, customer data, payment proofs or exploit details in a public issue.

If private reporting is temporarily unavailable, open a public issue asking for a private contact method without disclosing vulnerability details. Response times are not guaranteed.

Use environment-specific secrets, HTTPS and persistent storage for deployments. Keep the database and upload backups together. Existing server-side revision, ownership and payment gates must remain enabled; see [architecture.md](architecture.md) and [upload security](docs/uploads-security.md).
