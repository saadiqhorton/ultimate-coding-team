#!/usr/bin/env bash
set -euo pipefail

# Workflow Gate: Required "finish task" gate for agent completion.
# Run before marking work complete. Exits 0 only when validation passes.
# Usage: ./scripts/workflow_gate.sh [strict|autofix|dry-run-fix]
#
# Modes:
#   strict      - Validate only (fail if non-canonical artifacts exist)
#   autofix     - Remediate, then validate (self-correct before gate)
#   dry-run-fix - Remediate dry-run, then validate (preview fixes)
#
# Agent runner MUST call this before accepting "complete". If exit != 0, refuse done.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MODE="${1:-strict}"

echo "=== Workflow Gate ($MODE) ==="

case "$MODE" in
  strict)
    ./scripts/validate_workflow_artifacts.sh
    ;;
  dry-run-fix)
    ./scripts/remediate_workflow_artifacts.sh --dry-run
    ./scripts/validate_workflow_artifacts.sh
    ;;
  autofix)
    ./scripts/remediate_workflow_artifacts.sh
    ./scripts/validate_workflow_artifacts.sh
    ;;
  *)
    echo "Usage: $0 {strict|autofix|dry-run-fix}"
    exit 2
    ;;
esac

echo "Gate PASSED."
