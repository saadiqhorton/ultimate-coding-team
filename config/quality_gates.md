# Quality Gates Configuration

This document defines all quality gates that must pass for the workflow to proceed.

## Gate Overview

| Gate | Owner | Threshold | Max Loops | Escalation |
|------|-------|-----------|-----------|------------|
| Planning | Code Architect | >= 85/100 | 1 | Return to Planner |
| Architecture | Implementation Agent | >= 90/100 | 1 | Return to Architect |
| Code Quality | Code Reviewer | >= 85/100 | 3 | Human Review |
| Testing | Testing Agent | 100% pass, 80% coverage | 3 | Human Review |
| Documentation | Orchestrator | >= 80/100 | 1 | Return to Docs |
| Final | Retrospective Agent | >= 90/100 | 1 | Human Review |

---

## Gate 1: Planning Gate

**Owner:** Code Architect reviews Project Planner output

### Pass Criteria
| Criterion | Weight | Threshold |
|-----------|--------|-----------|
| All requirements covered | 25% | 100% |
| Tasks are atomic and testable | 25% | Yes |
| Dependencies correctly mapped | 20% | Yes |
| Research documented | 15% | Yes |
| No ambiguous descriptions | 15% | Yes |

### Score Required
- **Minimum:** 85/100
- **Target:** 95/100

### Failure Action
- Return to Project Planner with specific feedback
- Planner revises and resubmits
- No loop limit (should pass on revision)

---

## Gate 2: Architecture Gate

**Owner:** Implementation Agent validates Code Architect output

### Pass Criteria
| Criterion | Weight | Threshold |
|-----------|--------|-----------|
| Architecture is implementable | 25% | Yes |
| Tech stack is justified | 20% | Yes |
| Security patterns defined | 20% | Yes |
| Directory structure specified | 15% | Yes |
| ADRs created for decisions | 10% | Yes |
| Scalability considered | 10% | Yes |

### Score Required
- **Minimum:** 90/100
- **Target:** 95/100

### Failure Action
- Return to Code Architect with specific concerns
- Architect revises and resubmits
- No loop limit (should pass on revision)

---

## Gate 3: Code Quality Gate

**Owner:** Code Reviewer

### Pass Criteria

#### Automated Checks
| Check | Threshold |
|-------|-----------|
| TypeScript/lint errors | 0 |
| TypeScript/lint warnings | < 10 |
| Formatting issues | 0 |

#### Manual Review
| Criterion | Weight | Threshold |
|-----------|--------|-----------|
| Functionality correct | 25% | Yes |
| Code quality (readability, DRY) | 25% | High |
| No security vulnerabilities | 20% | Zero critical/high |
| Follows coding standards | 15% | Yes |
| Inline documentation | 15% | Adequate |

#### Complexity Limits
| Metric | Maximum |
|--------|---------|
| Cyclomatic complexity | 20 per function |
| Function length | 50 lines |
| File length | 300 lines |
| Nesting depth | 3 levels |

### Score Required
- **Minimum:** 85/100
- **Target:** 90/100

### Self-Correction Loop
- **Max Iterations:** 3
- **Increment:** `loop_counts.reviewer_implementation`

### Failure Actions
| Iteration | Action |
|-----------|--------|
| 1 | Return to Implementation with detailed feedback |
| 2 | Return to Implementation with prioritized issues |
| 3 | Return to Implementation with must-fix only |
| 4+ | Escalate to human review |

---

## Gate 4: Testing Gate

**Owner:** Testing Agent

### Pass Criteria

#### Test Results
| Metric | Threshold |
|--------|-----------|
| Test pass rate | 100% |
| Flaky tests | 0 |
| Skipped tests | 0 (unless justified) |

#### Coverage
| Metric | Minimum | Target |
|--------|---------|--------|
| Statement coverage | 80% | 90% |
| Branch coverage | 75% | 85% |
| Function coverage | 80% | 90% |
| Line coverage | 80% | 90% |

#### Test Quality
| Criterion | Requirement |
|-----------|-------------|
| AAA pattern followed | Yes |
| Edge cases covered | Yes |
| Error cases tested | Yes |
| Assertions meaningful | Yes |

### Score Required
- **Minimum:** All tests pass + 80% coverage
- **Target:** All tests pass + 90% coverage

### Self-Correction Loop
- **Max Iterations:** 3
- **Increment:** `loop_counts.testing_implementation`

### Failure Actions
| Iteration | Action |
|-----------|--------|
| 1 | Return to Implementation with failing test details |
| 2 | Return to Implementation with coverage gaps |
| 3 | Return to Implementation with critical issues only |
| 4+ | Escalate to human review |

---

## Gate 5: Documentation Gate

**Owner:** System Orchestrator validates Documentation Agent output

### Pass Criteria
| Criterion | Weight | Threshold |
|-----------|--------|-----------|
| README exists and complete | 25% | Yes |
| Feature docs for all features | 25% | Yes |
| API docs (if applicable) | 20% | Yes |
| Simple language (Flesch >= 60) | 20% | Yes |
| No TODOs or placeholders | 10% | Zero |

### Score Required
- **Minimum:** 80/100
- **Target:** 90/100

### Failure Action
- Return to Documentation Agent with specific feedback
- Agent revises and resubmits
- No loop limit (should pass on revision)

---

## Gate 6: Final Gate

**Owner:** Retrospective Agent

### Pass Criteria
| Criterion | Weight | Threshold |
|-----------|--------|-----------|
| All previous gates passed | 30% | Yes |
| No pending issues | 20% | Zero |
| Knowledge base updated | 20% | Yes |
| Metrics recorded | 15% | Yes |
| Clean workflow completion | 15% | Yes |

### Overall Score Calculation
| Stage | Weight |
|-------|--------|
| Planning | 10% |
| Architecture | 15% |
| Implementation | 25% |
| Code Review | 20% |
| Testing | 15% |
| Documentation | 10% |
| Git Operations | 5% |

### Score Required
- **Minimum:** 90/100
- **Target:** 95/100

### Failure Action
- Create human review request
- Wait for human decision

---

## Escalation Criteria

### Automatic Escalation
- Max loops (3) exceeded in Code Quality or Testing gates
- Confidence score < 0.7 in any agent decision
- Security vulnerability detected
- Critical bug that can't be resolved

### Human Review Required
- Architecture decisions (major structural changes)
- Security-related code changes
- Database schema changes
- API breaking changes
- External service integrations

### Escalation File Location
`/tasks/review/REVIEW_REQUIRED_[timestamp].md`

---

## Quality Score Reference

| Score Range | Rating | Action |
|-------------|--------|--------|
| 95-100 | Excellent | Proceed immediately |
| 90-94 | Good | Proceed with notes |
| 85-89 | Acceptable | Proceed (minimum threshold) |
| 75-84 | Needs Work | Return for revision |
| 60-74 | Poor | Return with detailed feedback |
| Below 60 | Failing | Escalate to human |

---

## Configuration Options

These thresholds can be adjusted per-project:

```json
{
  "quality_gates": {
    "planning": { "threshold": 85 },
    "architecture": { "threshold": 90 },
    "code_quality": { "threshold": 85, "max_loops": 3 },
    "testing": {
      "pass_rate": 100,
      "coverage": 80,
      "max_loops": 3
    },
    "documentation": { "threshold": 80 },
    "final": { "threshold": 90 }
  }
}
```
