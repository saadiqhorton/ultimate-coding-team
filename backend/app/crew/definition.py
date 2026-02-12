"""
Ultimate Coding Team CrewAI crew definition.

Define agents and tasks here. This is a minimal sequential crew so the backend
runs end-to-end; expand with all 9 agents and quality-gate logic as needed.
See docs/CREWAI_INTEGRATION_GUIDE.md.
"""
from pathlib import Path

# Lazy import so the app starts even if crewai is not installed
def _make_crew():
    from crewai import Agent, Crew, Process, Task

    workspace_root = Path(__file__).resolve().parent.parent.parent.parent
    knowledge_paths = [
        workspace_root / "data" / "knowledge_base" / "lessons_learned.md",
        workspace_root / "data" / "knowledge_base" / "coding_standards.md",
    ]
    knowledge_sources = [str(p) for p in knowledge_paths if p.exists()]

    project_planner = Agent(
        role="Project Planner",
        goal="Break the user request into a clear, actionable task plan with dependencies.",
        backstory="You are an expert at decomposing software projects into atomic, testable tasks.",
        verbose=True,
        allow_delegation=False,
    )

    implementation_agent = Agent(
        role="Implementation Agent",
        goal="Produce a concise implementation summary and next steps based on the plan.",
        backstory="You turn plans into concrete implementation guidance and code structure.",
        verbose=True,
        allow_delegation=False,
    )

    plan_task = Task(
        description="""Analyze the user request and produce a short task plan.
        Include: 1) Main objective, 2) 3-5 atomic tasks, 3) Dependencies between them.
        Request and project context are in the inputs.""",
        expected_output="A structured task plan with objective, tasks, and dependencies.",
        agent=project_planner,
    )

    implement_task = Task(
        description="""Based on the task plan, produce implementation guidance:
        suggested file layout, key modules, and a short summary of what to build.
        Do not write full code; focus on structure and next steps.""",
        expected_output="Implementation summary: file layout, key modules, and next steps.",
        agent=implementation_agent,
        context=[plan_task],
    )

    crew = Crew(
        agents=[project_planner, implementation_agent],
        tasks=[plan_task, implement_task],
        process=Process.sequential,
        verbose=True,
    )
    return crew


# Singleton crew instance (created on first use)
_coding_crew = None


def get_coding_crew():
    global _coding_crew
    if _coding_crew is None:
        _coding_crew = _make_crew()
    return _coding_crew


