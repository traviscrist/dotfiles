---
name: cleanup-agent-artifacts
description: Clean up local agent scratch artifacts such as .pi-subagents, goal-swarm, and agent artifact directories. Use when the user asks to clean, remove, trash, reset, or audit agent-generated working files in a repo or workspace.
---

# Cleanup Agent Artifacts

Clean local agent scratch output without touching tracked source, secrets, or build/dependency directories.

## Safety Contract

- Start with `git status --short --branch` in the target workspace.
- Dry-run first unless the user explicitly asked to apply cleanup now.
- Trash, do not permanently delete. The helper uses `trash` and refuses `rm` fallback.
- Never remove tracked files or directories that contain tracked files.
- Never clean `.env*`, `.dev.vars`, secrets, OAuth/token files, `node_modules`, build outputs, migrations, package manager caches, or `.git`.
- Treat broad names like `research` as optional only; use `--include-research` when the dry-run clearly shows agent scratch content.
- If a candidate path looks user-authored or ambiguous, skip it and mention it.

## Default Command

From this skill directory:

```bash
scripts/cleanup-agent-artifacts.sh --dry-run
```

Apply the safe default cleanup after reviewing the dry-run:

```bash
scripts/cleanup-agent-artifacts.sh --apply
```

Target another workspace:

```bash
scripts/cleanup-agent-artifacts.sh --root /path/to/repo --dry-run
scripts/cleanup-agent-artifacts.sh --root /path/to/repo --apply
```

Include an untracked top-level/nested `research` directory only when it is known to be agent scratch:

```bash
scripts/cleanup-agent-artifacts.sh --include-research --dry-run
scripts/cleanup-agent-artifacts.sh --include-research --apply
```

## Workflow

1. Identify the target root. Prefer the current git repo root; otherwise use `pwd`.
2. Run the helper in dry-run mode.
3. Review skipped paths and candidates.
4. Apply only if candidates are untracked/ignored agent artifacts and the user requested cleanup.
5. Run `git status --short --branch` again.
6. Report trashed paths, skipped paths, and remaining artifacts.
