#!/bin/bash

# Smart Detector Hook for Codex
# This hook analyzes user requests and suggests using the full workflow
# when complex coding tasks are detected.

# Keywords that suggest a complex task requiring full workflow
COMPLEX_KEYWORDS=(
    "build"
    "create"
    "implement"
    "develop"
    "refactor"
    "redesign"
    "migrate"
    "architect"
    "new feature"
    "add feature"
    "api"
    "endpoint"
    "database"
    "schema"
    "authentication"
    "authorization"
    "security"
    "integration"
    "comprehensive"
    "complete"
    "full"
    "production"
)

# Keywords that suggest a simple task (skip full workflow)
SIMPLE_KEYWORDS=(
    "typo"
    "rename"
    "comment"
    "tweak"
    "explain"
    "what is"
    "how does"
    "show"
    "status"
    "minor"
    "small"
    "quick"
    "single"
)

# Function to check if request contains complex keywords
is_complex_request() {
    local request="$1"
    local request_lower=$(echo "$request" | tr '[:upper:]' '[:lower:]')

    for keyword in "${COMPLEX_KEYWORDS[@]}"; do
        if [[ "$request_lower" == *"$keyword"* ]]; then
            return 0  # True - is complex
        fi
    done

    return 1  # False - not complex
}

# Function to check if request contains simple keywords
is_simple_request() {
    local request="$1"
    local request_lower=$(echo "$request" | tr '[:upper:]' '[:lower:]')

    for keyword in "${SIMPLE_KEYWORDS[@]}"; do
        if [[ "$request_lower" == *"$keyword"* ]]; then
            return 0  # True - is simple
        fi
    done

    return 1  # False - not simple
}

# Calculate complexity score
calculate_complexity_score() {
    local request="$1"
    local request_lower=$(echo "$request" | tr '[:upper:]' '[:lower:]')
    local score=0

    # High complexity keywords
    [[ "$request_lower" == *"new feature"* ]] && score=$((score + 40))
    [[ "$request_lower" == *"add feature"* ]] && score=$((score + 40))
    [[ "$request_lower" == *"build"* ]] && score=$((score + 35))
    [[ "$request_lower" == *"create"* ]] && score=$((score + 30))
    [[ "$request_lower" == *"implement"* ]] && score=$((score + 30))
    [[ "$request_lower" == *"security"* ]] && score=$((score + 30))
    [[ "$request_lower" == *"authentication"* ]] && score=$((score + 30))
    [[ "$request_lower" == *"database"* ]] && score=$((score + 25))
    [[ "$request_lower" == *"api"* ]] && score=$((score + 20))
    [[ "$request_lower" == *"refactor"* ]] && score=$((score + 15))

    echo $score
}

# Main detection logic
detect_workflow_type() {
    local request="$1"

    # Check for simple keywords first (they take precedence)
    if is_simple_request "$request"; then
        echo "simple"
        return
    fi

    # Check for complex keywords
    if is_complex_request "$request"; then
        echo "complex"
        return
    fi

    # Check complexity score
    local score=$(calculate_complexity_score "$request")
    if [[ $score -ge 50 ]]; then
        echo "complex"
        return
    fi

    # Default to asking user
    echo "unknown"
}

# Hook entry point
main() {
    local user_request="$1"
    local workflow_type=$(detect_workflow_type "$user_request")
    local score=$(calculate_complexity_score "$user_request")

    echo "[Codex Smart Detector]"
    echo "Complexity Score: $score"

    case "$workflow_type" in
        "complex")
            echo "Recommendation: Use FULL AI Coding Team workflow"
            echo "This appears to be a complex coding task."
            echo ""
            echo "To start, read: skills/system-orchestrator/SKILL.md"
            echo ""
            echo "The workflow includes:"
            echo "  1. Project Planner - Task breakdown"
            echo "  2. Code Architect - System design"
            echo "  3. Implementation Agent - Code writing"
            echo "  4. Code Reviewer - Quality check"
            echo "  5. Testing Agent - Test writing"
            echo "  6. Documentation Agent - Docs"
            echo "  7. Git Agent - Version control"
            echo "  8. Cleanup Agent - Organization"
            echo "  9. Retrospective Agent - Learning"
            ;;
        "simple")
            echo "Recommendation: SKIP full workflow"
            echo "This appears to be a simple task."
            echo "Proceeding directly without the full agent sequence."
            ;;
        "unknown")
            echo "Recommendation: Consider the request carefully"
            echo "Unable to determine task complexity."
            echo ""
            echo "Use full workflow if:"
            echo "  - New features or multi-file changes"
            echo "  - API or database work"
            echo "  - Security-related changes"
            echo ""
            echo "Skip workflow if:"
            echo "  - Single-line fixes or typos"
            echo "  - Simple renames or comments"
            echo "  - Reading or explaining code"
            ;;
    esac
}

# Execute if run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
