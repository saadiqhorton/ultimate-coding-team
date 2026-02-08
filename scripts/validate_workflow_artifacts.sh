#!/bin/bash
# validate_workflow_artifacts.sh
# Implements config/workflow_validation_checklist.md
# Exit 0 if all checks pass, 1 if any fail.
# Run from ultimate-coding-team root.

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ERRORS=0

check_fail() {
    echo "FAIL: $1"
    ERRORS=$((ERRORS + 1))
}

check_pass() {
    echo "PASS: $1"
}

# --- /tasks/active/ ---
echo ""
echo "Checking /tasks/active/..."

ALLOWED_ACTIVE=("project_plan.md" "implementation_summary.md" "review_report.md" "review_feedback.md" "test_feedback.md")
if [[ -d tasks/active ]]; then
    for f in tasks/active/*; do
        [[ -e "$f" ]] || continue
        base=$(basename "$f")
        if [[ "$base" == *_phase*.md ]] || [[ "$base" == *_wf_*.md ]] || [[ "$base" == *_v*.md ]]; then
            check_fail "tasks/active/ contains disallowed file: $base (use canonical names, no *_phase*, *_wf_*, *_v*)"
        else
            allowed=0
            for a in "${ALLOWED_ACTIVE[@]}"; do
                [[ "$base" == "$a" ]] && { allowed=1; break; }
            done
            if [[ $allowed -eq 0 ]]; then
                check_fail "tasks/active/ contains non-canonical file: $base (allowed: ${ALLOWED_ACTIVE[*]})"
            else
                check_pass "tasks/active/$base"
            fi
        fi
    done
fi

# --- /tasks/review/ ---
echo ""
echo "Checking /tasks/review/..."
if [[ -d tasks/review ]]; then
    for f in tasks/review/*; do
        [[ -e "$f" ]] || continue
        base=$(basename "$f")
        if [[ "$base" == "REVIEW_REQUIRED.md" ]]; then
            check_pass "tasks/review/$base"
        elif [[ "$base" == REVIEW_REQUIRED_*.md ]]; then
            check_fail "tasks/review/ contains disallowed: $base (use REVIEW_REQUIRED.md only)"
        else
            check_fail "tasks/review/ contains non-canonical file: $base"
        fi
    done
fi

# --- /output/reports/[project-name]/ ---
echo ""
echo "Checking /output/reports/..."

ALLOWED_REPORTS=("test_report.md" "documentation_report.md" "cleanup_report.md" "git_summary.md" "retrospective_report.md")
if [[ -d output/reports ]]; then
    for dir in output/reports/*/; do
        [[ -d "$dir" ]] || continue
        proj=$(basename "$dir")
        for f in "$dir"*; do
            [[ -e "$f" ]] || continue
            base=$(basename "$f")
            if [[ "$base" == *phase*.md ]] || [[ "$base" == *_wf_*.md ]] || [[ "$base" == *migration*.md ]] || [[ "$base" == *iteration*.md ]] || [[ "$base" == *timezone*.md ]]; then
                check_fail "output/reports/$proj/ contains disallowed variant: $base"
            else
                allowed=0
                for a in "${ALLOWED_REPORTS[@]}"; do
                    [[ "$base" == "$a" ]] && { allowed=1; break; }
                done
                if [[ $allowed -eq 0 ]]; then
                    check_fail "output/reports/$proj/ contains non-canonical file: $base (allowed: ${ALLOWED_REPORTS[*]})"
                else
                    check_pass "output/reports/$proj/$base"
                fi
            fi
        done
    done
    # Also check for reports at output/reports/ root (not in project subdir)
    for f in output/reports/*.md; do
        [[ -e "$f" ]] || continue
        base=$(basename "$f")
        [[ "$base" == *"*"* ]] && continue
        check_fail "output/reports/ has file at root: $base (reports must be in output/reports/[project-name]/)"
    done
fi

# --- /logs/ ---
echo ""
echo "Checking /logs/..."
ALLOWED_LOGS=("agent_metrics.json" "archives" "errors" "traces")
if [[ -d logs ]]; then
    for f in logs/*; do
        [[ -e "$f" ]] || continue
        base=$(basename "$f")
        [[ "$base" == *"*"* ]] && continue
        if [[ "$base" == agent_metrics_wf_*.json ]] || [[ "$base" == *"_wf_"* ]]; then
            check_fail "logs/ contains disallowed variant: $base (use agent_metrics.json only)"
        else
            allowed=0
            for a in "${ALLOWED_LOGS[@]}"; do
                [[ "$base" == "$a" ]] && { allowed=1; break; }
            done
            if [[ $allowed -eq 0 ]]; then
                check_fail "logs/ contains non-canonical file or folder: $base (allowed: agent_metrics.json, archives/, errors/, traces/)"
            else
                check_pass "logs/$base"
            fi
        fi
    done
fi

# --- /data/shared/ ---
echo ""
echo "Checking /data/shared/..."
if [[ -d data/shared ]]; then
    for f in data/shared/*.md; do
        [[ -e "$f" ]] || continue
        base=$(basename "$f")
        if [[ "$base" != "architecture.md" ]]; then
            check_fail "data/shared/ contains non-canonical file: $base (allowed: architecture.md)"
        else
            check_pass "data/shared/$base"
        fi
    done
fi

# --- /output/architecture/[project-name]/decisions/ ---
# ADRs: one .md per decision. We allow any [name].md. Disallow *_phase*, *_wf_*.
echo ""
echo "Checking /output/architecture/..."
if [[ -d output/architecture ]]; then
    for dir in output/architecture/*/decisions/; do
        [[ -d "$dir" ]] || continue
        for f in "$dir"*.md; do
            [[ -e "$f" ]] || continue
            base=$(basename "$f")
            if [[ "$base" == *_phase* ]] || [[ "$base" == *_wf_* ]]; then
                check_fail "output/architecture/decisions/ contains disallowed: $base"
            else
                check_pass "output/architecture/.../decisions/$base"
            fi
        done
    done
fi

# --- Commit message (if run from pre-commit) ---
if [[ -n "$CHECK_COMMIT_MSG" ]] && [[ -f .git/COMMIT_EDITMSG ]]; then
    echo ""
    echo "Checking commit message..."
    msg=$(cat .git/COMMIT_EDITMSG)
    if echo "$msg" | grep -qE 'wf_[0-9]{8}_[0-9]{3}|Workflow:\s*wf_|Workflow ID:\s*wf_'; then
        check_fail "Commit message contains workflow ID (remove wf_*, Workflow:, Workflow ID:)"
    fi
    if echo "$msg" | grep -qi 'Co-Authored-By'; then
        check_fail "Commit message contains Co-Authored-By (remove AI agent attribution)"
    fi
    if [[ $ERRORS -eq 0 ]]; then
        check_pass "Commit message excludes workflow ID and Co-Authored-By"
    fi
fi

# --- Summary ---
echo ""
if [[ $ERRORS -gt 0 ]]; then
    echo "Validation FAILED: $ERRORS error(s). Fix before marking workflow complete."
    echo "See config/workflow_validation_checklist.md and config/workflow_artifacts.md"
    exit 1
fi
echo "Validation PASSED. All workflow artifacts conform to canonical paths."
exit 0
