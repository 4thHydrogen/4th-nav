#!/usr/bin/env python3
"""Hook path resolver for Claude Code worktree compatibility.

Finds the project root (directory containing .claude/) from any CWD,
then delegates to the actual hook script in .claude/hooks/.

This file lives in .trellis/scripts/ which IS tracked in git, so it
exists in every git worktree. The actual hook scripts in .claude/hooks/
are NOT in git and only exist in the main repo — this resolver bridges
that gap.

Usage:
    python .trellis/scripts/run-hook.py <hook_name>
    e.g.  python .trellis/scripts/run-hook.py inject-workflow-state
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

# Force UTF-8 on Windows (matches the encoding fix in the actual hooks).
if sys.platform.startswith("win"):
    import io as _io
    for _name in ("stdin", "stdout", "stderr"):
        _stream = getattr(sys, _name, None)
        if _stream is None:
            continue
        if hasattr(_stream, "reconfigure"):
            try:
                _stream.reconfigure(encoding="utf-8", errors="replace")
            except Exception:
                pass
        elif hasattr(_stream, "detach"):
            try:
                setattr(sys, _name, _io.TextIOWrapper(_stream.detach(), encoding="utf-8", errors="replace"))
            except Exception:
                pass


def find_project_root() -> Path:
    """Walk up from CWD to find the directory containing .claude/."""
    cur = Path.cwd().resolve()
    while cur != cur.parent:
        if (cur / ".claude").is_dir():
            return cur
        cur = cur.parent
    return Path.cwd()


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python run-hook.py <hook_name>", file=sys.stderr)
        return 1

    hook_name = sys.argv[1]
    # Strip .py suffix if caller included it
    if hook_name.endswith(".py"):
        hook_name = hook_name[:-3]

    root = find_project_root()
    script = root / ".claude" / "hooks" / f"{hook_name}.py"

    if not script.exists():
        print(f"Hook not found: {script}", file=sys.stderr)
        return 1

    result = subprocess.run(
        [sys.executable, str(script)],
        stdin=sys.stdin,
    )
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
