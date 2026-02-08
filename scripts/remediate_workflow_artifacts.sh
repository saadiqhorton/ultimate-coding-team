#!/bin/bash
# remediate_workflow_artifacts.sh
# Moves variant files to canonical locations and archives extra files.
# Run from ultimate-coding-team root.
# Use --dry-run to preview without making changes.

set -e
shopt -s nullglob 2>/dev/null || true

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

# Derive output/archived dir from filename: use workflow date (wf_YYYYMMDD_NNN) when present, else current date.
get_output_archive_dir() {
    local base="$1"
    if [[ "$base" =~ _wf_([0-9]{4})([0-9]{2})([0-9]{2})_ ]]; then
        echo "output/archived/${BASH_REMATCH[1]}-${BASH_REMATCH[2]}-${BASH_REMATCH[3]}"
    else
        echo "output/archived/$(date +%Y-%m-%d)"
    fi
}

# Derive tasks archive dir from filename: use workflow date (wf_YYYYMMDD_NNN) when present, else current date.
get_tasks_archive_dir() {
    local base="$1"
    if [[ "$base" =~ _wf_([0-9]{4})([0-9]{2})([0-9]{2})_ ]]; then
        echo "tasks/completed/${BASH_REMATCH[1]}-${BASH_REMATCH[2]}-${BASH_REMATCH[3]}"
    else
        echo "tasks/completed/archive-$(date +%Y-%m-%d)"
    fi
}

# Derive logs archive dir: logs/archives/ or logs/archives/YYYY-MM-DD/ when filename has workflow date.
get_logs_archive_dir() {
    local base="$1"
    if [[ "$base" =~ _wf_([0-9]{4})([0-9]{2})([0-9]{2})_ ]]; then
        echo "logs/archives/${BASH_REMATCH[1]}-${BASH_REMATCH[2]}-${BASH_REMATCH[3]}"
    else
        echo "logs/archives"
    fi
}

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

run_cmd() {
    if [[ $DRY_RUN -eq 1 ]]; then
        echo "  [DRY-RUN] $*"
    else
        "$@"
    fi
}

mv_safe() { run_cmd mv "$1" "$2"; }
cp_safe() { run_cmd cp "$1" "$2"; }
rm_safe() { run_cmd rm "$1"; }
mkdir_safe() { run_cmd mkdir -p "$1"; }

# Iterate over glob(s); skip non-matches and literal '*'.
# Usage: for_each_match "pattern1" "pattern2" -- callback arg1 arg2
# Callback receives: callback "$file" "arg1" "arg2"
for_each_match() {
    local patterns=()
    local callback
    local args=()
    while [[ $# -gt 0 ]]; do
        if [[ "$1" == "--" ]]; then
            shift
            callback="$1"
            shift
            args=("$@")
            break
        fi
        patterns+=("$1")
        shift
    done
    for pat in "${patterns[@]}"; do
        for f in $pat; do
            [[ -e "$f" ]] || continue
            [[ "$f" == *"*"* ]] && continue
            "$callback" "$f" "${args[@]}"
        done
    done
}

# Copy variant to canonical if canonical missing or variant newer; then remove variant.
promote_variant() {
    local variant="$1"
    local canonical="$2"
    [[ -f "$variant" ]] || return 0
    if [[ ! -f "$canonical" ]] || [[ "$variant" -nt "$canonical" ]]; then
        echo "  Promote: $variant -> $canonical"
        mkdir_safe "$(dirname "$canonical")"
        cp_safe "$variant" "$canonical"
        rm_safe "$variant"
    else
        echo "  Remove variant (canonical exists): $variant"
        rm_safe "$variant"
    fi
}

# Archive file (move to archive dir). Uses workflow date from filename when present (wf_YYYYMMDD_NNN), else current date.
archive_file() {
    local src="$1"
    [[ -f "$src" ]] || return 0
    local base=$(basename "$src")
    local archive_dir
    archive_dir=$(get_tasks_archive_dir "$base")
    local dest="$archive_dir/$base"
    echo "  Archive: $src -> $dest"
    mkdir_safe "$archive_dir"
    mv_safe "$src" "$dest"
}

# Archive old agent_metrics variants to logs/archives/ (or logs/archives/YYYY-MM-DD/ by workflow date).
archive_to_logs_archives() {
    local src="$1"
    [[ -f "$src" ]] || return 0
    local base=$(basename "$src")
    local archive_dir
    archive_dir=$(get_logs_archive_dir "$base")
    local dest="$archive_dir/$base"
    echo "  Archive: $src -> $dest"
    mkdir_safe "$archive_dir"
    mv_safe "$src" "$dest"
}

# Archive to output/archived (by workflow date when present in filename, else current date).
archive_to_output() {
    local src="$1"
    [[ -f "$src" ]] || return 0
    local base=$(basename "$src")
    local archive_dir
    archive_dir=$(get_output_archive_dir "$base")
    local dest="$archive_dir/$base"
    echo "  Archive: $src -> $dest"
    mkdir_safe "$archive_dir"
    mv_safe "$src" "$dest"
}

# -----------------------------------------------------------------------------
# Config: tasks/active promote rules (patterns -> canonical)
# -----------------------------------------------------------------------------

TASKS_ACTIVE_PROMOTE=(
    "tasks/active/project_plan_wf_*.md|tasks/active/project_plan_phase*.md|tasks/active/project_plan.md"
    "tasks/active/implementation_summary_phase*.md|tasks/active/implementation_summary_v*.md|tasks/active/implementation_summary.md"
    "tasks/active/review_report_phase*.md|tasks/active/review_report_wf_*.md|tasks/active/review_report.md"
    "tasks/active/review_feedback_phase*.md|tasks/active/review_feedback_wf_*.md|tasks/active/review_feedback.md"
    "tasks/active/test_feedback_phase*.md|tasks/active/test_feedback_wf_*.md|tasks/active/test_feedback.md"
)

TASKS_ACTIVE_ARCHIVE=(
    "cleanup_report_phase2.md"
    "documentation_summary_phase2.md"
    "git_summary_phase2.md"
    "migration_complete.md"
    "phase1_tests_complete.md"
    "test_architecture.md"
    "test_execution_report.md"
    "test_summary_phase2.md"
    "testing_progress.md"
)

# -----------------------------------------------------------------------------
# Config: output/reports per-project promote rules (patterns -> canonical)
# -----------------------------------------------------------------------------

PROJECT_REPORT_PROMOTE=(
    "test_report_wf_*.md|test_report_migration.md|test_report_iteration*.md|test_report.md"
    "documentation_assessment.md|documentation_report_wf_*.md|documentation_report.md"
    "cleanup_report_wf_*.md|cleanup_report.md"
    "git_report.md|git_summary_wf_*.md|git_summary.md"
    "retrospective_report_wf_*.md|retrospective_report_migration.md|retrospective_report_timezone*.md|retrospective_report.md"
)

# -----------------------------------------------------------------------------
# Config: output root orphaned files (patterns -> archive)
# -----------------------------------------------------------------------------

OUTPUT_ROOT_ORPHANED=(
    "output/cleanup_report.md"
    "output/documentation_assessment.md"
    "output/git_operations_summary.md"
    "output/test_report_iteration*.md"
    "output/testing_feedback_iteration*.md"
)

# -----------------------------------------------------------------------------
# Sections
# -----------------------------------------------------------------------------

remediate_tasks_active() {
    echo "tasks/active/..."

    for rule in "${TASKS_ACTIVE_PROMOTE[@]}"; do
        IFS='|' read -r -a parts <<< "$rule"
        canonical="${parts[-1]}"
        for i in "${!parts[@]}"; do
            [[ $i -eq $((${#parts[@]} - 1)) ]] && continue
            for_each_match "${parts[$i]}" -- promote_variant "$canonical"
        done
    done

    for base in "${TASKS_ACTIVE_ARCHIVE[@]}"; do
        [[ -f "tasks/active/$base" ]] && archive_to_output "tasks/active/$base"
    done
    for_each_match "tasks/active/workflow_complete_wf_*.md" -- archive_to_output
}

remediate_logs() {
    [[ ! -d logs ]] && return
    echo ""
    echo "logs/..."
    for_each_match "logs/agent_metrics_wf_*.json" -- archive_to_logs_archives
}

# Move agent_metrics_wf_*.json that were wrongly archived under tasks/completed/ (from old runs) to logs/archives/.
remediate_logs_from_tasks_completed() {
    local f first=1
    for f in tasks/completed/*/agent_metrics_wf_*.json; do
        [[ -f "$f" ]] || continue
        [[ "$f" == *"*"* ]] && continue
        [[ $first -eq 1 ]] && { echo ""; echo "tasks/completed/ (misplaced agent_metrics to logs/archives/)..."; first=0; }
        archive_to_logs_archives "$f"
    done
}

# Move report-like .md files that were wrongly archived under tasks/completed/ to output/archived/.
remediate_reports_from_tasks_completed() {
    local f base first=1
    for f in tasks/completed/*/*.md; do
        [[ -f "$f" ]] || continue
        [[ "$f" == *"*"* ]] && continue
        base=$(basename "$f")
        case "$base" in
            cleanup_report*|documentation_summary*|documentation_report*|git_summary*|git_report*|test_*|testing_progress.md|migration_complete.md|phase1_tests_complete.md|workflow_complete*)
                [[ $first -eq 1 ]] && { echo ""; echo "tasks/completed/ (misplaced reports to output/archived/)..."; first=0; }
                archive_to_output "$f"
                ;;
        esac
    done
}

remediate_tasks_review() {
    if [[ ! -d tasks/review ]]; then
        return
    fi
    echo ""
    echo "tasks/review/..."
    for_each_match "tasks/review/REVIEW_REQUIRED_*.md" -- promote_variant "tasks/review/REVIEW_REQUIRED.md"
}

remediate_output_reports_per_project() {
    [[ ! -d output/reports ]] && return
    echo ""
    echo "output/reports/[project-name]/..."
    for dir in output/reports/*/; do
        [[ -d "$dir" ]] || continue
        proj=$(basename "$dir")
        [[ "$proj" == "_archived" || "$proj" == "archived" ]] && continue

        for rule in "${PROJECT_REPORT_PROMOTE[@]}"; do
            IFS='|' read -r -a parts <<< "$rule"
            canonical_name="${parts[-1]}"
            canonical_path="${dir}${canonical_name}"
            for i in "${!parts[@]}"; do
                [[ $i -eq $((${#parts[@]} - 1)) ]] && continue
                for_each_match "${dir}${parts[$i]}" -- promote_variant "$canonical_path"
            done
        done
    done
}

remediate_output_reports_root() {
    echo ""
    echo "output/reports/ root (orphaned)..."
    for f in output/reports/*.md; do
        [[ -e "$f" ]] || continue
        [[ "$(basename "$f")" == *"*"* ]] && continue
        archive_to_output "$f"
    done
}

remediate_output_root() {
    for pat in "${OUTPUT_ROOT_ORPHANED[@]}"; do
        for f in $pat; do
            [[ -e "$f" ]] || continue
            [[ "$f" == *"*"* ]] && continue
            archive_to_output "$f"
        done
    done
}

# Reorganize existing output/archived/* files into date subfolders by workflow date in filename.
remediate_output_archived_by_date() {
    local f base want_dir current_dir first=1
    for f in output/archived/*/*; do
        [[ -f "$f" ]] || continue
        [[ "$f" == *"*"* ]] && continue
        base=$(basename "$f")
        want_dir=$(get_output_archive_dir "$base")
        current_dir=$(dirname "$f")
        [[ "$current_dir" == "$want_dir" ]] && continue
        [[ $first -eq 1 ]] && { echo ""; echo "output/archived/ (organize by workflow date)..."; first=0; }
        echo "  Move: $f -> $want_dir/"
        mkdir_safe "$want_dir"
        mv_safe "$f" "$want_dir/$base"
    done
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

echo ""
echo "=== Remediate Workflow Artifacts ==="
[[ $DRY_RUN -eq 1 ]] && echo "(DRY RUN - no changes will be made)"
echo ""

remediate_tasks_active
remediate_logs
remediate_logs_from_tasks_completed
remediate_reports_from_tasks_completed
remediate_tasks_review
remediate_output_reports_per_project
remediate_output_reports_root
remediate_output_root
remediate_output_archived_by_date

echo ""
if [[ $DRY_RUN -eq 1 ]]; then
    echo "Dry run complete. Run without --dry-run to apply changes."
else
    echo "Remediation complete."
    echo "Archived to: tasks/completed/[YYYY-MM-DD]/ (workflow date) or tasks/completed/archive-[YYYY-MM-DD]/ (fallback)"
    echo "Output archived: output/archived/[YYYY-MM-DD]/ (by workflow date when present)"
    echo ""
    echo "Run ./scripts/validate_workflow_artifacts.sh to verify."
fi
