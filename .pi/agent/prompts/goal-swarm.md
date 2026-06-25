---
description: Create a durable goal and run a safe subagent swarm workflow
argument-hint: "<task>"
---

User task:
$@

Treat this prompt invocation as Travis's explicit request to create or replace the current durable pi-codex-goal for this task and start a subagent-backed execution workflow.

## 1. Create the goal

Convert the user task into one strict pi-codex-goal completion contract, then call `create_goal` with `replace_existing: true`.

The goal must preserve the user's full intent and require:

- concrete outcome/end state
- fresh verification evidence before completion
- preservation of existing behavior unless explicitly changed
- no unapproved shortcuts, TODO placeholders, dead code, duplicated logic, or hidden assumptions
- iteration after failed validation instead of stopping at partial progress
- a completion audit mapping every requirement to evidence
- blocked-stop reporting without marking the goal complete when access, tools, budget, or decisions are missing

Do not set a token budget unless the user explicitly provided one.

## 2. Launch the swarm

Before launching subagents, call `subagent({ action: "list" })` and use only executable, non-disabled agents.

Default workflow: one writer, parallel readers/reviewers. Use `async: true` and `clarify: false` so the parent session remains responsive.

Launch a `pi-subagents` chain shaped like this unless the task is clearly review/research-only:

```ts
subagent({
  async: true,
  clarify: false,
  context: "fresh",
  chain: [
    {
      phase: "Context",
      label: "Scout and risk review",
      parallel: [
        {
          agent: "scout",
          as: "scoutContext",
          model: "openai-codex/gpt-5.3-codex-spark",
          task: "Map the relevant files, flows, tests, docs, constraints, and risks for this task. Do not modify project/source files. Return concise handoff context with likely validation commands. Task: $@",
          output: "goal-swarm/scout-context.md",
          outputMode: "file-only"
        },
        {
          agent: "reviewer",
          as: "riskReview",
          model: "openai-codex/gpt-5.3-codex-spark",
          task: "Pre-review this task for likely correctness, regression, privacy/security, and validation pitfalls. Do not modify project/source files. Return concrete risks and checks. Task: $@",
          output: "goal-swarm/risk-review.md",
          outputMode: "file-only"
        }
      ],
      concurrency: 2
    },
    {
      agent: "planner",
      phase: "Plan",
      label: "Implementation contract",
      as: "plan",
      task: "Create a concise implementation plan and validation contract from the scout and risk outputs. Preserve the user's full task. Identify any decisions that require Travis before writing.\n\nScout:\n{outputs.scoutContext}\n\nRisk review:\n{outputs.riskReview}",
      output: "goal-swarm/plan.md",
      outputMode: "file-only"
    },
    {
      agent: "worker",
      phase: "Implementation",
      label: "Sole writer",
      as: "workerResult",
      task: "Implement the approved plan as the sole writer in the active worktree. Do not launch subagents. Stop and report if product/scope/architecture decisions are needed. Run focused validation and report changed files, commands, exit codes, failures, and remaining issues.\n\nPlan:\n{outputs.plan}",
      output: "goal-swarm/worker-result.md",
      outputMode: "file-only",
      progress: true
    },
    {
      phase: "Validation",
      label: "Fresh review",
      parallel: [
        {
          agent: "reviewer",
          model: "openai-codex/gpt-5.3-codex-spark",
          task: "Validate the post-worker diff for correctness and regressions. Start from the worker result: {outputs.workerResult}. Inspect files directly. Do not modify project/source files; returning findings through this output artifact is allowed. Report blockers only with file/line evidence and smallest safe fix.",
          output: "goal-swarm/correctness-review.md",
          outputMode: "file-only"
        },
        {
          agent: "reviewer",
          model: "openai-codex/gpt-5.3-codex-spark",
          task: "Validate the post-worker diff for tests, docs, and acceptance evidence. Start from the worker result: {outputs.workerResult}. Inspect files directly. Do not modify project/source files; returning findings through this output artifact is allowed. Report missing validation or blockers only with concrete evidence.",
          output: "goal-swarm/validation-review.md",
          outputMode: "file-only"
        }
      ],
      concurrency: 2
    }
  ]
})
```

If the user explicitly asks for parallel implementation experiments or worktree isolation, use `worktree: true` only for a parallel writer step after confirming the git working tree is clean. Otherwise do not parallel-edit the active worktree.

For review-only or research-only tasks, skip the worker step and use parallel read-only reviewers/researchers, then synthesize findings in the parent session.

## 3. Parent responsibilities after swarm output

When the async workflow returns:

1. Read file-only artifacts needed for synthesis.
2. Apply only concrete blocker fixes worth doing now, using a single writer path.
3. Run or request the validation required by the goal.
4. Audit every goal requirement against fresh evidence.
5. Call `update_goal({ status: "complete" })` only when every requirement is verified and no required work remains.

If blocked, do not mark the goal complete. Report attempted paths, evidence gathered, exact blockers, remaining unmet requirements, and what would unblock progress.
