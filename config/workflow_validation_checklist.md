# Workflow Validation Checklist (Required)

Before marking a workflow complete, verify:

## Workflow Gate (Required - The Only Way to Mark Complete)

The workflow gate is the **required "finish task" gate**. The agent runner/pipeline MUST call it before accepting "done". If the gate exits non-zero, completion is refused.

```bash
./scripts/workflow_gate.sh strict    # Validate only
./scripts/workflow_gate.sh autofix   # Remediate, then validate (self-correct first)
./scripts/workflow_gate.sh dry-run-fix  # Preview fixes, then validate
```

**Modes:**
- **strict** - Validation only. Fail if non-canonical artifacts exist.
- **autofix** - Run remediation, then validation. Use when agents may have created variants.
- **dry-run-fix** - Remediation dry-run (preview), then validation.

**Rule:** Completion is only valid when `./scripts/workflow_gate.sh strict` (or `autofix`) exits 0.

## Validation Script (Direct)

**Run validation manually:**
```bash
./scripts/validate_workflow_artifacts.sh
```
Exits 0 if all checks pass, 1 if any fail.

**Install pre-commit hook (runs validation before every git commit):**
```bash
cp config/hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```
If validation fails, the commit is blocked.

**Remediate violations (move to canonical locations, archive extras):**
```bash
./scripts/remediate_workflow_artifacts.sh          # Apply fixes
./scripts/remediate_workflow_artifacts.sh --dry-run  # Preview only
```
Run remediation, then re-run validation.

## /tasks/active/

Allowed files ONLY (no others):

- [ ] project_plan.md
- [ ] implementation_summary.md
- [ ] review_report.md
- [ ] review_feedback.md (only if from current loop)
- [ ] test_feedback.md (only if from current loop)

NOT allowed:

- [ ] No *_phase*.md files
- [ ] No *_wf_*.md files
- [ ] No *_v*.md files
- [ ] No duplicate or alternate report filenames

## /tasks/review/

Allowed (only if escalation):

- [ ] REVIEW_REQUIRED.md (Retrospective Agent)

NOT allowed:

- [ ] No REVIEW_REQUIRED_[timestamp].md variants

## /output/reports/[project-name]/

Allowed:

- [ ] test_report.md (Testing Agent)
- [ ] documentation_report.md (Documentation Agent)
- [ ] cleanup_report.md (Cleanup Agent)
- [ ] git_summary.md (Git Agent)
- [ ] retrospective_report.md (Retrospective Agent)

NOT allowed:

- [ ] No test_results_phase2.md or similar
- [ ] No integration_test_results_*.md or similar
- [ ] No *_wf_*.md or *_phase*.md report variants

## /data/shared/

Allowed:

- [ ] architecture.md (Code Architect)

## /output/architecture/[project-name]/decisions/

Allowed:

- [ ] One .md file per decision (Code Architect ADRs)

## /projects/[project-name]/tests/

- [ ] All test files under tests/ (not in root or docs/)
- [ ] Subdirs unit/, integration/, e2e/ used appropriately

## Commit Messages (this workflow)

- [ ] No workflow ID (wf_*, Workflow:, Workflow ID:) in any commit message
- [ ] No Co-Authored-By or AI agent attribution in any commit message

## Action if validation fails

- Do NOT mark workflow complete
- Remove or move non-canonical files to /tasks/completed/ or archive
- Re-run agent that created the violation to overwrite correct path
