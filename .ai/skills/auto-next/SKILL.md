---
name: auto-next
description: Orchestrate one authoritative next project item through Autoplan approval, Autoimplement, and explicitly approved operational effects from a fresh session. Invoke with /auto-next; direct /skill:auto-next invocation cannot reset context.
compatibility: Requires Git, GitHub CLI, Pi Workflows, and the built-in autoplan and autoimplement workflows; operational work also requires repository-approved cloud and infrastructure tooling.
disable-model-invocation: true
---

# Auto Next

Use this skill only through `/auto-next`. The extension opens a fresh session and
appends `AUTO_NEXT_FRESH_SESSION: true` to the kickoff. If that marker is absent,
stop and ask the user to invoke `/auto-next`; a skill-only invocation cannot reset
context.

One invocation owns one authoritative TODO item, one approved plan, and one
coordinated change set. It may synchronize repositories, plan, implement, commit,
push, prepare one pull request per affected repository, and request approval for
merges and operational effects. It may not discard work, change credentials or
policy, bypass an approval gate, or modify unrelated repositories.

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
- `scope`: the primary repository, explicitly related repositories such as an owning
  infrastructure repository, affected environments and systems, and true exclusions;
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

Derive short repository-compliant branch names and prepare one clean branch or
worktree per affected repository directly from its exact updated base. Follow
repository-specific submodule and linked-worktree rules. Autoimplement must not create
additional branches or make task changes on a base branch.

## 5. Run Autoimplement

Confirm `autoimplement` is available and start it exactly once with:

- `task`: the selected item and approved observable end state;
- `plan`: the exact approved `.plan` field from the persisted Autoplan result;
- `repository`: the absolute primary repository path;
- `scope`: name every affected repository and environment; permit task-related edits,
  tests, commits, pushes, one pull request per prepared branch, and preparation of
  exact deployment, release, cutover, and Terraform plans; require pull requests to
  finish non-draft and ready for review; forbid additional branches, unrelated
  repositories, credentials, policy changes, and any merge or live effect before its
  post-Autoimplement approval checkpoint;
- `constraints`: all user and repository constraints, including environment-specific
  operational and human-ADC requirements;
- `baseBranch`: `main`;
- `merge`: `false` during Autoimplement;
- `approval`: `{ "mode": "required" }`, so any material plan revision discovered
  during implementation returns to the user rather than silently replacing the
  approved plan;
- `documents`: the authoritative TODO and relevant canonical document paths.

Do not otherwise duplicate or override Autoimplement's native Autodoc,
implementation, validation, review, review-comment, CI, publication, or finalization
stages.

## 6. Approve and execute effects

Every live deployment, release, cutover, infrastructure apply, or cloud
mutation—including an effect automatically triggered by a merge—requires its own
exact approval
checkpoint. For each effect separately:

1. Re-observe the target and prove repository prerequisites still hold.
2. Present the exact environment, command or workflow trigger, immutable artifact or
   saved-plan identity, expected mutation, verification, and material blast radius.
3. Ask for explicit approval of that exact effect.
4. Treat approval as single-use and target-bound. Any changed head, artifact, plan,
   environment, command, trigger, or material evidence invalidates it and requires
   approval again.
5. Execute or trigger only that approved effect, then verify its documented
   postconditions before requesting approval for the next effect.

For a merge-triggered effect, complete its separate effect checkpoint before asking
to merge and bind approval to the exact pull request, head SHA, workflow trigger,
artifact, and environment. Then process each pull request independently:

1. Re-observe that pull request's exact head, checks, merge state, dependencies, merge
   method, and already approved automatic effects.
2. Ask for a separate explicit approval to merge only that pull request and head SHA.
3. Treat merge approval as single-use. Any changed head, checks, merge state, merge
   method, dependency, or triggered effect invalidates both merge approval and any
   affected live-effect approval.
4. Merge only after its own approval. Never bundle approval for multiple pull
   requests. Verify every triggered effect before considering that merge complete.

If any approval is denied or absent, stop with the remaining ready pull requests and
unexecuted effects unchanged.

All environments are eligible only when the authoritative item and approved plan name
them. For Terraform, follow the owning repository's workflow: use human ADC where
required, apply only the exact reviewed saved plan, and never substitute a regenerated
or changed plan without another approval. Never expose or change credentials, bypass
GitHub Environment protection, use admin merge, or weaken policy.

## 7. Finish

Accept completion only when every approved repository and operational postcondition
for the selected item is verified. Report the selected item, accepted plan, branches,
pull requests, merges, exact approved effects, validation and CI state, operational
verification, and any remaining blocker or risk.
