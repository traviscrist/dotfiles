import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const WORKFLOW_PROMPT = String.raw`Run PR Reviewer for this repository.

Input from /pr-reviewer:
{{ARGS}}

This is a review-only workflow. Do not modify files, push, reply to GitHub, resolve comments, or mark anything complete. Use evidence from the PR diff, repository files, and the associated Linear issue.

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

3. Find the associated Linear issue
   - Look for Linear issue keys like ABC-123 in PR title, body, branch name, commit messages, and linked references.
   - If multiple Linear issues are referenced, include all that appear directly relevant.
   - Retrieve the Linear issue title, description, acceptance criteria, comments, labels/status if tooling or links make that accessible.
   - If Linear details are not accessible from available tools, stop before functional judgment and ask Travis for the Linear issue text or a reachable issue link. Do not pretend PR text is the full Linear requirement source.

4. Functional requirements review
   - Use the existing code review workflow/tooling through pi-subagents: call subagent({ action: "list" }) first, then launch fresh-context reviewer subagent(s) only from executable agents.
   - Give the reviewer the Linear issue details, PR metadata, base/head context, and explicit instruction to inspect the diff and repository files directly.
   - Review question: does the code fully satisfy every functional requirement from Linear without narrowing scope, missing edge cases, or breaking existing behavior?
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
   - If Linear context was incomplete, say that clearly and mark functional confidence as blocked/limited.

Final response must use exactly these headings:

## Functionality
Did the PR meet all Linear functional requirements? List each requirement as met / missing / unclear. For any missing or unclear item, cite evidence and file/line references when possible.

## Code Readability
Give the 0-100 readability score, short rationale, and highest-leverage readability improvement.

## Code Review Feedback
List things to possibly bring to the engineer who wrote the code. Group by priority. Keep optional polish separate from required fixes.

## Show Stoppers
List bugs or requirement gaps that must be fixed before merge. If none, say "None found" and include confidence/limitations.

## TLDR Summary
Explain how the new code works and how it solves the Linear issue, in concise product/engineering language.
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
		description: "Review a PR against its Linear issue, simplicity, readability, and show-stoppers",
		handler: async (args, ctx) => sendPrReviewerWorkflow(pi, ctx, args),
	});
}
