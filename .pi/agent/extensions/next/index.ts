import { readFile } from "node:fs/promises";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const DEFAULT_SESSION_NAME = "Next project step";
const MAX_FOCUS_NAME_LENGTH = 60;
const SKILL_PATH = new URL("../../skills/next/SKILL.md", import.meta.url);
const FRONTMATTER_PATTERN = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

type NextExtensionOptions = {
  loadSkill?: () => Promise<string>;
};

export function normalizeFocus(args: string): string {
  return args.trim().replace(/\s+/g, " ");
}

export function buildNextKickoff(skillMarkdown: string, focus: string): string {
  const instructions = skillMarkdown.replace(FRONTMATTER_PATTERN, "").trim();
  if (!instructions) throw new Error("Next skill contains no instructions");
  return focus
    ? `${instructions}\n\n## Invocation focus\n\n${focus}`
    : instructions;
}

export function buildNextSessionName(focus: string): string {
  return focus
    ? `Next: ${focus.slice(0, MAX_FOCUS_NAME_LENGTH)}`
    : DEFAULT_SESSION_NAME;
}

export function createNextExtension(
  pi: ExtensionAPI,
  options: NextExtensionOptions = {},
): void {
  const loadSkill = options.loadSkill ?? (() => readFile(SKILL_PATH, "utf8"));

  pi.registerCommand("next", {
    description: "Start and publish the smallest actionable next project step",
    handler: async (args, ctx) => {
      if (!ctx.isIdle()) {
        ctx.ui.notify(
          "Wait for the current turn to finish before using /next",
          "warning",
        );
        return;
      }

      const focus = normalizeFocus(args);
      let kickoff: string;
      try {
        kickoff = buildNextKickoff(await loadSkill(), focus);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(`Unable to load the next skill: ${message}`, "error");
        return;
      }

      const sessionName = buildNextSessionName(focus);
      const result = await ctx.newSession({
        setup: async (sessionManager) => {
          sessionManager.appendSessionInfo(sessionName);
        },
        withSession: async (replacementCtx) => {
          await replacementCtx.sendUserMessage(kickoff);
        },
      });

      if (result.cancelled) {
        ctx.ui.notify("New session cancelled", "info");
      }
    },
  });
}

export default createNextExtension;
