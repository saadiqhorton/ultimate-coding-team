# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Changed
- Updated documentation to reflect consolidated directory structure
- Added agent definition location table to AGENTS.md
- Updated directory trees in README.md, CLAUDE.md, and GEMINI.md
- Expanded platform support table in README.md

## [2.0.0] - 2026-02-13

### Changed
- **Consolidated agent definitions** -- Removed duplicate agent files from nested directories (`.claude/agents/agents/`, `.opencode/.opencode/agents/`, `.opencode/plugin/agents/`). Each platform now has one set of agent definitions in a single location.
- **Refactored Claude SDK orchestrator** -- Rewrote `claude-sdk/src/orchestrator.ts` with full hook support, permission control, structured output, and session management. Updated `workflow-state.ts` and `quality-gates.ts` MCP servers.
- **Simplified settings** -- Streamlined `.claude/settings.json` and `.claude/hooks/smart-detector.sh`.
- **Consolidated OpenCode agents** -- Moved from `.opencode/.opencode/agents/` and `.opencode/plugin/agents/` to `.opencode/agents/`.
- **Updated opencode.json** -- Configuration now points to the consolidated `.opencode/agents/` location.
- **Fixed file permissions** -- Changed many files from 755 to 644.
- **Bumped claude-sdk to version 2.0.0** in `claude-sdk/package.json`.

### Removed
- `.claude/agents/agents/` -- Duplicate nested directory
- `.opencode/.opencode/agents/` -- Old nested location
- `.opencode/plugin/agents/` -- Old plugin location

## [1.1.0] - 2026-02-12

### Added
- **Multi-tool agent integrations** -- Added `.claude/agents/`, `.opencode/agents/`, and `.codex/hooks/` for platform-specific agent definitions.
- **Claude Agent SDK orchestrator** -- Added `claude-sdk/` with TypeScript orchestrator, SDK MCP servers for workflow state and quality gates.
- **Workflow validation** -- Added `scripts/workflow_gate.sh`, `scripts/validate_workflow_artifacts.sh`, and `scripts/remediate_workflow_artifacts.sh`.
- **Pre-commit hook** -- Added `config/hooks/pre-commit` for artifact validation.
- **Configuration files** -- Added `config/workflow_artifacts.md`, `config/workflow_validation_checklist.md`, and `opencode.json`.

## [1.0.0] - 2026-02-07

### Added
- Initial release of the Ultimate AI Coding Team starter template.
- 10 specialized agents with SKILL.md files in `skills/`.
- File-based workflow coordination with `data/shared/workflow_state.json`.
- Knowledge base in `data/knowledge_base/`.
- Quality gates defined in `config/quality_gates.md`.
- Workflow configuration in `config/workflow_config.md`.
- Smart detection routing in `config/routing_table.md`.
- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and `README.md` documentation.
