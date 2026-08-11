---
description: Implement a task to local shippable quality with one writer, validation, and review
argument-hint: "<task>"
---

Ship task:
$@

Treat this `/ship` invocation as Travis's explicit request to implement the task to a locally shippable state. Do not commit, push, open a PR, or merge unless Travis explicitly asked for that in `$@`.

`/ship` defines the completion contract, inspects context, implements with one writer, validates, reviews, fixes blockers, and audits completion evidence.

## 1. Preflight

1. Run `git status --short --branch`.
2. Identify current branch/upstream and unrelated local changes.
3. If unrelated changes conflict with the task, stop and ask Travis.
4. Read repo instructions and relevant docs/TODO before coding.
5. If the task is ambiguous enough that success cannot be verified, ask concise blocking questions. Otherwise state assumptions and proceed.

## 2. Completion contract

Before implementation, write a concise acceptance checklist covering:

- the requested outcome/end state
- preservation of existing behavior unless explicitly changed
- focused tests/checks/docs updates where relevant
- no unapproved shortcuts, dead code, duplicated logic, TODO placeholders, or hidden assumptions
- fresh evidence before completion
- a requirement-by-requirement completion audit
- blocked-stop reporting if access, tools, or decisions are missing

## 3. Context and plan

Use the smallest useful amount of delegation:

- Simple/small task: parent reads code and writes a short validation contract directly. No subagents required.
- Medium/risky task: call `subagent({ action: "list" })`, then run at most two read-only fresh-context helpers:
  - `scout` for local code context
  - `reviewer` for risk/pre-review
    Omit `acceptance` for read-only helpers.
- External/current docs task: add one `researcher` only when official/current outside evidence materially changes the implementation.

Do not launch a planner subagent by default. Parent owns the implementation plan.

Before coding, state:

- acceptance criteria
- files/areas likely touched
- validation commands/checks
- risks or assumptions

## 4. Implement

Use one writer in the active worktree.

Options:

- Parent writes directly for small changes.
- For larger changes, launch exactly one `worker` with `acceptance: "checked"` and a task containing the plan, validation contract, and output expectations.

Worker/parent implementation rules:

- Do not launch subagents from the worker.
- Read before editing.
- Keep changes scoped.
- Add/update tests for behavior changes when practical.
- Update docs/TODO when behavior/API/infra/product decisions change.
- Stop for product/security/destructive decisions.

## 5. Validate

Run focused validation first, then broader gates when practical:

- lint/format/typecheck/tests/docs commands from repo instructions
- focused tests for touched behavior
- UI/API/manual smoke evidence when tests cannot prove the user flow

If validation fails, inspect, fix, and rerun. Do not stop at partial progress unless blocked.

## 6. Review

For non-trivial diffs, run fresh read-only review after implementation:

- correctness/regressions
- tests/validation coverage
- simplicity/maintainability

Omit `acceptance` for read-only reviewers; reviewers must not edit files. Parent synthesizes findings. Fix show-stoppers with one writer, then rerun relevant validation/review.

Skip reviewer fanout for tiny, low-risk changes after stating why.

## 7. Completion audit

Before calling the task complete:

1. Inspect final `git status` and `git diff`.
2. Map every acceptance requirement to concrete evidence from files, commands, tests, docs, screenshots, logs, or artifacts.
3. If anything is unverified, deferred, or blocked, report it explicitly and do not claim completion.

## 8. Final response

Use these headings:

## TLDR

What changed and why.

## Changes

Files/areas changed.

## Validation

Commands/checks and results.

## Review

Reviewer findings or why review was skipped.

## Completion Audit

Requirement → evidence mapping. If incomplete, list blockers instead.

## Remaining Risk

Only real residual risk, not generic caveats.
