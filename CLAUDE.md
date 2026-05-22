# AGENTS.md

## Workflow

This project uses:
- Spec Kit for specs, plans, and task tracking.
- Basic Memory for durable project knowledge.
- Serena for codebase navigation and semantic code understanding.

Before implementation:
1. Read the relevant Spec Kit files under `specs/`.
2. Search Basic Memory for related architecture decisions, conventions, and prior lessons.
3. Use Serena to locate related symbols, references, and implementation patterns.
4. Only implement the task explicitly requested by the user.

During implementation:
- Keep changes small and reversible.
- Do not modify unrelated files.
- Do not implement tasks outside the current request.
- Prefer existing architecture and naming conventions.
- Do not add dependencies unless the current plan explicitly allows it.

After implementation:
1. Explain changed files.
2. Explain why they changed.
3. Explain how to verify the change.
4. Update Basic Memory only if durable project knowledge was created.

## Basic Memory Rules

Save only durable knowledge:
- architecture decisions
- API conventions
- module responsibilities
- recurring bugs and fixes
- deployment notes
- constraints future development must know

Do not save temporary implementation details.

## Serena Rules

Use Serena for:
- finding symbols
- finding references
- understanding code structure
- locating existing implementation patterns

Do not use Serena memory as the source of truth for architecture decisions.
Basic Memory is the source of truth for long-term project knowledge.
