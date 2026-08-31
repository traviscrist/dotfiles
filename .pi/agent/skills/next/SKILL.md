---
name: next
description: Discover the next authoritative shippable project goal, decompose an oversized TODO goal when needed, present the plan for approval, then implement, QA, validate, commit, and open a ready-for-review PR.
disable-model-invocation: true
---

# Next Shippable Project Goal

The `/next` wrapper has already opened a fresh session. Do not create another
session.

Invoking `/next` grants permission to:

- switch from a clean working tree to `main`
- fast-forward local `main`
- discover and propose the smallest independently shippable goal
- propose markable shippable subgoals when the authoritative TODO goal is too broad
- after explicit plan approval, create a task branch and implement the goal
- commit and push the approved goal
- open a ready-for-review pull request
- inspect and triage all review feedback after the pull request opens
- after a second explicit approval, address only the approved review-feedback plan

It does not grant permission to implement before initial approval, address review
feedback before post-PR plan approval, merge, use admin privileges, discard work,
reset, clean, or overwrite unrelated changes.

## 1. Synchronize

1. Use the repository instructions Pi already loaded. Do not reread `AGENTS.md`
   unless Pi did not load it or it changed after session start.
2. Run `git status --short --branch`.
3. Require a clean working tree, including untracked files.
4. If dirty, stop and report the exact paths. Never stash or discard them.
5. Switch to `main` when needed.
6. Run `git pull --ff-only origin main`.
7. Verify GitHub CLI authentication and repository access.
8. Inspect status and recent relevant commits.

Stop if any synchronization step cannot complete safely.

## 2. Discover the next shippable goal

Use this bounded funnel and stop as soon as authority, shippable scope, and QA are
clear:

1. Run the repository's documentation-list command when available.
2. Read `TODO.md` or the repository's equivalent authoritative work list.
3. Read only the owning roadmap, milestone, architecture, or operations documents
   identified by repository instructions and `read_when` guidance.
4. Query only the committed graph for the affected subsystem when one exists, then
   confirm the relevant conclusion against source.
5. Inspect only enough recent history to prove the work is not already complete.
6. Prefer, in order:
   - an explicitly named next shippable goal
   - the first unblocked shippable checkbox in the active milestone
   - the first shippable subgoal produced by decomposing the highest-priority
     oversized TODO goal
7. Treat a missing prerequisite as the selected goal only when it is independently
   shippable and QA-able; never select scaffolding solely because it is small.
8. Treat optional `/next` arguments as a focus hint, not permission to ignore
   authoritative project priorities.

A shippable goal must:

- deliver one coherent user-visible, operator-visible, or developer-usable outcome
- be complete and safe to release without a knowingly unfinished behavior path
- have a reproducible end-to-end QA procedure with concrete actions and expected
  results; non-UI work may use an operator command or deployed readback
- fit one focused pull request
- map to one checkbox that can be marked complete in `TODO.md` or the repository's
  authoritative equivalent

Do not query unrelated subsystem graphs, disabled or non-authoritative issue
trackers, broad history, or extra documentation unless the bounded funnel leaves a
material ambiguity. More reading after the next shippable goal is proven is waste,
not extra confidence.

## 3. Clarify uncertainty

Before selecting the goal, identify anything unclear about:

- which next shippable goal has authority
- intended behavior, acceptance criteria, or end-to-end QA
- product, privacy, security, or architecture decisions
- affected environment or surface
- whether multiple shippable goals have equal priority
- whether a broad TODO goal can be decomposed without inventing product scope

If anything is unclear, ask the user before proceeding. Group all blocking
questions into one structured `ask_user_question` call when available.

Do not invent requirements or silently choose between materially different
options. Continue to planning only after every blocking ambiguity is resolved.

## 4. Select, decompose, name, and plan

Choose the smallest shippable goal that:

- advances the authoritative TODO goal
- delivers one complete outcome rather than an internal layer or scaffolding fragment
- has a concrete end-to-end QA path with observable expected results
- preserves existing behavior
- avoids speculative infrastructure and broad refactors
- fits into one focused pull request
- requires no unresolved decision

If the authoritative TODO goal does not fit that definition, decompose it in the
plan into ordered nested checkbox subgoals. Each subgoal must be independently
shippable and QA-able, dependencies must be explicit, and the set must fully cover
the parent goal without silently narrowing it. Select the first unblocked subgoal.
Do not edit `TODO.md` until the user approves the plan.

Start the approval-plan response with exactly one machine-readable line:

`NEXT_SESSION_NAME: <short task title>`

The `/next` extension uses that line to rename the session automatically. Emit an
updated line if user feedback changes the selected goal.

Outline:

- authoritative parent TODO goal and why it is next
- chosen smallest shippable goal and explicit exclusions
- exact proposed nested TODO checkboxes when decomposition is required
- completion criteria and end-to-end QA procedure
- proposed branch name
- likely files and ownership boundaries
- tests and validation gates
- risks, assumptions, and any deferred follow-up

Do not create a branch or edit files yet.

## 5. Request approval

Present the plan, then always ask for explicit approval with one structured
`ask_user_question` call. Offer:

- **Approve and implement (Recommended)** — create the branch and execute the plan
- **Revise the plan** — stop implementation and incorporate the user's feedback
- **Choose another goal** — return to discovery
- **Stop here** — leave the synchronized `main` worktree unchanged

If the user does not approve, do not implement. If feedback changes the plan or
selected goal, update the session name, present the revised plan, and request
approval again in a later turn.

## 6. Delegate sparingly

The parent is the only writer.

Subagents remain available but bounded:

- optionally one fresh-context scout or researcher when repository inspection
  cannot answer a material question
- optionally one fresh-context reviewer after focused validation for a non-trivial
  diff
- run the reviewer with `async:true`; use `subagent_wait` only when its result gates
  work in the current turn, and never status-poll
- after fixing a reviewer finding, resume that same retained reviewer once instead
  of launching another reviewer
- no worker subagent, forked context, fanout, nested delegation, or polling

If delegating, list executable agents first. Skip delegation for small, obvious
changes.

## 7. Implement and validate

Keep context lean throughout implementation:

- Read a known file directly. Do not use `grep` to search one exact absolute file.
- Scope every search. When inspecting `~/.pi` or another external tree, use tightly
  scoped `rg`/file reads and exclude sessions, workflows, caches, logs, and artifacts.
- Do not print a large whole-repository diff when a stat plus targeted diffs proves
  the change.
- Redirect repetitive long-running gate and CI-watch output to a `/tmp` log. On
  success, return a bounded final summary/readback. On failure, return the relevant
  tail and full log path.
- Run the required pre-publish gate once after final edits. Rerun it only when files
  change afterward.

Only after explicit approval:

1. Create the approved Conventional Commit-style task branch from updated `main`.
2. Implement the approved shippable goal; do not widen scope.
3. If decomposition was approved, add the exact nested checkboxes to `TODO.md` before
   recording progress; do not rewrite or narrow the parent goal.
4. Add focused regression coverage when behavior changes.
5. Execute the approved end-to-end QA procedure and record its observable result.
6. Mark only the selected shippable-goal checkbox complete after implementation and
   QA both succeed. Mark the parent complete only when all child goals are complete.
7. Update owning documentation when progress or behavior changes.
8. Run focused validation.
9. Inspect final status, diff, and diff check.
10. Run one focused review when warranted.
11. Fix show-stoppers and rerun affected focused validation.
12. Find the repository's **Required Pre-Publish Gate** section, when present, and
   run every command and check it declares before the first push. Focused tests do
   not replace that gate. If the repository uses another explicit name, follow its
   documented equivalent. Never inject ecosystem-specific commands into this
   generic workflow.
13. If anything changes after that gate, rerun the complete required pre-publish
    gate before publishing.

Do not publish partial, unapproved, or knowingly failing work.

## 8. Commit and publish

1. Stage only intentional files.
2. Commit using the repository's Conventional Commit rules and documented
   `committer` syntax.
3. Push the task branch.
4. Open a non-draft pull request targeting `main`.
5. Use a Conventional Commit PR title.
6. Include the shippable outcome, end-to-end QA steps/results, requirements,
   implementation, validation, review results, and residual risks in the PR body.
7. Confirm the PR is ready for review, not draft.
8. Run the repository-required final GitHub CI pass.
9. Fix attributable failures, push, and recheck until green or genuinely blocked.
10. Never merge the PR.

## 9. Check review feedback and request approval

After the pull request opens and the required final CI pass settles:

1. Fetch the current PR reviews, review summaries, inline review comments, issue
   comments containing review feedback, and unresolved review threads with `gh`.
2. Do not sleep or poll solely waiting for feedback. If no review feedback exists,
   say so explicitly and continue to the handoff.
3. Filter only obvious lifecycle noise, generated summaries/diagrams, and approvals
   with no request. Keep every substantive item, including feedback that should not
   be fixed.
4. Deduplicate repeated comments and compare each item against the current pushed
   code before recommending action.
5. Present a concise numbered review plan. For every substantive item include:
   - author and path/line when present
   - one-sentence request
   - recommended disposition: `fix`, `already_fixed`, `explain`, `wont_fix`, or
     `needs_travis`
   - whether to fix it and why
   - effort/risk: `small`, `medium`, or `large`
   - proposed implementation or reply evidence
6. Group recommended fixes into the smallest coherent plan. Call out product,
   security, architecture, destructive, or scope-expanding decisions separately.
7. Ask for explicit approval with one structured `ask_user_question` call. Offer:
   - **Approve recommended review plan (Recommended)** — address only the proposed
     items
   - **Revise the review plan** — incorporate feedback and ask again later
   - **Choose comment numbers** — let the user provide an explicit subset
   - **Defer review feedback** — make no review-driven changes
8. Stop after asking. Do not edit, test, commit, push, post replies, resolve threads,
   or request re-review before the user approves the displayed review plan.

After approval:

1. Re-fetch the approved comments to detect stale positions or new replies.
2. Address only approved items; prepare evidence-backed replies for `already_fixed`,
   `explain`, and `wont_fix` dispositions.
3. Run focused validation, then rerun the complete repository-required pre-publish
   gate because files changed after its previous successful run.
4. Show the resulting diff, validation, and reply evidence before publishing only
   when the approved plan materially changed during implementation; ask again if it
   did.
5. Commit and push only approved fixes, reply to every approved substantive item,
   and resolve only fully addressed threads after pushed evidence exists.
6. Request one fresh review pass from each relevant reviewer after replies are posted.
7. Run the final GitHub CI pass again. Fix only failures attributable to the approved
   changes; stop and ask before widening scope.
8. Re-check review feedback once. Surface any new substantive item through another
   numbered plan and approval cycle rather than addressing it silently.

## 10. Summarize and hand off

End with a concise handoff containing:

- **TL;DR** — a high-level summary of what changed, the user-visible or operational
  outcome, and why it matters. Describe the completed result, not a file-by-file
  changelog.
- **How to QA** — the reproducible end-to-end procedure that proves the shippable
  goal. Include setup, exact commands or navigation, inputs/actions, and observable
  expected results. For non-UI work, provide an operator command or deployed readback;
  automated tests alone do not replace QA.
- **Delivery** — PR link, branch, commit, CI state, and any remaining risk.
- **Suggested next shippable goals** — up to three authoritative QA-able candidates,
  ordered by priority. Label the first candidate **Recommended** and state whether it
  is independently shippable or blocked on the current PR merging.

Write the QA steps for the user performing them after checkout or deployment; do not
merely repeat tests already run by the agent.

End with exactly one machine-readable line for the recommended candidate:

`NEXT_CHAIN: {"version":1,"title":"<short task title>","prompt":"<concise imperative focus for the next discovery session>","prerequisite":"<optional prerequisite>"}`

Keep the JSON on one line with valid double-quoted JSON. Omit `prerequisite` when the
candidate is independently shippable. The title must be at most 72 characters, the
prompt at most 1,000 characters, and the optional prerequisite at most 500
characters. Do not emit placeholders. If no safe next shippable goal can be
recommended, say why under **Suggested next shippable goals** and end with
`NEXT_CHAIN: null` so the extension withdraws any older recommendation.

The extension stores this recommendation durably. When the user later types exact
plain `next`, it opens a fresh child session with the recommendation as a focus hint.
That new session must still synchronize, revalidate authority, shippability, QA, and
prerequisites, plan, and obtain explicit approval before implementation.
