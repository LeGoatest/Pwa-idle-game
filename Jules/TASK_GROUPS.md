# PWA Idle Game | Agent Task Group Classification

This document defines **task groups** used by the Agent to classify user requests **before** selecting skills or executing work.

---

## 1) How Task Groups Are Used

The Agent MUST follow this sequence:
1. Classify the request into **exactly one** task group.
2. Check whether the task group allows skills.
3. If skills are allowed: consult `SKILLS_INDEX.md` and activate a matching skill if available.
4. If skills are not allowed: rely on canonical documents only.
5. If classification is ambiguous: STOP and ask for clarification.

---

## 2) Defined Task Groups

### 2.1 architecture
**Use when the request involves:**
- changing system structure
- redefining invariants
- altering authority or trust boundaries
- introducing new architectural patterns

**Skills allowed:** NO
**Behavior:** Rely exclusively on canonical documents. Refuse if request violates rules.

### 2.2 development
**Use when the request involves:**
- implementing features within existing architecture
- fixing bugs
- refactoring code for compliance
- adding tests

**Skills allowed:** YES

### 2.3 operations
**Use when the request involves:**
- build systems
- deployment configurations
- environment setup
- dependency management

**Skills allowed:** YES

### 2.4 docs
**Use when the request involves:**
- writing or updating documentation
- clarifying behavior
- procedural planning (Spec Mode)

**Skills allowed:** YES

### 2.5 audit
**Use when the request involves:**
- checking for architectural or security compliance
- scanning for drift or violations
- verifying invariants across the system

**Skills allowed:** YES
