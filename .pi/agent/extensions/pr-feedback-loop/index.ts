import { readFile } from "node:fs/promises";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const SKILL_PATH = new URL("../../skills/pr-feedback/SKILL.md", import.meta.url);
const FRONTMATTER_PATTERN = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;
type Command = "pr" | "review";

export function buildPrPrompt(command: Command, args: string, skill: string): string {
	const tokens = args.trim().split(/\s+/).filter(Boolean);
	const auto = command === "pr" && tokens[0] === "--auto";
	if (auto) tokens.shift();
	const target = tokens.join(" ");
	if (tokens.length > 1 || (target && !/^(?:[1-9]\d*|https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/pull\/[1-9]\d*\/?)$/.test(target))) {
		throw new Error(`Usage: /${command}${command === "pr" ? " [--auto]" : ""} [number|url]`);
	}
	const instructions = skill.replace(FRONTMATTER_PATTERN, "").trim();
	if (!instructions) throw new Error("PR feedback skill contains no instructions");
	const mode = command === "review"
		? "READ-ONLY REVIEW. Inspection only; never fix or publish."
		: auto
			? "EXPLICIT AUTO. At most two fix/CI rounds; publication still requires explicit approval."
			: "DEFAULT PR. Stop for explicit selection approval, then explicit publication approval.";
	return `${instructions}\n\n## Invocation\n\nCommand: /${command}\nMode: ${mode}\nPR: ${target || "<active PR>"}`;
}

export function createPrExtension(
	pi: ExtensionAPI,
	loadSkill: () => Promise<string> = () => readFile(SKILL_PATH, "utf8"),
): void {
	for (const command of ["pr", "review"] as const) {
		pi.registerCommand(command, {
			description: command === "pr"
				? "Triage PR feedback, approve fixes, validate gates, approve publication; --auto opts into bounded fixing"
				: "Read-only PR review: requirements, correctness, and actionable findings",
			handler: async (args, ctx) => {
				try {
					const prompt = buildPrPrompt(command, args, await loadSkill());
					if (ctx.isIdle()) {
						pi.sendUserMessage(prompt);
					} else {
						pi.sendUserMessage(prompt, { deliverAs: "followUp" });
						ctx.ui.notify(`/${command} queued`, "info");
					}
				} catch (error) {
					ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
				}
			},
		});
	}
}

export default createPrExtension;
