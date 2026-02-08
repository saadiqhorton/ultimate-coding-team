# Routing Table

This document defines how requests are routed to appropriate agents or workflows.

## Smart Detection Routing

### Full Workflow (All 10 Agents)

Route to full workflow when request matches ANY of these patterns:

| Pattern | Example | Why Full Workflow |
|---------|---------|-------------------|
| New feature | "Build a REST API" | Multi-file, architecture needed |
| Multi-file change | "Refactor auth system" | Multiple components affected |
| Architecture change | "Switch to microservices" | Major structural impact |
| API development | "Create user endpoints" | Interface contracts, tests, docs |
| Database changes | "Add user table" | Schema, migrations, validation |
| Security changes | "Add authentication" | Critical, needs review |
| Test additions | "Add integration tests" | Requires understanding code |
| Bug fix (complex) | "Fix race condition in cache" | Root cause analysis needed |

### Keywords Triggering Full Workflow
```
build, create, implement, develop, refactor, redesign, migrate,
architect, add feature, new feature, api, endpoint, database,
schema, authentication, authorization, security, integration,
comprehensive, complete, full, production
```

### Simple Mode (Skip Orchestrator)

Route directly to appropriate single agent when:

| Pattern | Example | Route To |
|---------|---------|----------|
| Single typo | "Fix typo in README" | Direct edit |
| Single rename | "Rename foo to bar" | Direct edit |
| Add comment | "Add comment explaining X" | Direct edit |
| Config tweak | "Change port to 3001" | Direct edit |
| Read/explain | "What does this function do?" | Direct read |
| Git status | "Show git status" | Git Agent only |
| Doc-only update | "Update README install steps" | Documentation Agent only |

### Keywords for Simple Mode
```
typo, rename, comment, tweak, explain, what is, how does,
show, status, minor, small, quick, single
```

## Request Analysis Algorithm

```
1. Parse request for keywords
2. Check file scope:
   - Single file → Likely simple
   - Multiple files → Likely complex
3. Check change type:
   - Addition (new files) → Complex
   - Modification (existing) → Depends on scope
   - Deletion → Depends on scope
4. Check domain:
   - Security → Always complex
   - Database → Always complex
   - API → Usually complex
5. Calculate complexity score:
   - Score >= 50 → Full workflow
   - Score < 50 → Simple mode
```

## Complexity Scoring

| Factor | Score |
|--------|-------|
| New feature mentioned | +40 |
| Multiple files affected | +30 |
| Architecture keywords | +30 |
| Security/auth keywords | +30 |
| Database keywords | +25 |
| API keywords | +20 |
| Testing needed | +15 |
| Refactoring | +15 |
| Bug fix (simple) | +10 |
| Single file change | +5 |
| Documentation only | +5 |
| Config change | +5 |
| Typo fix | +0 |

**Threshold:** 50 points → Full workflow

## Agent-Specific Routing

### Direct to Project Planner
- "Plan out..."
- "Break down..."
- "What tasks for..."

### Direct to Code Architect
- "Design architecture for..."
- "What tech stack..."
- "How should I structure..."

### Direct to Implementation Agent
- "Write code for..." (if architecture exists)
- "Implement..." (if plan exists)

### Direct to Code Reviewer
- "Review this code..."
- "Check for bugs in..."
- "Security audit..."

### Direct to Testing Agent
- "Write tests for..."
- "Test coverage for..."
- "Run tests..."

### Direct to Documentation Agent
- "Document..."
- "Write README for..."
- "Explain how to use..."

### Direct to Git Agent
- "Commit..."
- "Create branch..."
- "Push..."
- "Pull request..."

### Direct to Cleanup Agent
- "Clean up..."
- "Archive..."
- "Organize..."

### Direct to Retrospective Agent
- "What did we learn..."
- "Update knowledge base..."
- "Retrospective..."

## Routing Precedence

1. **Explicit agent request** - User names specific agent
2. **Workflow continuation** - Active workflow takes precedence
3. **Smart detection** - Analyze request complexity
4. **Default** - Full workflow for ambiguous cases

## Error Routing

| Error Type | Route To |
|------------|----------|
| Quality gate failure | Previous agent (for revision) |
| Max loops exceeded | Human review |
| Unknown request | Ask for clarification |
| Permission denied | Human review |
| Tool failure | Retry or escalate |

## Context Preservation

When routing between agents:

1. Pass workflow ID
2. Pass project name
3. Reference relevant files
4. Include previous agent output
5. Note quality scores

## Routing Decision Log

Each routing decision should log:

```json
{
  "timestamp": "ISO timestamp",
  "request": "original request",
  "complexity_score": 65,
  "factors": [
    { "factor": "new feature", "score": 40 },
    { "factor": "api keywords", "score": 20 },
    { "factor": "single file", "score": 5 }
  ],
  "decision": "full_workflow",
  "routed_to": "system-orchestrator"
}
```
