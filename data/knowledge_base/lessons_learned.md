# Lessons Learned

This file contains lessons learned from completed projects. All agents should read this before starting work to benefit from past experiences.

---

## How to Use This File

1. **Before starting work:** Read relevant sections for your task
2. **After completing work:** The Retrospective Agent will add new lessons
3. **When facing a challenge:** Search this file for similar situations

---

## Examples (Read These First)

### Example 1: Implementation Lesson

**Date:** 2026-01-15 - REST API Project

**What We Learned**
- **Breaking complex tasks into atomic sub-tasks**: We broke the API into 5 small tasks. Success rate was 40% higher than when we tried to do "build auth" as one task.
- **Self-correction before submission**: Having the Implementation Agent re-read its own code before marking done reduced review循环 by 2x.

**Key Decisions That Worked**
- **Sequential task dependencies**: Required each task to declare what it depended on. Caught 3 integration issues early.

**Key Decisions to Reconsider**
- None this project.

---

### Example 2: Process Lesson

**Date:** 2026-01-20 - CLI Tool Project

**What We Learned**
- **Skipping architecture phase causes rework**: We started coding without ADRs. Made database choice at implementation time that required refactoring 3 modules.
- **Code Review Agent needs specific feedback**: Generic "this could be better" comments led to back-and-forth. Specific "line 42, change X to Y" feedback resolved faster.

**Key Decisions That Worked**
- **Daily standups (simulated via workflow state)**: Kept all agents aligned on progress.

**Key Decisions to Reconsider**
- **Did not require tests first**: Wrote tests after implementation. Should have done TDD for the core validation logic.

---

### Example 3: Testing Lesson

**Date:** 2026-02-01 - Web App Project

**What We Learned**
- **Generic test descriptions are hard to debug**: "test_user_auth" didn't tell us WHAT failed. Changed to "test_user_auth_rejects_invalid_password" - immediately clear what broke.
- **Edge cases are often forgotten**: Null inputs, empty arrays, boundary conditions. Added checklist to Testing Agent prompt.

**Key Decisions That Worked**
- **Required 80% minimum coverage**: Forced us to test error paths, not just happy path.

**Key Decisions to Reconsider**
- **Skipped integration tests initially**: Caught session bugs late. Should have added at least smoke tests early.

---

## Template for New Entries

Copy the format above when adding new lessons. Place new entries below these examples.

```markdown
## [Date] - [Project Name]

### What We Learned
- [Lesson 1]: [Explanation and how it helps future projects]
- [Lesson 2]: [Explanation and how it helps future projects]

### Key Decisions That Worked
- [Decision]: [Why it was good]

### Key Decisions to Reconsider
- [Decision]: [What could be better]
```

---

## Categories

### Architecture Lessons
<!-- Lessons about system design, tech choices, patterns -->

### Implementation Lessons
<!-- Lessons about writing code, common pitfalls, best practices -->

### Testing Lessons
<!-- Lessons about test strategies, coverage, debugging -->

### Documentation Lessons
<!-- Lessons about writing clear documentation, simple language -->

### Process Lessons
<!-- Lessons about workflow, coordination, communication -->

---

*This file is automatically updated by the Retrospective Agent after each project completion.*
