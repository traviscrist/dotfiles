---
description: Clarify a Linear issue, implement with goal swarm, review, push, and open a PR
argument-hint: "<Linear issue key|URL|task>"
---

YOLO workflow input:
$@

Treat this `/yolo` invocation as Travis's explicit request to run a full implementation workflow for the provided Linear issue or task: clarify requirements, implement, review, commit, push, open a draft PR, and summarize. Stay safe: do not skip clarification, do not overwrite unrelated work, and do not merge.

## Phase 0. Safety and scope

1. Check repository state first:
   - `git status --short --branch`
   - current branch and upstream
   - recent commits if needed
2. If unexpected/unrelated local changes exist, keep them separate. If they conflict with the work, stop and ask Travis.
3. If a branch change is required, ask before changing branches unless Travis's invocation already named the target branch.
4. New PRs are Draft by default. Never auto-merge.

## Phase 1. Linear requirements and clarification

Use the `/gather-context-and-clarify` pattern before planning or implementing.

1. Identify the Linear issue from the input:
   - issue key or URL from `$@`
   - if missing, ask Travis for the Linear issue key/URL or pasted issue text
2. Retrieve or reconstruct the Linear context:
   - title
   - description
   - acceptance criteria / functional requirements
   - relevant comments or decisions
   - non-goals / constraints
   - linked PRs or docs if available
3. If Linear tooling is unavailable or the issue cannot be fetched, ask Travis for the issue text instead of guessing.
4. Launch context-gathering subagents before implementation:
   - call `subagent({ action: "list" })`
   - use executable agents only
   - run `scout` for local code context and likely integration points
   - add `researcher` only when external docs/current sources materially help
5. Bring requirements back to Travis before implementation:
   - summarize the Linear requirements in bullets
   - list assumptions
   - ask all blocking clarification questions
   - ask any important non-blocking questions separately
6. Stop and wait for Travis's answers if there are blocking questions. Do not implement until scope and acceptance criteria are clear enough.

## Phase 2. Goal swarm implementation

After Travis answers clarification questions, use the existing `/goal-swarm` workflow.

1. Read `~/.pi/agent/prompts/goal-swarm.md` if needed and apply it directly.
2. Create a strict durable goal with `create_goal({ replace_existing: true, ... })`.
3. Launch the goal-swarm subagent chain:
   - context/risk passes
   - planner
   - sole writer implementation
   - scoped simplify pass
   - validation reviewers
4. Keep one writer at a time in the active worktree unless Travis explicitly requested worktree-isolated parallel implementation.
5. Run the validation required by the goal and repository instructions.
6. If implementation is blocked by missing access, tools, or decisions, stop without committing and report blockers.

## Phase 3. Parallel review

After implementation and local validation, kick off a fresh parallel review.

Use the installed `/parallel-review` behavior, without `autofix` unless Travis explicitly asked for autofix:

1. Launch fresh-context reviewers with distinct angles based on the Linear issue and diff.
2. Include at least:
   - functionality/correctness against Linear requirements
   - tests/validation and regression risk
   - simplicity/maintainability, duplication, inefficient loops
3. Reviewers must inspect repository files and diff directly.
4. Reviewers must not edit files.
5. Synthesize:
   - show-stoppers that must be fixed before PR
   - fixes worth doing now
   - optional/actionable follow-up items
   - feedback to ignore/defer with reason
6. If show-stoppers are found, fix them with a single writer path, rerun focused validation, and rerun the relevant review angle before commit.

## Phase 4. Commit, push, and PR

Proceed only when:

- Linear requirements are implemented or any intentional exclusions are explicitly approved by Travis
- no show-stopper review findings remain
- required validation has passed or exact blockers are documented

Then:

1. Inspect final diff:
   - `git status --short`
   - `git diff --stat`
   - `git diff --check`
2. Commit with Conventional Commit format:
   - with Linear issue ID: `<type>: <linear-issue-id>: <message>`
   - without issue ID only if no Linear issue exists: `<type>: <message>`
3. Push the branch.
4. Open a Draft PR with `gh pr create --draft` unless Travis explicitly asked for ready-for-review.
5. PR title must follow the same Conventional Commit rules and include the Linear issue ID when one exists:
   - `<type>: <linear-issue-id>: <PR title>`
6. Include Linear context, validation evidence, and review notes in the PR body.
7. Show Travis the PR link.

## Phase 5. Final summary to Travis

Finish with these headings:

## TLDR
A short plain-English walkthrough of what changed, how the new code works, and how it solves the Linear issue.

## Clean Changes Made
Bullets grouped by area/file. Focus on purposeful, clean changes rather than implementation noise.

## Requirements Coverage
List each Linear requirement as met / not met / intentionally deferred. Include evidence.

## Validation
Commands/checks run and results. If any were blocked, say exactly why.

## Parallel Review Results
Summarize the review passes and confidence level.

## Actionable Review Items
List remaining actionable items from review for Travis/us to decide or take action on. Separate must-fix-before-merge from optional follow-up.

## PR
PR number/link, branch, commit hash, and draft/ready state.
