---
name: auto-next
description: Orchestrate one authoritative next project item through Autoplan approval and Autoimplement from a fresh session. Invoke with /auto-next; direct /skill:auto-next invocation cannot reset context.
compatibility: Requires Git, GitHub CLI, Pi Workflows, and the built-in autoplan and autoimplement workflows.
disable-model-invocation: true
---

# Auto Next

Use this skill only through `/auto-next`. The extension opens a fresh session and
appends `AUTO_NEXT_FRESH_SESSION: true` to the kickoff. If that marker is absent,
stop and ask the user to invoke `/auto-next`; a skill-only invocation cannot reset
context.

One invocation owns one authoritative TODO item, one approved plan, one new branch,
and one pull request. It may synchronize `main`, plan, implement, commit, push, and
prepare that pull request for review. It may not discard work, merge, deploy, release,
change credentials or policy, or modify unrelated repositories.

Optional arguments are focus hints only. Repository authority still decides what is
next.

## 1. Start clean from latest main

1. Read applicable repository instructions.
2. Run the repository's documentation-list command when available.
3. Run `git status --short --branch`, including untracked files. Require a clean
   worktree; otherwise stop and report the exact paths. Never stash, discard, reset,
   clean, or overwrite them.
4. Switch to `main`, follow repository remote policy, and run:

   ```bash
   git fetch origin main
   git pull --ff-only origin main
   ```

5. Require `HEAD` to equal `refs/remotes/origin/main` exactly. Stop if synchronization
   or authentication is unsafe or incomplete.

## 2. Select one authoritative item

Read the authoritative TODO or equivalent work list plus only the owning documents
needed to establish priority, dependencies, and observable completion. Query a
committed subsystem graph first when repository instructions require it, then confirm
against source.

Select the explicitly designated next action, otherwise the first incomplete,
unblocked item in the active milestone. Choose one coherent branch-sized slice; do
not invent work, skip ahead for convenience, or process multiple items. If selection
or acceptance behavior remains materially ambiguous, ask one grouped clarification
and stop.

## 3. Always run Autoplan

List workflows, confirm `autoplan` is available, and start it exactly once with:

- `problem`: the selected TODO item and observable end state;
- `scope`: the current repository and affected systems, with explicit exclusions;
- `constraints`: all user and repository constraints.

Do not edit files or create a branch before approval. When Autoplan completes, read
its persisted ready result and present its exact `.plan` field for approval; retain
the result status and digest as provenance rather than treating the whole result
envelope as the plan. Identify the selected item and ask one explicit approval
question with these choices:

- **Approve and implement (Recommended)** — execute the plan with Autoimplement;
- **Revise the plan** — rerun Autoplan with `previousPlan` and the user's
  `newEvidence`;
- **Choose another item** — return to authoritative selection and Autoplan; or
- **Stop here** — leave synchronized `main` unchanged.

The user's approval response is the continuation turn. Do not require a separate
`continue` command and do not start Autoimplement without explicit approval.

## 4. Prepare the approved branch

After approval, repeat the complete latest-main synchronization and revalidate the
item and accepted plan against current authority. If either changed materially,
return to Autoplan and request approval again.

Before creating work, inspect open pull requests and remote branches enough to avoid
duplicating the selected item. Stop and report matching active work rather than
claiming it twice.

Derive one short repository-compliant branch name, create that new branch directly
from the exact updated `main`, and verify the clean worktree is on it. Autoimplement
must not create another branch or make task changes on `main`.

## 5. Run Autoimplement

Confirm `autoimplement` is available and start it exactly once with:

- `task`: the selected item and approved observable end state;
- `plan`: the exact approved `.plan` field from the persisted Autoplan result;
- `repository`: the absolute repository path;
- `scope`: permit only task-related edits, tests, commits, pushing the prepared
  branch, and opening or updating its single pull request; require that pull request
  to finish non-draft and ready for review; forbid additional branches, unrelated
  repositories, merge, release, deployment, credential changes, and policy changes;
- `constraints`: all user and repository constraints;
- `baseBranch`: `main`;
- `merge`: `false`;
- `approval`: `{ "mode": "required" }`, so any material plan revision discovered
  during implementation returns to the user rather than silently replacing the
  approved plan;
- `documents`: the authoritative TODO and relevant canonical document paths.

Do not otherwise duplicate or override Autoimplement's native Autodoc,
implementation, validation, review, review-comment, CI, publication, or finalization
stages.

## 6. Finish

Accept completion only when Autoimplement leaves exactly one current, non-draft pull
request ready for review on the prepared branch and does not merge it. Report the
selected item, accepted plan, branch, pull request, validation and CI state, and any
remaining blocker or risk.
