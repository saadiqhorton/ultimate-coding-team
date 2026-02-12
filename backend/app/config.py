"""Backend configuration. Loads from env / defaults."""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


def _workspace_root() -> Path:
    """Resolve workspace root (parent of backend/)."""
    return Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="UCT_", env_file=".env")

    # Workspace paths (Ultimate Coding Team layout)
    workspace_root: Path = _workspace_root()
    data_dir: Path = _workspace_root() / "data"
    shared_dir: Path = _workspace_root() / "data" / "shared"
    logs_dir: Path = _workspace_root() / "logs"
    tasks_dir: Path = _workspace_root() / "tasks"
    output_dir: Path = _workspace_root() / "output"
    projects_dir: Path = _workspace_root() / "projects"
    scripts_dir: Path = _workspace_root() / "scripts"

    # Quality gate thresholds (match config/quality_gates.md)
    gate_planning_min: int = 85
    gate_architecture_min: int = 90
    gate_code_quality_min: int = 85
    gate_documentation_min: int = 80
    gate_final_min: int = 90
    max_loops: int = 3

    # Service
    host: str = "0.0.0.0"
    port: int = 8000

    # Optional: send CrewAI traces to Phoenix for web UI (e.g. http://localhost:6006/v1/traces)
    phoenix_endpoint: str | None = None


settings = Settings()
