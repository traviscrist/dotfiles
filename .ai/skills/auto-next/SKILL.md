---
name: auto-next
description: Select the next authoritative unblocked TODO item from the latest main branch, obtain a clear plan when needed, then run Autoimplement for that one focused item. Invoke explicitly with /skill:auto-next.
compatibility: Requires Git, a repository with a main branch, Pi Workflows, and the built-in autoplan and autoimplement workflows.
disable-model-invocation: true
---

# Auto Next

Use this skill to select and implement one authoritative next project item. Keep one
item, branch, and pull request per invocation.

Invoking `/skill:auto-next` grants permission to synchronize `main`, inspect project
authority, select one item, and start the applicable workflow. It does not grant
permission to discard work, merge, deploy, release, change credentials, modify
unrelated repositories, or override repository policy.

Optional arguments are focus hints. They never override the authoritative work list,
active milestone, dependencies, or repository instructions.

## 1. Synchronize from latest main

Always complete this preflight before selecting work:

1. Read all applicable repository instructions.
2. Run `git status --short --branch` and include untracked files.
3. Require a clean working tree. If dirty, stop and report the exact paths. Never
   stash, discard, reset, clean, or overwrite them.
4. Switch to `main` when needed.
5. Follow the repository's remote policy, then run:

   ```bash
   git fetch origin main
   git pull --ff-only origin main
   ```

6. Require `git rev-parse HEAD` to exactly equal
   `git rev-parse refs/remotes/origin/main`. An ahead local `main` is not an
   authoritative starting point.
7. Inspect recent relevant commits.

Never select or implement from a stale or locally augmented `main`. Stop if `main` is
unavailable, the pull cannot fast-forward, local and remote `main` differ,
authentication fails, or synchronization is otherwise unsafe.

## 2. Discover one authoritative next item

Use the smallest bounded discovery funnel that proves priority and readiness:

1. Run the repository's documentation-list command when available.
2. Read `TODO.md` or the repository's equivalent authoritative work list.
3. Read the owning roadmap, milestone, architecture, and behavior documents named by
   repository instructions or `read_when` guidance.
4. Query the committed graph for only the affected subsystem when one exists, then
   confirm conclusions against source.
5. Inspect enough source and recent history to prove the item is not already complete.
6. Select, in order:
   - an explicitly designated next action;
   - otherwise the first incomplete, unblocked listed item in the active milestone.

Choose one listed item or one clearly listed sub-item that is reviewable, testable,
and suitable for one focused branch and pull request. Do not invent an unlisted
prerequisite, process the entire TODO list, or skip an item merely because a later
item is easier or more interesting. If the designated item requires an unlisted
prerequisite, stop for authorization to add or select that prerequisite.

If authority, ordering, scope, dependencies, or acceptance behavior remain materially
ambiguous, ask one grouped clarification and stop selection until answered.

## 3. Determine whether a clear plan exists

A TODO checkbox alone is not necessarily a plan. A clear plan must identify:

- the observable end state and acceptance criteria;
- relevant behavior and ownership boundaries;
- the intended implementation direction;
- important constraints and exclusions;
- affected canonical documents or interfaces; and
- meaningful verification.

Find the plan in the selected TODO entry, current conversation, or canonical project
documents. Preserve exact document paths and requirements.

### Clear plan found

Proceed to **Synchronize again before implementation**, then start Autoimplement.

### No clear plan found

Start the built-in `autoplan` workflow once with complete input:

- `problem`: the exact selected TODO item and observable completion state;
- `scope`: the current repository, affected systems, and explicit exclusions;
- `constraints`: all user and repository constraints;
- omit revision fields unless revising an existing plan from new evidence.

Do not invent an initial plan inside Autoimplement. Do not start another workflow
while Autoplan is active.

Record the Autoplan run ID and preserve its exact accepted final output. After its
normal result presentation completes, report the selected item and ask the user to
run:

```text
/skill:auto-next continue
```

The explicit continuation is required for a skill-only design: Autoplan queues one
presentation turn, Pi rejects another workflow start until that response settles, and
presentation cannot route or schedule more work. No further assistant turn is created
after settlement. On continuation, read the persisted Autoplan result by run ID; never
reconstruct the plan from its prose presentation.

Autoimplement will record or update canonical documentation through its native
Autodoc path when the supplied plan lacks a current-document receipt; do not run a
separate standalone Autodoc workflow.

## 4. Synchronize again before implementation

Immediately before starting Autoimplement—including after an Autoplan continuation—
repeat the complete latest-`main` synchronization preflight.

Then re-read the relevant TODO section and verify that:

- the selected item remains incomplete and unblocked;
- no newer `main` change completed, superseded, or materially changed it; and
- the plan still matches current authority and source.

If the item changed materially, do not implement the stale plan. Return to discovery
and planning.

After revalidation, inspect matching remote branches and open pull requests before
changing branches. Autoimplement and its native Autodoc path must never make task
changes directly on `main`.

- If no matching work exists, derive a short repository-compliant task branch name,
  create it from the exact updated `main`, and verify the clean worktree is on it.
- If a matching active pull request or remote branch exists, do not create duplicate
  work. Treat the item as claimed and return to discovery, unless repository policy
  clearly requires continuing that exact branch. In that case, switch to the exact
  branch, verify it is clean and correctly tracks its remote, and preserve the
  existing pull request. Require
  `git merge-base --is-ancestor refs/remotes/origin/main HEAD` to succeed. If the
  branch does not contain latest `origin/main`, stop and report; never merge, rebase,
  or force-push without separate authorization.

Record the exact prepared branch name. Stop if branch ownership, worktree state, or
whether existing work matches the item is unclear.

## 5. Start Autoimplement

List workflows and confirm `autoimplement` is available. Build one complete input:

- `task`: quote or precisely identify the selected TODO item and end state;
- `plan`: pass the complete existing or Autoplan-selected plan;
- `repository`: absolute repository path;
- `scope`: name and permit only the already prepared task branch, task-related edits,
  tests, commits, pushes, and opening or updating its repository-required pull
  request; explicitly forbid additional branch creation, unrelated repositories,
  merge, release, deployment, credential changes, and policy changes unless
  separately authorized;
- `constraints`: all user and repository constraints;
- `baseBranch`: `main`;
- `merge`: `false` unless explicit authority says otherwise;
- `documents`: every relevant canonical TODO, plan, architecture, and behavior path.

Omit `approval` unless the user explicitly requires or skips approval for later plan
changes. Do not duplicate implementation, Autodoc, review, pull-request, or CI stages
owned by Autoimplement.

Start `autoimplement` exactly once. While it runs, follow each exact step and attempt
contract. Never start a second workflow from an active workflow step.

## 6. Completion requirements

Autoimplement must:

- implement only the selected coherent slice;
- add regression or deterministic coverage when behavior changes;
- update the authoritative TODO and owning documentation as progress changes;
- run focused checks and every repository-required pre-publish gate;
- inspect final status and diff;
- commit and push only intentional files;
- open or update the repository-required pull request;
- complete its review and CI loop; and
- leave merge, release, and deployment undone unless separately authorized.

Finish with the selected TODO item, plan source, branch, pull request, validation,
CI state, and residual risks.
