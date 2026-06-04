---
name: make-pr
description: Prepare a branch for PR readiness without opening, merging, or changing draft status. Use when the user asks for /makepr, makepr, PR-ready checks, or final PR preparation.
---

# Make PR

Drive the current branch to PR-ready state. Follow all Git and PR rules in `AGENTS.md`.

## Workflow

1. Validate repo state with safe checks: `git status`, `git diff`, `git log`, then confirm branch and pending changes.
2. Run the repo's full gate: lint, typecheck, tests, docs, or the local equivalents in repo docs.
3. If a PR already exists, process review feedback end to end:
   - Address every unresolved comment or thread.
   - Reply on comments with fix references: file and line.
   - Resolve threads only after the fix lands.
   - Request re-review from original reviewers after updates.
   - For bot reviewers such as Gemini, CodeRabbit, or Codex, explicitly request another review pass.
   - After replies and re-review requests, wait 3 minutes, then re-check for new reviewer responses.
4. Re-run checks after fixes. Continue until feedback is addressed and checks pass.
5. Do not auto-merge. Do not change Draft/Ready status unless Travis explicitly directs it.

## Output

Keep status bullets short. Include exact check commands run, PR review commands used, feedback status, and remaining risk notes.

When complete, say: `PR is ready to be opened.`
