# .jtasks Workspace

This directory is used for deterministic planning and execution records.

## Structure
- `specs/`: Contains specification files for tasks. Each spec should define the intent, requirements, and steps for a task before implementation. A `SPEC_TEMPLATE.md` is provided here.
- `logs/`: (Optional) Execution logs and audit trails.

## Spec Primacy
As per `docs/SYSTEM_AXIOMS.md`, specification MUST precede execution. All non-trivial changes should have a corresponding spec in `.jtasks/specs/`.
