import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const WORKFLOW_PROMPT = String.raw`Run the human-in-the-loop PR comment workflow for this repository.

Input from /pr-light:
{{ARGS}}

Purpose: complete one focused code-review-comment loop with Travis controlling which comments are addressed and whether results are published. Focus only on existing PR comments. Do not perform a broad PR review, Linear requirements audit, changed-file matrix, unrelated refactor, or autonomous CI repair loop.

Hard approval gates:
1. TRIAGE: inspect and present comments, then stop for Travis to select which ones to address. Do not edit.
2. FIX: address only Travis's selected comments, show changes and focused validation, then stop for Travis to approve publication. Do not commit, push, reply, or resolve.
3. PUBLISH: only after Travis explicitly approves the displayed results, commit and push the selected fixes, reply to the selected comments, and resolve only threads that are fully addressed. Do not merge.

Core rules:
- Use gh, not browser URLs, for GitHub PR data.
- One writer in the active worktree.
- Do not overwrite, revert, stage, or include unrelated local changes.
- Keep a private numbered ledger mapping each selected comment/thread to disposition, evidence, validation, reply, and resolution state.
- Use subagents only when they materially help classify or fix selected comments. Call subagent({ action: "list" }) first. Triage helpers are read-only with acceptance none/false. Fixers never commit, push, reply, or resolve.
- Follow repository instructions for commits and pushes.
- Prefer focused tests for touched behavior. Do not run broad local suites unless Travis explicitly requests them.

Phase 1 — TRIAGE AND ASK

1. Identify the PR.
   - If input includes a PR number or URL, use it.
   - Otherwise use the active PR with gh pr view.
   - If no PR is available, stop and ask Travis for its number.

2. Snapshot safety state.
   - Inspect git status, branch/upstream, and relevant diff.
   - Confirm the checked-out branch matches the PR head before proposing fixes.
   - Note unrelated local changes; do not include or disturb them.

3. Fetch review comments only.
   - Fetch PR reviews, inline review comments, issue comments that contain review feedback, and unresolved review threads.
   - Filter bot lifecycle noise, generated summaries/diagrams, approvals without requests, and non-actionable status chatter.
   - Deduplicate repeated comments and identify comments already fixed or obsolete from current code.

4. Present a concise numbered list.
   For every actionable comment include:
   - stable selection number plus author
   - path/line when present
   - one-sentence request
   - recommended disposition: fix | explain | already_fixed | wont_fix | needs_travis
   - effort/risk: small | medium | large
   - brief evidence
   Separate non-actionable or obsolete comments in a compact "No action recommended" list.

5. Ask Travis which numbered comments to address.
   - Offer useful choices such as recommended fixes, all actionable, or explicit numbers.
   - Use ask_user_question when the choices fit; otherwise ask for a typed number/range list.
   - STOP. Do not edit, test, commit, push, reply, resolve, or request re-review in this phase.

Phase 2 — FIX SELECTED COMMENTS AND ASK

Enter this phase only after Travis selects comments in the same session.

1. Restate selected comment numbers and planned disposition.
2. Re-fetch selected threads if needed so stale line positions or new replies are not missed.
3. Address only the selected comments.
   - Fix root causes with the smallest scoped changes.
   - Add or update focused tests when practical for changed behavior.
   - For explain/already_fixed/wont_fix selections, prepare evidence-backed reply drafts without posting them.
   - If a selected item requires an unapproved product, security, destructive, or branch decision, stop and ask Travis.
4. Run only focused validation relevant to changed behavior unless Travis requested broader checks.
5. Show results:
   - comment number → files/lines changed or drafted disposition
   - concise diff summary
   - focused validation commands and outcomes
   - draft reply for each selected comment
   - any remaining risk or unresolved item
6. Ask exactly whether Travis approves committing, pushing, posting the shown replies, and resolving fully addressed threads.
   - STOP. Do not commit, push, post replies, resolve threads, or request re-review without this post-results approval.

Phase 3 — PUBLISH APPROVED RESULTS

Enter this phase only after Travis explicitly approves the Phase 2 results.

1. Recheck git status and diff. Stage only files belonging to the approved selected-comment fixes.
2. Commit with the repository's required Conventional Commit format, then push the PR branch.
3. Reply only to the selected comments.
   - Keep replies concise: disposition/fix summary + file/line or commit evidence + focused validation.
   - Never claim a fix or test that is not present in pushed evidence.
4. Resolve only selected review threads whose requested work is fully addressed and pushed.
   - Leave needs_travis, partial, disputed, or failed-fix threads unresolved.
5. If selected bot comments were addressed, request one fresh review pass from each relevant bot reviewer after replies are posted.
6. Report:
   - commit and push result
   - selected comment numbers replied to
   - threads resolved versus intentionally left open
   - re-review requests
   - current CI/check status as an observation only; do not start an autonomous CI fix loop
   - remaining blockers

If Travis changes the selection or rejects the results, return to the appropriate earlier phase. Never broaden scope silently.
`;

function buildPrompt(args: string): string {
	const normalizedArgs = args.trim() || "<none; use active PR>";
	return WORKFLOW_PROMPT.replace("{{ARGS}}", normalizedArgs);
}

function sendPrLightWorkflow(pi: ExtensionAPI, ctx: ExtensionContext, args: string): void {
	const prompt = buildPrompt(args);

	if (ctx.isIdle()) {
		pi.sendUserMessage(prompt);
		return;
	}

	pi.sendUserMessage(prompt, { deliverAs: "followUp" });
	ctx.ui.notify("PR Light queued", "info");
}

export default function (pi: ExtensionAPI) {
	pi.registerCommand("pr-light", {
		description: "Triage PR comments, let Travis choose fixes, then publish only after approval",
		handler: async (args, ctx) => sendPrLightWorkflow(pi, ctx, args),
	});
}
