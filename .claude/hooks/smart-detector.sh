#!/bin/bash

# Smart Detector Hook for Claude Code
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

    # Default to asking user
    echo "unknown"
}

# Hook entry point
main() {
    local user_request="$1"
    local workflow_type=$(detect_workflow_type "$user_request")

    case "$workflow_type" in
        "complex")
            echo "SUGGESTION: This appears to be a complex coding task."
            echo "Consider using the full AI Coding Team workflow."
            echo "Read: skills/system-orchestrator/SKILL.md for instructions."
            ;;
        "simple")
            echo "SUGGESTION: This appears to be a simple task."
            echo "Proceeding directly without full workflow."
            ;;
        "unknown")
            echo "SUGGESTION: Unable to determine task complexity."
            echo "For new features or multi-file changes, consider the full workflow."
            echo "Read: skills/system-orchestrator/SKILL.md"
            ;;
    esac
}

# Execute if run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
