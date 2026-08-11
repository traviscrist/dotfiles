import { readFile } from "node:fs/promises";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const DEFAULT_SESSION_NAME = "Next project step";
const MAX_FOCUS_NAME_LENGTH = 60;
const MAX_TASK_NAME_LENGTH = 72;
const NEXT_SESSION_MARKER = "next-session";
const SESSION_NAME_PATTERN = /^NEXT_SESSION_NAME:\s*(.+)$/m;
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

export function buildTaskSessionName(taskName: string): string {
  const normalized = normalizeFocus(taskName);
  if (!normalized) throw new Error("Session task name must not be empty");
  return `Next: ${normalized.slice(0, MAX_TASK_NAME_LENGTH)}`;
}

export function parseTaskSessionName(text: string): string | undefined {
  const taskName = text.match(SESSION_NAME_PATTERN)?.[1]?.trim();
  if (!taskName || taskName.startsWith("<")) return undefined;
  return buildTaskSessionName(taskName);
}

export function createNextExtension(
  pi: ExtensionAPI,
  options: NextExtensionOptions = {},
): void {
  const loadSkill = options.loadSkill ?? (() => readFile(SKILL_PATH, "utf8"));

  pi.on("message_end", (event, ctx) => {
    if (event.message.role !== "assistant") return;
    const marked = ctx.sessionManager
      .getEntries()
      .some(
        (entry) =>
          entry.type === "custom" && entry.customType === NEXT_SESSION_MARKER,
      );
    if (!marked) return;

    const text = event.message.content
      .filter((content) => content.type === "text")
      .map((content) => content.text)
      .join("\n");
    const sessionName = parseTaskSessionName(text);
    if (sessionName) pi.setSessionName(sessionName);
  });

  pi.registerCommand("next", {
    description:
      "Discover and propose the smallest actionable next project step",
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
          sessionManager.appendCustomEntry(NEXT_SESSION_MARKER, { version: 1 });
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
