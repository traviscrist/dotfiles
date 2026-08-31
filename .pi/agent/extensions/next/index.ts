import { readFile } from "node:fs/promises";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const DEFAULT_SESSION_NAME = "Next shippable goal";
const MAX_FOCUS_NAME_LENGTH = 60;
const MAX_TASK_NAME_LENGTH = 72;
const MAX_CHAIN_PROMPT_LENGTH = 1_000;
const MAX_CHAIN_PREREQUISITE_LENGTH = 500;
const NEXT_SESSION_MARKER = "next-session";
const NEXT_CHAIN_MARKER = "next-chain-suggestion";
const NEXT_CHAIN_ORIGIN_MARKER = "next-chain-origin";
const NEXT_CHAIN_ARGUMENT = "--chain";
const SESSION_NAME_PATTERN = /^NEXT_SESSION_NAME:\s*(.+)$/m;
const NEXT_CHAIN_PATTERN = /^NEXT_CHAIN:\s*(\{[^\r\n]+\}|null)\s*$/m;
const SKILL_PATH = new URL("../../skills/next/SKILL.md", import.meta.url);
const FRONTMATTER_PATTERN = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

export type NextChainSuggestion = {
  version: 1;
  title: string;
  prompt: string;
  prerequisite?: string;
};

type NextExtensionOptions = {
  loadSkill?: () => Promise<string>;
};

type CustomEntry = {
  type: "custom";
  customType: string;
  data?: unknown;
};

export function normalizeFocus(args: string): string {
  return args.trim().replace(/\s+/g, " ");
}

function skillInstructions(skillMarkdown: string): string {
  const instructions = skillMarkdown.replace(FRONTMATTER_PATTERN, "").trim();
  if (!instructions) throw new Error("Next skill contains no instructions");
  return instructions;
}

export function buildNextKickoff(skillMarkdown: string, focus: string): string {
  const instructions = skillInstructions(skillMarkdown);
  return focus
    ? `${instructions}\n\n## Invocation focus\n\n${focus}`
    : instructions;
}

export function buildChainedKickoff(
  skillMarkdown: string,
  suggestion: NextChainSuggestion,
): string {
  const prerequisite = suggestion.prerequisite
    ? `\n\nPrerequisite:\n${suggestion.prerequisite}`
    : "";
  return `${skillInstructions(skillMarkdown)}\n\n## Chained handoff\n\nPrevious session recommended: ${suggestion.title}\n\nSuggested focus:\n${suggestion.prompt}${prerequisite}\n\nTreat this as a focus hint. Revalidate it against current repository authority before planning or implementation.`;
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

function boundedText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  if (!text || text.startsWith("<") || text.length > maxLength) return undefined;
  return text;
}

export function parseNextChainDirective(
  text: string,
): NextChainSuggestion | null | undefined {
  const encoded = text.match(NEXT_CHAIN_PATTERN)?.[1];
  if (!encoded) return undefined;
  if (encoded === "null") return null;

  try {
    const value = JSON.parse(encoded) as Record<string, unknown>;
    const title = boundedText(value.title, MAX_TASK_NAME_LENGTH);
    const prompt = boundedText(value.prompt, MAX_CHAIN_PROMPT_LENGTH);
    const prerequisite =
      value.prerequisite === undefined
        ? undefined
        : boundedText(value.prerequisite, MAX_CHAIN_PREREQUISITE_LENGTH);
    if (value.version !== 1 || !title || !prompt) return undefined;
    if (value.prerequisite !== undefined && !prerequisite) return undefined;
    return { version: 1, title, prompt, ...(prerequisite && { prerequisite }) };
  } catch {
    return undefined;
  }
}

export function parseNextChainSuggestion(
  text: string,
): NextChainSuggestion | undefined {
  return parseNextChainDirective(text) ?? undefined;
}

export function latestNextChainSuggestion(
  entries: readonly unknown[],
): NextChainSuggestion | undefined {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index] as Partial<CustomEntry>;
    if (entry.type !== "custom" || entry.customType !== NEXT_CHAIN_MARKER) {
      continue;
    }
    if (entry.data === null) return undefined;
    const suggestion = entry.data as Partial<NextChainSuggestion> | undefined;
    if (!suggestion) continue;
    const encoded = `NEXT_CHAIN: ${JSON.stringify(suggestion)}`;
    const parsed = parseNextChainSuggestion(encoded);
    if (parsed) return parsed;
  }
  return undefined;
}

export function rewriteChainedNextInput(
  text: string,
  entries: readonly unknown[],
): string | undefined {
  return text.trim().toLowerCase() === "next" &&
    latestNextChainSuggestion(entries)
    ? `/next ${NEXT_CHAIN_ARGUMENT}`
    : undefined;
}

export function createNextExtension(
  pi: ExtensionAPI,
  options: NextExtensionOptions = {},
): void {
  const loadSkill = options.loadSkill ?? (() => readFile(SKILL_PATH, "utf8"));

  pi.on("message_end", (event, ctx) => {
    if (event.message.role !== "assistant") return;
    const branch = ctx.sessionManager.getBranch();
    const marked = branch.some(
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

    const directive = parseNextChainDirective(text);
    if (directive !== undefined) pi.appendEntry(NEXT_CHAIN_MARKER, directive);
  });

  pi.registerCommand("next", {
    description:
      "Discover and propose the smallest QA-able shippable project goal",
    handler: async (args, ctx) => {
      if (!ctx.isIdle()) {
        ctx.ui.notify(
          "Wait for the current turn to finish before using /next",
          "warning",
        );
        return;
      }

      const chained = normalizeFocus(args) === NEXT_CHAIN_ARGUMENT;
      const suggestion = chained
        ? latestNextChainSuggestion(ctx.sessionManager.getBranch())
        : undefined;
      if (chained && !suggestion) {
        ctx.ui.notify("No suggested next step is available", "warning");
        return;
      }

      const parentSession = suggestion
        ? ctx.sessionManager.getSessionFile()
        : undefined;
      if (suggestion && !parentSession) {
        ctx.ui.notify("Cannot chain from an unpersisted session", "warning");
        return;
      }

      const focus = chained ? "" : normalizeFocus(args);
      let kickoff: string;
      try {
        const skill = await loadSkill();
        kickoff = suggestion
          ? buildChainedKickoff(skill, suggestion)
          : buildNextKickoff(skill, focus);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(`Unable to load the next skill: ${message}`, "error");
        return;
      }

      const sessionName = suggestion
        ? buildTaskSessionName(suggestion.title)
        : buildNextSessionName(focus);
      const result = await ctx.newSession({
        ...(parentSession && { parentSession }),
        setup: async (sessionManager) => {
          sessionManager.appendSessionInfo(sessionName);
          sessionManager.appendCustomEntry(NEXT_SESSION_MARKER, { version: 1 });
          if (suggestion) {
            sessionManager.appendCustomEntry(
              NEXT_CHAIN_ORIGIN_MARKER,
              suggestion,
            );
          }
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
