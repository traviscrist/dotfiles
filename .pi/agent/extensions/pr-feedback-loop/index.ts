import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const WORKFLOW_PROMPT = String.raw`Run the PR feedback loop for this repository.

Input from /pr:
{{ARGS}}

Treat this /pr invocation as Travis's consent to update the current PR branch, push fixes, reply to GitHub review comments, resolve threads when fixed, and monitor CI until green. Do not merge.

Core rules:
- Use gh, not browser URLs.
- One writer at a time.
- Do not overwrite unrelated local changes.
- Main agent owns replies, thread resolution, pushes, and CI decisions.
- Triage subagents are read-only and must use acceptance none/false.
- Fixer subagents may edit but must not reply, resolve, push, or commit.
- Cap the automatic fix/CI loop at two rounds. If still red or new feedback remains, report blockers and ask Travis.

Workflow:

1. Identify PR
   - If input includes a PR number or URL, use that PR.
   - Otherwise use the active PR:
     gh pr view --json number,title,url,headRefName,baseRefName,reviewDecision,statusCheckRollup
   - If no PR is available, stop and ask Travis for the PR number.

2. Snapshot state
   - Run git status/diff/log checks.
   - Confirm current branch matches the PR head branch before editing.
   - If unexpected unrelated changes conflict with review fixes, stop and ask.

3. Collect feedback
   - Fetch PR details, reviews, review comments, issue comments, and unresolved review threads.
   - Suggested commands:
     gh pr view <pr> --json number,title,url,headRefName,baseRefName,reviewDecision,statusCheckRollup,reviews,comments
     gh api repos/:owner/:repo/pulls/<pr>/comments --paginate
     gh api repos/:owner/:repo/issues/<pr>/comments --paginate
     gh api graphql ... for unresolved reviewThreads when resolution is needed.
   - Filter obvious bot lifecycle noise ("review started", "review finished", generated diagrams) unless it contains actionable criticism.
   - Keep raw payloads out of final output.

4. Maintain a private comment ledger
   Track each distinct comment/thread:
   - comment/thread id
   - author
   - path/line when present
   - classification
   - planned action
   - fix commit or file evidence
   - validation evidence
   - reply posted?
   - thread resolved?
   - re-review requested for bot author?

5. Triage every actionable comment
   - Call subagent({ action: "list" }) first and use only executable agents.
   - For each distinct actionable comment, run pr-comment-triager.
   - Triage tasks must say: "classify only; do not edit, implement, validate, reply, resolve, push, or contact supervisor for implementation acceptance".
   - Pass acceptance: false or acceptance: "none" on every triage task.
   - Do not ask triagers to satisfy changed-files/tests-added/no-staged-files evidence.
   - Classification must be one of:
     fix | already_fixed | explain | wont_fix | duplicate | needs_travis
   - Require evidence: current files/lines or command output plus proposed concise reply.

6. Plan and fix accepted comments
   - Group fix items by file/area to reduce churn.
   - If any item is product/design/security-sensitive, stop for Travis before editing it.
   - Use pr-comment-fixer for implementation.
   - Run fixers serially when they may touch overlapping files.
   - Fixer tasks should use checked acceptance and include the comment, triage, target files, and acceptance criteria.
   - Fix root cause; add/update focused tests when appropriate.

7. Validate locally
   - Run focused tests/checks for touched behavior.
   - Run repo-appropriate lint/typecheck/tests/docs gates before push when practical.
   - If a full gate is blocked, state the exact blocker and strongest validation that did run.

8. Push updates
   - Push the PR branch only after local validation is acceptable.
   - If push fails, report the exact error and stop unless it is a safe retry.

9. Reply and resolve
   - Main agent replies to every addressed comment.
   - Reply format: concise fix summary + file/line or commit + validation.
   - Resolve review threads only after the fix is pushed.
   - Reply to explain/wont_fix/already_fixed items with evidence.
   - Request another review pass once per bot reviewer per loop after addressed comment replies are posted. Strip [bot] from mention when needed (codeant-ai[bot] -> @codeant-ai).

10. Monitor CI
   - Use gh run list/view and/or gh pr checks.
   - If checks fail, inspect logs and apply one targeted fix loop when safe.
   - Stop when required checks are green, no actionable unresolved review feedback remains, or a blocker needs Travis.
   - Do not exceed two automatic fix/CI rounds.

11. Final response
   - Summarize PR number, comments handled, fixes made, validation, CI state, replies/resolutions, re-review requests, and remaining blockers.
   - Keep it short.
`;

function buildPrompt(args: string): string {
	const normalizedArgs = args.trim() || "<none; use active PR>";
	return WORKFLOW_PROMPT.replace("{{ARGS}}", normalizedArgs);
}

function sendPrWorkflow(pi: ExtensionAPI, ctx: ExtensionContext, args: string): void {
	const prompt = buildPrompt(args);

	if (ctx.isIdle()) {
		pi.sendUserMessage(prompt);
		return;
	}

	pi.sendUserMessage(prompt, { deliverAs: "followUp" });
	ctx.ui.notify("PR feedback loop queued", "info");
}

export default function (pi: ExtensionAPI) {
	pi.registerCommand("pr", {
		description: "Run PR feedback loop: triage comments, fix, reply, and monitor CI until green",
		handler: async (args, ctx) => sendPrWorkflow(pi, ctx, args),
	});
}
