#!/bin/bash

# Smart Detector Hook for Claude Code
# Fires on UserPromptSubmit — receives JSON via stdin
# Returns additionalContext to suggest full workflow when complex tasks detected

# Read JSON from stdin
INPUT=$(cat)

# Extract the prompt text from the JSON payload
# UserPromptSubmit input: {"session_id":..., "prompt":..., "cwd":...}
PROMPT=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('prompt',''))" 2>/dev/null)

# If we couldn't extract a prompt, exit cleanly
if [ -z "$PROMPT" ]; then
  exit 0
fi

PROMPT_LOWER=$(echo "$PROMPT" | tr '[:upper:]' '[:lower:]')

# Keywords that suggest a complex task requiring full workflow
COMPLEX_MATCH=false
for keyword in "build" "create" "implement" "develop" "refactor" "redesign" \
               "migrate" "architect" "new feature" "add feature" "api" "endpoint" \
               "database" "schema" "authentication" "authorization" "security" \
               "integration" "comprehensive" "complete" "full" "production"; do
  if [[ "$PROMPT_LOWER" == *"$keyword"* ]]; then
    COMPLEX_MATCH=true
    break
  fi
done

# Keywords that suggest a simple task (skip full workflow)
SIMPLE_MATCH=false
for keyword in "typo" "rename" "comment" "tweak" "explain" "what is" \
               "how does" "show" "status" "minor" "small" "quick" "single"; do
  if [[ "$PROMPT_LOWER" == *"$keyword"* ]]; then
    SIMPLE_MATCH=true
    break
  fi
done

# Simple tasks take precedence — exit without injecting context
if [ "$SIMPLE_MATCH" = true ]; then
  exit 0
fi

# Complex task detected — inject workflow suggestion as additionalContext
if [ "$COMPLEX_MATCH" = true ]; then
  cat <<'EOF'
{
  "additionalContext": "COMPLEX TASK DETECTED - Consider using the full AI Coding Team workflow.\n\nTo start: Read skills/system-orchestrator/SKILL.md and follow the agent sequence.\nOr invoke agents directly: @project-planner, @code-architect, @implementation-agent, etc.\n\nSee AGENTS.md for the full workflow reference."
}
EOF
  exit 0
fi

# Unknown complexity — no injection
exit 0
