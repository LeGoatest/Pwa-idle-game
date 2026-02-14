# PWA Idle Game | Architectural Index (Precedence & Governance)

This document defines the **canonical order of precedence** for all documentation in this project.
It is the secondary authority for resolving conflicts, as defined in `Jules/JULES.md`.

---

## 1) Absolute Precedence List

In the event of a conflict between documents, the document appearing **higher in this list** always wins. Agents MUST refuse any request that violates a higher-precedence rule.

1. [ARCHITECTURE_RULES.md](./ARCHITECTURE_RULES.md)
2. [SYSTEM_AXIOMS.md](./SYSTEM_AXIOMS.md)
3. [SECURITY_MODEL.md](./SECURITY_MODEL.md)
4. [INVARIANT_MODEL.md](./INVARIANT_MODEL.md)
5. [CONTRACT_MODEL.md](./CONTRACT_MODEL.md)
6. [ARCHITECTURE_INDEX.md](./ARCHITECTURE_INDEX.md)
7. [MUTATION_PROCESS.md](./MUTATION_PROCESS.md)
8. [VERSION_LOCKING.md](./VERSION_LOCKING.md)
9. [DECISIONS.md](./DECISIONS.md)
10. [TERMINOLOGY.md](./TERMINOLOGY.md)
11. [DOC_STYLE.md](./DOC_STYLE.md)
12. [ENFORCEMENT_MATRIX.md](./ENFORCEMENT_MATRIX.md)
13. [JULES.md](../Jules/JULES.md)
14. [TASK_GROUPS.md](../Jules/TASK_GROUPS.md)
15. [SKILLS_INDEX.md](../Jules/SKILLS_INDEX.md)
16. [SKILL.md files](../Jules/skills/)
17. [Spec files (in .jtasks)](../.jtasks/)

---

## 2) Summary

If a rule in a lower-precedence document contradicts a higher one, the lower rule is **void**.
The Agent MUST refuse any request that violates this hierarchy.
The agent must STOP if design judgment is required but not specified in canon.
