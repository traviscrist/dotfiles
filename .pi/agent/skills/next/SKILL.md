---
name: next
description: Select, implement, validate, commit, and open a ready-for-review PR for the smallest coherent slice of the next authoritative project step.
disable-model-invocation: true
---

# Next Project Step

The `/next` wrapper has already opened a fresh session. Do not create another
session.

Invoking `/next` grants permission to:

- switch from a clean working tree to `main`
- fast-forward local `main`
- create a task branch
- implement one small coherent slice
- commit and push that slice
- open a ready-for-review pull request

It does not grant permission to merge, use admin privileges, discard work, reset,
clean, or overwrite unrelated changes.

## 1. Synchronize

1. Read repository instructions.
2. Run `git status --short --branch`.
3. Require a clean working tree, including untracked files.
4. If dirty, stop and report the exact paths. Never stash or discard them.
5. Switch to `main` when needed.
6. Run `git pull --ff-only origin main`.
7. Verify GitHub CLI authentication and repository access.
8. Inspect status and recent relevant commits.

Stop if any synchronization step cannot complete safely.

## 2. Discover the next step

1. Run the repository's documentation-list command when available.
2. Read `TODO.md` and relevant roadmap, milestone, architecture, and operations
   documentation.
3. Prefer, in order:
   - an explicitly named next action
   - the first unblocked item in the active milestone
   - the smallest missing prerequisite for that item
4. Confirm through source and recent commits that it is not already complete.
5. Treat optional `/next` arguments as a focus hint, not permission to ignore
   authoritative project priorities.

## 3. Clarify uncertainty

Before choosing or implementing the slice, identify anything unclear about:

- which next step has authority
- intended behavior or acceptance criteria
- product, privacy, security, or architecture decisions
- affected environment or surface
- whether multiple next steps have equal priority

If anything is unclear, ask the user before proceeding. Group all blocking
questions into one structured `ask_user_question` call when available.

Do not invent requirements or silently choose between materially different
options. If everything is clear, continue without asking.

## 4. Choose the slice

Choose the smallest coherent slice that:

- advances the selected next step
- produces a reviewable and testable result
- preserves existing behavior
- avoids speculative infrastructure and broad refactors
- fits into one focused pull request
- requires no unresolved decision

Before editing, state:

- selected next step
- chosen slice
- completion criteria
- branch name
- likely files
- validation plan

Create a Conventional Commit-style task branch from updated `main`.

## 5. Delegate sparingly

The parent is the only writer.

Subagents remain available but bounded:

- optionally one fresh-context scout or researcher when repository inspection
  cannot answer a material question
- optionally one fresh-context reviewer after validation for a non-trivial diff
- no worker subagent, forked context, fanout, nested delegation, or polling

If delegating, list executable agents first. Skip delegation for small, obvious
changes.

## 6. Implement and validate

1. Implement the slice; do not stop at planning.
2. Add focused regression coverage when behavior changes.
3. Update `TODO.md` and owning documentation when progress or behavior changes.
4. Run focused validation followed by repository-required gates.
5. Inspect final status, diff, and diff check.
6. Run one focused review when warranted.
7. Fix show-stoppers and rerun affected validation.

Do not publish partial or knowingly failing work.

## 7. Commit and publish

1. Stage only intentional files.
2. Commit using the repository's Conventional Commit rules.
3. Push the task branch.
4. Open a non-draft pull request targeting `main`.
5. Use a Conventional Commit PR title.
6. Include requirements, implementation, validation, review results, and residual
   risks in the PR body.
7. Confirm the PR is ready for review, not draft.
8. Run the repository-required final GitHub CI pass.
9. Fix attributable failures, push, and recheck until green or genuinely blocked.
10. Never merge the PR.

Report the PR link, branch, commit, CI state, and any remaining risk.
