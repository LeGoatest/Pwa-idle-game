# VERSION LOCKING

## 1. Governance Versioning
- The version of the governance model is tracked in the project root (e.g., `package.json` or a dedicated `VERSION` file).
- Breaking changes to the governance model must increment the major version.

## 2. Dependency Locking
- NPM dependencies are locked via `package-lock.json` (if present).
- External scripts (like htmx) should ideally be pinned to a specific version.
