---
description: Clarify a task, implement to shippable quality, commit, push, and open a draft PR
argument-hint: "<Linear issue key|URL|task>"
---

YOLO workflow input:
$@

Treat this `/yolo` invocation as Travis's explicit request to drive the provided Linear issue or task end-to-end: clarify only when needed, implement, validate, review, commit, push, open a Draft PR, and summarize. Do not merge.

`/yolo` is `/ship` plus git/PR publication. Use one writer at a time.

## 1. Safety and scope

1. Run `git status --short --branch`.
2. Identify current branch/upstream and recent relevant commits if needed.
3. If unrelated local changes exist, keep them separate. If they conflict, stop and ask Travis.
4. Identify whether `$@` cites a Linear issue key/URL.
5. If a branch is needed, create/use a safe branch:
   - with Linear: `<type>/<linear-issue-id>-<short-slug>`
   - without Linear: `<type>/<short-task-slug>`
   Ask before changing branches if local state makes this unsafe.

## 2. Requirements

1. If Linear is cited, fetch/reconstruct title, description, comments, labels/status, and linked context when available.
2. If no Linear is cited, use `$@`, nearby conversation, repo docs, and discovered code context as the acceptance source. Do not ask for Linear solely because it is absent.
3. If the acceptance source is missing, contradictory, product-sensitive, or impossible to verify, ask concise blocking questions and wait.
4. Otherwise state the acceptance criteria and assumptions, then proceed.

## 3. Goal and implementation

Create or replace one durable goal with `create_goal({ replace_existing: true, ... })`.

Use the lean `/ship` workflow directly; do not use the old swarm pattern:
- preflight and docs/TODO context
- optional read-only `scout` and risk `reviewer` only when useful
- parent-owned plan/validation contract
- one writer only
- focused validation
- fresh read-only review for non-trivial diffs
- fix show-stoppers with one writer
- completion audit before `update_goal`

Delegation rules:
- Read-only helpers use `acceptance: "none"` or `false`.
- Writer uses `acceptance: "checked"`.
- No parallel writers in the active worktree.
- No subagent launches from child workers.
- Use external `researcher` only when current official docs materially affect the implementation.

## 4. Review and fix loop

After implementation and local validation:
1. For non-trivial diffs, run fresh-context read-only reviewers for:
   - functionality/correctness against requirements
   - tests/validation/regression risk
   - simplicity/maintainability
2. Parent synthesizes findings into:
   - must-fix before PR
   - worth fixing now
   - optional follow-up
   - ignore/defer with reason
3. Fix must-fix items with one writer.
4. Rerun focused validation and relevant review angle.
5. Do not proceed to commit while show-stoppers remain.

## 5. Commit, push, draft PR

Proceed only when requirements are implemented or intentionally deferred with Travis approval, and validation/review is acceptable.

1. Inspect final state:
   - `git status --short`
   - `git diff --stat`
   - `git diff --check`
2. Commit with Conventional Commit format:
   - with Linear: `<type>: <linear-issue-id>: <message>`
   - without Linear: `<type>: <message>`
3. Push the branch.
4. Open a Draft PR with `gh pr create --draft` unless Travis explicitly asked for ready-for-review.
5. PR title follows the same Conventional Commit rule.
6. PR body includes requirements, implementation summary, validation, review results, and residual risks.
7. Show Travis the PR link.

## 6. Final response

Use these headings:

## TLDR
Plain-English walkthrough of what changed and why.

## Requirements Coverage
Each requirement: met / deferred / blocked, with evidence.

## Clean Changes Made
Purposeful changes grouped by area/file.

## Validation
Commands/checks and results.

## Review Results
Show-stoppers fixed, optional follow-up, confidence.

## PR
PR link/number, branch, commit hash, draft/ready state.

## Remaining Risk
Only real residual risk.
