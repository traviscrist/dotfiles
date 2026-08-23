import { readFile } from "node:fs/promises";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const DEFAULT_SESSION_NAME = "Auto next";
const MAX_FOCUS_LENGTH = 60;
const FRESH_SESSION_MARKER = "AUTO_NEXT_FRESH_SESSION: true";
const SKILL_PATH = new URL("../../skills/auto-next/SKILL.md", import.meta.url);
const FRONTMATTER_PATTERN = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

type AutoNextExtensionOptions = {
  loadSkill?: () => Promise<string>;
};

export function normalizeFocus(args: string): string {
  return args.trim().replace(/\s+/g, " ");
}

function skillInstructions(skillMarkdown: string): string {
  const instructions = skillMarkdown.replace(FRONTMATTER_PATTERN, "").trim();
  if (!instructions) throw new Error("Auto Next skill contains no instructions");
  return instructions;
}

export function buildAutoNextKickoff(
  skillMarkdown: string,
  focus: string,
): string {
  const invocation = focus
    ? `${FRESH_SESSION_MARKER}\n\n## Invocation focus\n\n${focus}`
    : FRESH_SESSION_MARKER;
  return `${skillInstructions(skillMarkdown)}\n\n${invocation}`;
}

export function buildAutoNextSessionName(focus: string): string {
  return focus
    ? `Auto next: ${focus.slice(0, MAX_FOCUS_LENGTH)}`
    : DEFAULT_SESSION_NAME;
}

export function createAutoNextExtension(
  pi: ExtensionAPI,
  options: AutoNextExtensionOptions = {},
): void {
  const loadSkill = options.loadSkill ?? (() => readFile(SKILL_PATH, "utf8"));

  pi.registerCommand("auto-next", {
    description: "Plan and implement the next authoritative project item",
    handler: async (args, ctx) => {
      if (!ctx.isIdle()) {
        ctx.ui.notify(
          "Wait for the current turn to finish before using /auto-next",
          "warning",
        );
        return;
      }

      const focus = normalizeFocus(args);
      let kickoff: string;
      try {
        kickoff = buildAutoNextKickoff(await loadSkill(), focus);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(`Unable to load the Auto Next skill: ${message}`, "error");
        return;
      }

      const sessionName = buildAutoNextSessionName(focus);
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

export default createAutoNextExtension;
