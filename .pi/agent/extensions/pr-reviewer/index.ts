import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const WORKFLOW_PROMPT = String.raw`Run PR Reviewer for this repository.

Input from /pr-reviewer:
{{ARGS}}

This is a review-only workflow. Do not modify files, push, reply to GitHub, resolve comments, or mark anything complete. Use evidence from the PR diff, repository files, and the associated Linear issue when one is cited.

Core rules:
- Use gh, not browser URLs, for GitHub PR data.
- Use subagents only for read-only review.
- Pass acceptance: false or acceptance: "none" to read-only reviewer/delegate tasks.
- Use output: false unless an artifact is explicitly useful.
- Parent synthesizes; do not blindly repeat reviewer output.

Workflow:

1. Identify PR
   - If input includes a PR number or URL, use that PR.
   - Otherwise use the active PR:
     gh pr view --json number,title,url,headRefName,baseRefName,body,reviewDecision,statusCheckRollup
   - If no PR is available, stop and ask Travis for the PR number.

2. Snapshot review scope
   - Run git status/diff/log checks.
   - Inspect the PR diff against its base branch using gh pr diff and/or git diff base...HEAD.
   - Include local uncommitted diff in scope only when present and relevant; say clearly when local diff exists.
   - Do not overwrite or revert unrelated local changes.

3. Find associated Linear issue, if cited
   - Look for Linear issue keys like ABC-123 in PR title, body, branch name, commit messages, and linked references.
   - If no Linear issue is cited, continue without Linear context. Do not ask for Linear solely because it is absent.
   - If multiple Linear issues are referenced, include all directly relevant issues.
   - When Linear is cited, retrieve title, description, issue text as acceptance criteria, comments, and status/labels if tooling allows.
   - If cited Linear cannot be fetched, ask Travis for issue text only if PR context is insufficient to judge functionality. Otherwise continue and mark Linear confidence limited.

4. Build a changed-file coverage matrix
   For each meaningful changed file or file group, track:
   - purpose of the change
   - requirements/behavior it supports
   - risk level
   - review angle(s) that inspected it
   - tests/validation evidence if visible

5. Functional requirements review
   - Call subagent({ action: "list" }) first and use only executable agents.
   - Launch a fresh-context reviewer for functionality/correctness.
   - Give it Linear details when present; otherwise PR title/body/commits as functional context.
   - Require direct inspection of diff and repository files.
   - Review question: does the PR fully satisfy each cited Linear requirement or PR-described requirement without narrowing scope, missing edge cases, or breaking existing behavior?
   - Require file/line evidence.

6. Simplicity / duplication / efficiency review
   - Launch a second fresh-context reviewer focused on:
     - simplicity and maintainability
     - duplicated logic or unnecessary abstractions
     - inefficient loops or avoidable repeated work
     - brittle data flow, unclear names, over-broad changes, package-boundary issues
   - Require file/line evidence and smallest practical improvement.

7. Readability scoring
   - Use a reviewer or delegate to score readability 0-100.
   - Consider naming, structure, locality, cognitive load, comments, tests as documentation, and consistency with project patterns.
   - Include 3-5 concise reasons and highest-leverage improvement.

8. Conditional extra angles
   Add one targeted reviewer only when touched files warrant it:
   - auth/privacy/security/data boundaries
   - infra/deploy/migrations
   - AI/model prompts/evals
   - billing/payments
   - user-facing UI/accessibility
   - performance/concurrency/idempotency

9. Synthesis
   - Inspect reviewer outputs and key evidence yourself.
   - Discount findings without file/line or command evidence.
   - Separate show-stoppers from optional polish.
   - Include confidence and limitations, especially when Linear context is missing or inaccessible.
   - Keep final concise and actionable.

Final response must use exactly these headings:

## Functionality
Did the PR meet all cited Linear requirements, or if no Linear issue was cited, the PR-described functional requirements? List each requirement as met / missing / unclear. Cite evidence for missing/unclear items.

## Changed-File Coverage
Summarize key changed files/file groups, purpose, risk, and review coverage. Keep compact.

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
