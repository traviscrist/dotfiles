---
summary: 'Prepare PR readiness by following AGENTS git rules and PR feedback loop.'
read_when:
  - User asks for /makepr.
  - Preparing a branch for PR opening or final PR readiness checks.
---
# /makepr

Purpose: drive a branch to PR-ready state without opening/merging automatically.

Required policy:
1) Follow all Git and PR rules in `AGENTS.md` exactly.
2) Follow the `PR Feedback` flow in `AGENTS.md` until complete.

Workflow:
1) Validate repo state using safe git checks from `AGENTS.md` (`status/diff/log`), then confirm branch and pending changes.
2) Ensure implementation is complete and run the full test/check gate required by the repo (lint/typecheck/tests/docs or equivalent).
3) If a PR already exists, process review feedback end-to-end:
   - Address every unresolved comment/thread.
   - Reply on all comments with fix references (file/line) and close resolved threads.
   - Request re-review from original reviewers after updates.
   - If reviewer is a bot (`Gemini`, `CodeRabbit`, `Codex`), explicitly request another review pass.
   - After posting replies/re-review requests, wait 3 minutes before considering review complete, then re-check for new reviewer responses.
4) Re-run checks after fixes; continue until feedback is addressed and tests/checks pass.
5) Do not auto-merge and do not change Draft/Ready status unless explicitly directed.
6) When complete, stop and notify the user:
   - `PR is ready to be opened.`
   - Include concise evidence: checks run/results, feedback status, and any remaining risk notes.

Output format:
- Short status bullets only.
- Include exact commands run for checks and any PR review commands used.
