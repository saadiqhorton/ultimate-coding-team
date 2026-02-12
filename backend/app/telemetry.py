"""Optional observability: send CrewAI traces to Phoenix (or other backends) for a web UI."""
from __future__ import annotations

_phoenix_setup_done = False


def setup_phoenix_if_configured(endpoint: str | None = None) -> bool:
    """
    If UCT_PHOENIX_ENDPOINT (or the given endpoint) is set, register OpenTelemetry
    with Phoenix and instrument CrewAI so runs appear in the Phoenix UI.
    Run `phoenix serve` and open http://localhost:6006 to view traces.
    Returns True if instrumentation was applied, False otherwise.
    """
    global _phoenix_setup_done
    if _phoenix_setup_done:
        return True

    from app.config import settings
    url = endpoint or (getattr(settings, "phoenix_endpoint", None) if settings else None)
    if not url:
        return False

    try:
        from phoenix.otel import register
        from openinference.instrumentation.crewai import CrewAIInstrumentor
    except ImportError:
        return False

    try:
        tracer_provider = register(
            project_name="ultimate-coding-team",
            endpoint=url,
        )
        CrewAIInstrumentor().instrument(skip_dep_check=True, tracer_provider=tracer_provider)
        _phoenix_setup_done = True
        return True
    except Exception:
        return False
