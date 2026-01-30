# Project Rules & Guidelines

## 1. CRITICAL: Database Data Preservation
**Status: MANDATORY / NON-NEGOTIABLE**

- **Rule:** Existing data in the database MUST be preserved.
- **Prohibited Actions:**
  - `prisma db push --force-reset` (unless explicitly authorized for a fresh dev setup)
  - Dropping tables manually without backup.
  - Running seed scripts that `deleteMany()` without user consent.
- **Required Behavior:**
  - Before applying schema changes, always check if the change is destructive (`prisma migrate dev` usually warns about this).
  - If a destructive change is necessary, **STOP** and ask for user permission, proposing a migration strategy (e.g., create new column -> copy data -> drop old column).
  - When writing seed scripts, use `upsert` or check for existence before creating records, rather than clearing tables first.

## 2. General Development
- Follow existing code patterns.
- Ensure type safety (no `as any` unless absolutely necessary).
