import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const WORKFLOW_PROMPT = String.raw`Run the PR feedback loop for this repository.

Input from /pr:
{{ARGS}}

Treat this /pr invocation as Travis's consent to update the current PR branch, push fixes, reply to GitHub review comments, resolve threads when fixed, and monitor CI until green. Do not merge.

Workflow:

1. Identify PR
   - If input includes a PR number or URL, use that PR.
   - Otherwise use the active PR:
     gh pr view --json number,title,url,headRefName,baseRefName,reviewDecision,statusCheckRollup
   - If no PR is available, stop and ask Travis for the PR number.

2. Snapshot state
   - Run git status/diff/log checks.
   - Confirm current branch matches the PR head branch before editing.
   - Do not overwrite unrelated local changes. If unexpected changes conflict, stop and ask.

3. Collect feedback
   - Use gh, not web URLs.
   - Fetch PR details, review comments, issue comments, reviews, and unresolved review threads.
   - Suggested commands:
     gh pr view <pr> --json number,title,url,headRefName,baseRefName,reviewDecision,statusCheckRollup,reviews,comments
     gh api repos/:owner/:repo/pulls/<pr>/comments --paginate
     gh api repos/:owner/:repo/issues/<pr>/comments --paginate
     gh api graphql ... for reviewThreads when line/thread resolution is needed.
   - Preserve comment IDs, thread IDs, author, path, line, body, and URL only for traceability in your private notes. Do not paste huge payloads into final output.

4. Triage every comment
   - For each distinct review/issue comment, run subagent pr-comment-triager.
   - Triage may run in parallel.
   - IMPORTANT: triage is read-only. When launching pr-comment-triager, pass acceptance none (or acceptance false) on every triage task so pi-subagents does not infer write-capable implementation acceptance.
   - Triage task text must say "classify only; do not edit, implement, validate, reply, resolve, push, or contact supervisor for implementation acceptance".
   - Do not ask triagers to satisfy changed-files/tests-added/no-staged-files acceptance evidence. That belongs only to fixer tasks.
   - Each triage must classify one comment as:
     fix | already_fixed | explain | wont_fix | duplicate | needs_travis
   - Require evidence: files/lines, current code state, and proposed response.

5. Plan batches
   - Main agent groups accepted fixes by file/area to reduce churn.
   - If a comment needs Travis or is product/design-sensitive, stop before editing that item and ask.

6. Fix accepted comments
   - Use subagent pr-comment-fixer for implementation.
   - Fixers must run serially when they may touch overlapping files.
   - Fixer tasks may use checked acceptance because they are write-capable.
   - Each fixer gets the comment, triage, target files, and acceptance criteria.
   - Fix root cause, add/update tests when appropriate, run focused validation.

7. Validate locally
   - Run repo-appropriate lint/typecheck/tests/docs gates.
   - Prefer full gate before push. If blocked, state the exact missing dependency/service.

8. Push updates
   - Push the PR branch after local validation.
   - If push fails, report the exact error and stop unless it is a safe retry.

9. Reply and resolve comments
   - Main agent, not subagents, replies to every addressed comment.
   - Reply format: concise, cite fix and file/line or commit, mention validation.
   - Resolve review threads only after the fix is pushed.
   - Track each bot reviewer/comment author that supplied actionable feedback.
   - After addressed comment replies are posted, add a PR-level comment for each bot reviewer asking for another pass and @mentioning that bot. Strip the GitHub [bot] suffix for the mention when needed (example: codeant-ai[bot] -> @codeant-ai). Do this once per bot reviewer per loop, not once per individual comment.

10. Monitor CI until green
   - Use gh run list/view and/or gh pr checks.
   - If checks fail, inspect logs, diagnose root cause, and run pr-comment-fixer or a targeted fix loop.
   - Push again and continue monitoring.
   - Stop only when all required checks are green, no actionable unresolved review feedback remains, or a blocker needs Travis.

11. Final response
   - Summarize: PR number, comments handled, fixes made, validation, CI state, remaining blockers.
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
