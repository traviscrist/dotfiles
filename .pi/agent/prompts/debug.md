---
description: Root-cause a bug from context, Linear, Sentry, logs, or symptoms using parallel subagent investigation
argument-hint: "<issue context|Linear key|Sentry URL|symptom>"
---

Debug target:
$@

Run a read-only root-cause investigation. Do not edit files, commit, push, open PRs, or apply fixes unless Travis explicitly asks after the debug summary.

## When to use other commands instead

- Use `/debug` when the goal is diagnosis, root cause, commit archaeology, and a recommended fix.
- Use `/pr-reviewer` when the target is a PR and the question is whether it satisfies a Linear issue.
- Use `/goal-swarm` after Travis approves implementing the fix.
- Use `/yolo` only when Travis wants clarify → implement → review → PR end-to-end.

## 1. Understand the input

1. Identify whether `$@` is:
   - pasted error/log/context
   - Linear issue key or URL
   - Sentry issue/event URL
   - PR/commit/file reference
   - freeform symptom
2. If the target is a Linear issue, fetch or reconstruct the issue text if possible. Treat the issue text as expected behavior/context, not proof of root cause.
3. If the target is a Sentry issue, fetch the event details if available through installed tooling or provided links/context:
   - exception type and message
   - stack trace
   - affected release/environment
   - breadcrumbs/tags/user impact
   - first seen / last seen
   - suspect commits if available
   If Sentry details are inaccessible, ask Travis for the event payload, stack trace, or screenshots before pretending to know the runtime failure.
4. If the target lacks enough detail to distinguish symptoms, ask concise clarification questions before launching a broad investigation.

## 2. Safety and baseline

Run safe read-only checks:

- `git status --short --branch`
- identify current branch, base branch, and recent relevant commits if needed
- inspect relevant files, tests, docs, logs, and config

Do not checkout, reset, clean, stash, or modify files. If a command would mutate state, do not run it.

## 3. Parallel investigation

Call `subagent({ action: "list" })` first and use only executable, non-disabled agents.

Launch fresh-context, read-only subagents from multiple angles. Prefer 3-5 strong angles over vague fanout. Suggested angles:

1. Code path tracer
   - Trace the failing request/job/UI path from entrypoint to failure.
   - Identify exact files/functions likely involved.
   - Return evidence with file/line references.

2. Data/state/contracts analyst
   - Inspect schemas, DTOs, validation, feature flags, env/config, migrations, and external provider assumptions.
   - Look for shape mismatches, missing null handling, race/idempotency gaps, and privacy/security boundary issues.

3. Reproduction and test-gap analyst
   - Infer minimal reproduction from logs/Linear/Sentry/context.
   - Find existing tests that should catch it and why they do or do not.
   - Suggest the smallest regression test once a fix is approved.

4. Commit archaeology analyst
   - Use `git log`, `git blame`, `git diff`, `git log -S`, and `git log -G` on relevant files/symbols.
   - Identify whether the issue can be traced to a specific commit.
   - Cite commit hash, title, date, and evidence. If not traceable, explain why.

5. Hypothesis falsifier
   - Challenge the leading theory.
   - Look for alternative causes and evidence that rules them in/out.

All subagents must be review-only: do not modify project/source files. Returning findings through output artifacts is allowed.

## 4. Parent synthesis

After subagents return:

1. Read relevant artifacts/results.
2. Inspect key files and commit history yourself to verify the strongest claims.
3. Build a root-cause chain:
   - symptom
   - failing code path
   - bad assumption/data/state
   - triggering condition
   - why existing tests/validation missed it
4. Separate facts from hypotheses. Mark confidence clearly.
5. Do not recommend a broad rewrite if a smaller targeted fix addresses the root cause.

## 5. Final response

Use exactly these headings:

## What is the issue?
State the user-visible/runtime issue, affected path, and triggering conditions. Include Sentry/Linear/log context if available.

## Why is it happening?
Explain the root cause chain with file/function references and evidence. Include confidence level and any ruled-out alternatives.

## Can it be traced back to a specific commit?
Answer yes/no/unclear. If yes, cite commit hash, title, date, and why it introduced the issue. If no/unclear, explain what evidence was checked and what would be needed to prove it.

## What's the best way to resolve the issue?
Recommend the smallest safe fix, any needed regression test, validation commands, risk areas, and whether this should proceed via `/goal-swarm` or `/yolo`.
