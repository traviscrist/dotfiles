---
name: alex-branch-review
description: Run a branch-vs-main risk review using explorer and reviewer agents. Use when the user asks for /alex, Alex review, branch review before PR, or pre-PR risk review.
---

# Alex Branch Review

Review the current branch against main before PR opening.

## Workflow

1. Compare the branch to main with safe git commands.
2. Use the `explorer` agent to map affected code paths and execution flow.
3. Use the `reviewer` agent to find correctness, security, regression, and missing-test risks.
4. Lead with concrete findings ordered by severity.
5. Include file references, symbols, and reproduction steps where possible.
6. Avoid style-only comments unless they hide a real bug.

## Output

Report findings first. If no issues, say that clearly and list residual test gaps or risk.
