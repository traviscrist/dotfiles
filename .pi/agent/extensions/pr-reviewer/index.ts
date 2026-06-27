import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const WORKFLOW_PROMPT = String.raw`Run PR Reviewer for this repository.

Input from /pr-reviewer:
{{ARGS}}

This is a review-only workflow. Do not modify files, push, reply to GitHub, resolve comments, or mark anything complete. Use evidence from the PR diff, repository files, and the associated Linear issue when one is cited.

Workflow:

1. Identify PR
   - If input includes a PR number or URL, use that PR.
   - Otherwise use the active PR:
     gh pr view --json number,title,url,headRefName,baseRefName,body,reviewDecision,statusCheckRollup
   - If no PR is available, stop and ask Travis for the PR number.
   - Use gh, not browser URLs, for GitHub PR data.

2. Snapshot review scope
   - Run git status/diff/log checks.
   - Inspect the PR diff against its base branch using gh pr diff and/or git diff base...HEAD.
   - Do not overwrite or revert unrelated local changes.

3. Find the associated Linear issue, if cited
   - Look for Linear issue keys like ABC-123 in PR title, body, branch name, commit messages, and linked references.
   - If no Linear issue is cited, continue without Linear context. Do not stop or ask for one solely because it is absent; use the PR title, body, commits, diff, tests, and repository context as the functional-review source.
   - If multiple Linear issues are referenced, include all that appear directly relevant.
   - When a Linear issue is cited, retrieve the Linear issue title, description, issue text as acceptance criteria, comments, labels/status if tooling or links make that accessible.
   - If a cited Linear issue cannot be fetched, ask Travis for the Linear issue text or a reachable issue link only if PR context is insufficient to judge functionality. Otherwise continue and clearly mark Linear confidence as limited. Do not pretend PR text is the full Linear requirement source.

4. Functional requirements review
   - Use the existing code review workflow/tooling through pi-subagents: call subagent({ action: "list" }) first, then launch fresh-context reviewer subagent(s) only from executable agents.
   - Give the reviewer the Linear issue details when present, otherwise the PR title/body/commits as the functional context, plus PR metadata, base/head context, and explicit instruction to inspect the diff and repository files directly.
   - Review question: does the code fully satisfy every functional requirement from the Linear issue when cited, otherwise from the PR description and apparent change intent, without narrowing scope, missing edge cases, or breaking existing behavior?
   - Require evidence-backed findings with file/line references.
   - Review-only: subagents must not edit files.

5. Simplicity / duplication / efficiency review
   - Run a second fresh-context reviewer pass focused on:
     - simplicity and maintainability
     - duplicated logic or unnecessary abstractions
     - inefficient loops or avoidable repeated work
     - brittle data flow, unclear names, over-broad changes, or avoidable complexity
   - Require evidence-backed findings with file/line references and smallest practical improvement.
   - Review-only: subagents must not edit files.

6. Readability scoring
   - Run a fresh-context reviewer or delegate to score code readability from 0 to 100, where 100 is amazing.
   - The score must consider naming, structure, locality, cognitive load, comments, tests as documentation, and consistency with project patterns.
   - Include 3-5 concise reasons for the score and the highest-leverage improvement that would raise it.
   - Review-only: no edits.

7. Synthesis
   - Inspect reviewer outputs yourself before finalizing.
   - Do not blindly accept every reviewer suggestion; separate blockers from optional polish.
   - If a reviewer lacks evidence, discount it.
   - If no Linear issue was cited, say that clearly and base functionality findings on PR context. If a cited Linear issue was inaccessible, say that clearly and mark Linear-specific confidence as limited.

Final response must use exactly these headings:

## Functionality
Did the PR meet all cited Linear requirements, or if no Linear issue was cited, the PR-described functional requirements? List each requirement as met / missing / unclear. For any missing or unclear item, cite evidence and file/line references when possible.

## Code Readability
Give the 0-100 readability score, short rationale, and highest-leverage readability improvement.

## Code Review Feedback
List things to possibly bring to the engineer who wrote the code. Group by priority. Keep optional polish separate from required fixes.

## Show Stoppers
List bugs or requirement gaps that must be fixed before merge. If none, say "None found" and include confidence/limitations.

## TLDR Summary
Explain how the new code works and how it solves the cited Linear issue, or if no Linear issue was cited, the PR's stated problem, in concise product/engineering language.
`;

function buildPrompt(args: string): string {
	const normalizedArgs = args.trim() || "<none; use active PR>";
	return WORKFLOW_PROMPT.replace("{{ARGS}}", normalizedArgs);
}

function sendPrReviewerWorkflow(pi: ExtensionAPI, ctx: ExtensionContext, args: string): void {
	const prompt = buildPrompt(args);

	if (ctx.isIdle()) {
		pi.sendUserMessage(prompt);
		return;
	}

	pi.sendUserMessage(prompt, { deliverAs: "followUp" });
	ctx.ui.notify("PR Reviewer queued", "info");
}

export default function (pi: ExtensionAPI) {
	pi.registerCommand("pr-reviewer", {
		description: "Review a PR against cited Linear or PR context, simplicity, readability, and show-stoppers",
		handler: async (args, ctx) => sendPrReviewerWorkflow(pi, ctx, args),
	});
}
