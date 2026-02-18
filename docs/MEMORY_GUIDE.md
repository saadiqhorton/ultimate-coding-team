# Memory Guide

This document explains how to use the knowledge base system effectively.

---

## Overview

The Ultimate AI Coding Team has a memory system designed to help the team learn from every project. This system improves over time as more projects are completed.

---

## Knowledge Base

The knowledge base contains 4 files, each serving a different purpose.

### Files and Their Purposes

| File | When to Read | When to Update |
|------|--------------|----------------|
| `lessons_learned.md` | Before starting any project | After project completes |
| `common_mistakes.md` | Before writing code | After fixing bugs |
| `coding_standards.md` | Before writing code | When standards change |
| `performance_tips.md` | Before designing systems | After optimizing |

### How Knowledge Base Works

1. **Before a project starts:**
   - Implementation Agent reads relevant knowledge base files
   - This provides context on what has worked/didn't work before

2. **During a project:**
   - Code Reviewer checks common_mistakes.md to avoid known pitfalls
   - Code Architect checks performance_tips.md for optimization patterns

3. **After a project completes:**
   - Retrospective Agent reads the workflow state
   - Retrospective Agent adds new lessons to lessons_learned.md
   - Retrospective Agent adds new mistakes to common_mistakes.md
   - Retrospective Agent updates coding standards if new patterns emerged

### Reading Order (Important)

When starting work, read knowledge base files in this order:

1. **lessons_learned.md** — "What has worked before?"
2. **common_mistakes.md** — "What should I avoid?"
3. **coding_standards.md** — "What are the rules?"
4. **performance_tips.md** — "How do I make it fast?"

---

## Architectural Decisions (ADRs)

For architectural decisions, use ADRs (Architecture Decision Records) instead:

- **Location:** `docs/architecture/ADR-XXX.md`
- **Template:** `docs/templates/adr-template.md`
- **When to write:** When making technology choices, architecture patterns, or significant design decisions

### What Goes in ADRs

- **Technology choices:** "Why we chose PostgreSQL over MongoDB"
- **Architecture patterns:** "Why we use modular monolith"
- **Tool selections:** "Why we chose Jest over Mocha"
- **Infrastructure decisions:** "Why we use AWS RDS"

### What Goes in Knowledge Base

- **Lessons learned** → lessons_learned.md
- **Mistakes to avoid** → common_mistakes.md
- **Coding rules** → coding_standards.md
- **Optimizations** → performance_tips.md

---

## Human Review Process

### Weekly Review (Recommended)

Once a week, a human should:

1. Read new entries in lessons_learned.md
2. Check for duplicate or conflicting information
3. Consolidate similar entries
4. Archive entries that are no longer relevant

2. **Check for conflicts:**
   - If two entries contradict each other, decide which is correct
   - Update or merge entries as needed

3. **Consolidate:**
   - If multiple entries say similar things, merge them into one
   - Keep the most detailed version

4. **Archive:**
   - If an entry is outdated, mark it as archived
   - Don't delete — future agents may need to know the history

---

## How to Write Good Entries

### Lessons Learned Entry

**Do:**
- Be specific about what happened
- Explain the consequence
- Include how future projects benefit

**Don't:**
- Be vague ("it didn't work")
- Blame individuals
- Include unnecessary details

**Example:**
```markdown
## 2026-01-15 - REST API Project

### What We Learned
- **Breaking tasks into atomic units**: Success rate 40% higher than monolithic tasks
- **Self-correction before submission**: Reduced review cycles by 2x
```

### Common Mistake Entry

**Do:**
- Show before/after code
- Explain why it's a problem
- Provide the correct solution

**Don't:**
- Just say "don't do X"
- Include unrelated code
- Be overly long

**Example:**
```markdown
### Missing Error Handling

**What Happens:** Unhandled promise rejections crash the process
**Why It's Bad:** Silent failures, hard to debug
**How to Avoid:** Always wrap async in try/catch
```

---

## Common Mistakes to Avoid

### 1. Not Reading Before Starting

**Mistake:** Starting work without checking knowledge base.

**Impact:** Repeating mistakes that are already documented.

**Fix:** Always read relevant files before starting a new project.

### 2. Not Updating After Projects

**Mistake:** Completing a project without adding lessons.

**Impact:** Knowledge base becomes stale and useless.

**Fix:** Retrospective Agent should update automatically. If not, add entries manually.

### 3. Confusing ADRs with Lessons

**Mistake:** Putting architectural decisions in lessons_learned.md

**Impact:** Hard to find decisions when planning new projects.

**Fix:** Use ADRs for architectural decisions, lessons_learned.md for outcomes.

### 4. Writing Vague Entries

**Mistake:** "It didn't work" or "Use TypeScript"

**Impact:** Entries provide no actionable guidance.

**Fix:** Be specific. Explain what, why, and how.

---

## Automation

The Retrospective Agent automatically updates knowledge base files after each project completes. However, human review ensures quality.

### What Retrospective Agent Does

1. Reads workflow state and quality scores
2. Identifies what worked well / didn't work
3. Adds entries to appropriate files
4. Generates project retrospective

### What Humans Should Do

1. Weekly: Review new entries for quality
2. Monthly: Consolidate and archive old entries
3. As needed: Add manual entries for significant events

---

## File Locations

| File | Location | Updated By |
|------|----------|------------|
| Lessons Learned | `data/knowledge_base/lessons_learned.md` | Retrospective Agent |
| Common Mistakes | `data/knowledge_base/common_mistakes.md` | Retrospective Agent |
| Coding Standards | `data/knowledge_base/coding_standards.md` | Retrospective Agent + Humans |
| Performance Tips | `data/knowledge_base/performance_tips.md` | Retrospective Agent |
| ADRs | `docs/architecture/ADR-XXX.md` | Code Architect |

---

## Quick Reference

### Before Starting a Project
1. Read lessons_learned.md
2. Read common_mistakes.md
3. Check coding_standards.md
4. Check performance_tips.md
5. Review relevant ADRs in docs/architecture/

### After Completing a Project
1. Retrospective Agent auto-updates knowledge base
2. Human reviews new entries weekly
3. Human consolidates duplicates monthly

### When Making Architectural Decisions
1. Create new ADR in docs/architecture/
2. Use ADR template from docs/templates/adr-template.md
3. Include context, decision, rationale, alternatives

---

*This guide is maintained by humans. Update as the process evolves.*
