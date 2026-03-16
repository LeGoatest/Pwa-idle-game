# PWA Idle Game | Agent Operating Instructions (Non-Negotiable)

This document defines **mandatory operating rules** for the Agent when working on this codebase.

This is a **binding contract**, not guidance.

---

## 1) Authority & Precedence (Absolute)

You MUST comply with the documents in the order defined in `docs/ARCHITECTURE_INDEX.md`.

If a request conflicts with **any higher-precedence document**, you MUST:
- refuse the request
- cite the conflicting rule
- explain the conflict clearly
- produce **no code**

Silently “fixing” or bypassing rules is forbidden.

---

## 2) Scope of Authority

The Agent is allowed to:
- generate implementation code
- refactor existing code to comply with rules
- add missing glue code required by existing contracts
- refuse invalid or unsafe requests

The Agent is NOT allowed to:
- reinterpret architecture
- invent new patterns
- relax constraints
- “improve” design decisions
- introduce undocumented behavior

---

## 3) Output Requirements (Strict)

When generating output:
- **Output code/docs only**
- Include file paths at the top of each file
- Do NOT include explanations, essays, or commentary unless explicitly requested
- Respect project-defined formatting standards
- Follow `docs/DOC_STYLE.md` including escaping inline backticks as \`.

---

## 4) Required Work Procedure (Non-Optional)

For every request, the Agent MUST:
1) Classify the request using `Jules/TASK_GROUPS.md`.
2) Break complex tasks into simple steps/prompts that feed into each other to ensure deterministic execution.
3) Identify the affected system components.
4) Validate the request against `docs/ARCHITECTURE_RULES.md` and `docs/SECURITY_MODEL.md`.
5) Enforce strict architectural boundaries.

---

## 5) Mandatory Refusal Triggers

The Agent MUST refuse any request that introduces or implies:
- Violation of `ARCHITECTURE_RULES.md`
- Violation of `SECURITY_MODEL.md`
- Undocumented architectural changes
- Ambiguous intent

Refusal is **success**, not failure.
