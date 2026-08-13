import { describe, expect, it } from "bun:test";
import {
  buildChainedKickoff,
  buildNextKickoff,
  buildNextSessionName,
  buildTaskSessionName,
  createNextExtension,
  latestNextChainSuggestion,
  normalizeFocus,
  parseNextChainDirective,
  parseNextChainSuggestion,
  parseTaskSessionName,
  rewriteChainedNextInput,
} from "./index.ts";

const SKILL_MARKDOWN = `---
name: next
description: Test skill
---

# Next Project Step

Execute the next slice.
`;

const CHAIN_SUGGESTION = {
  version: 1 as const,
  title: "Add staging eval composition",
  prompt: "Verify and plan the smallest staging eval composition slice.",
  prerequisite: "PR #123 must be merged first.",
};

const CHAIN_ENTRY = {
  type: "custom",
  customType: "next-chain-suggestion",
  data: CHAIN_SUGGESTION,
};
function createHarness(
  loadSkill: (() => Promise<string>) | null = async () => SKILL_MARKDOWN,
) {
  const commands = new Map<
    string,
    { handler: (args: string, ctx: any) => Promise<void> }
  >();
  const handlers = new Map<string, Array<(event: any, ctx: any) => any>>();
  const renamedSessions: string[] = [];
  const appendedEntries: Array<{ customType: string; data: unknown }> = [];

  const pi = {
    registerCommand(
      name: string,
      command: { handler: (args: string, ctx: any) => Promise<void> },
    ) {
      commands.set(name, command);
    },
    on(name: string, handler: (event: any, ctx: any) => any) {
      handlers.set(name, [...(handlers.get(name) ?? []), handler]);
    },
    setSessionName(name: string) {
      renamedSessions.push(name);
    },
    appendEntry(customType: string, data: unknown) {
      appendedEntries.push({ customType, data });
    },
  };
  createNextExtension(pi as any, loadSkill ? { loadSkill } : {});
  return { commands, handlers, renamedSessions, appendedEntries };
}

function createContext(options: {
  idle?: boolean;
  cancelled?: boolean;
  entries?: unknown[];
  sessionFile?: string;
} = {}) {
  const notifications: Array<[string, string]> = [];
  const sessionNames: string[] = [];
  const customEntries: Array<{ customType: string; data: unknown }> = [];
  const messages: string[] = [];
  const parentSessions: Array<string | undefined> = [];
  let newSessionCalls = 0;

  const ctx = {
    isIdle: () => options.idle ?? true,
    sessionManager: {
      getBranch: () => options.entries ?? [],
      getSessionFile: () => options.sessionFile,
    },
    ui: {
      notify(message: string, level: string) {
        notifications.push([message, level]);
      },
    },
    async newSession(config: {
      parentSession?: string;
      setup: (sessionManager: {
        appendSessionInfo: (name: string) => void;
        appendCustomEntry: (customType: string, data: unknown) => void;
      }) => Promise<void>;
      withSession: (replacementCtx: {
        sendUserMessage: (message: string) => Promise<void>;
      }) => Promise<void>;
    }) {
      newSessionCalls += 1;
      parentSessions.push(config.parentSession);
      if (options.cancelled) return { cancelled: true };
      await config.setup({
        appendSessionInfo: (name) => sessionNames.push(name),
        appendCustomEntry: (customType, data) =>
          customEntries.push({ customType, data }),
      });
      await config.withSession({
        async sendUserMessage(message) {
          messages.push(message);
        },
      });
      return { cancelled: false };
    },
  };

  return {
    ctx,
    customEntries,
    messages,
    notifications,
    parentSessions,
    sessionNames,
    get newSessionCalls() {
      return newSessionCalls;
    },
  };
}

async function finishAssistantMessage(
  harness: ReturnType<typeof createHarness>,
  text: string,
  marked: boolean,
): Promise<void> {
  const handler = harness.handlers.get("message_end")?.[0];
  expect(handler).toBeFunction();
  await handler!(
    {
      message: {
        role: "assistant",
        content: [{ type: "text", text }],
      },
    },
    {
      sessionManager: {
        getBranch: () =>
          marked
            ? [
                {
                  type: "custom",
                  customType: "next-session",
                  data: { version: 1 },
                },
              ]
            : [],
      },
    },
  );
}

describe("next command", () => {
  it("expands skill instructions and normalizes optional focus text", () => {
    expect(normalizeFocus("  backend\n  evals  ")).toBe("backend evals");
    expect(buildNextKickoff(SKILL_MARKDOWN, "")).toBe(
      "# Next Project Step\n\nExecute the next slice.",
    );
    expect(buildNextKickoff(SKILL_MARKDOWN, "backend evals")).toBe(
      "# Next Project Step\n\nExecute the next slice.\n\n## Invocation focus\n\nbackend evals",
    );
    expect(buildNextSessionName("")).toBe("Next project step");
    expect(buildNextSessionName("backend evals")).toBe("Next: backend evals");
    expect(buildTaskSessionName("  rotate managed\n sessions ")).toBe(
      "Next: rotate managed sessions",
    );
    expect(
      parseTaskSessionName(
        "NEXT_SESSION_NAME: rotate managed sessions\n\n## Plan",
      ),
    ).toBe("Next: rotate managed sessions");
    expect(
      parseTaskSessionName("NEXT_SESSION_NAME: <short task title>"),
    ).toBeUndefined();
  });

  it("parses, validates, and selects durable chain suggestions", () => {
    const encoded = `NEXT_CHAIN: ${JSON.stringify(CHAIN_SUGGESTION)}`;
    expect(parseNextChainSuggestion(encoded)).toEqual(CHAIN_SUGGESTION);
    expect(parseNextChainSuggestion("NEXT_CHAIN: not-json")).toBeUndefined();
    expect(parseNextChainDirective("NEXT_CHAIN: null")).toBeNull();
    expect(
      parseNextChainSuggestion(
        'NEXT_CHAIN: {"version":2,"title":"Later","prompt":"Do it"}',
      ),
    ).toBeUndefined();
    expect(
      parseNextChainSuggestion(
        'NEXT_CHAIN: {"version":1,"title":"<task>","prompt":"Do it"}',
      ),
    ).toBeUndefined();

    expect(
      latestNextChainSuggestion([
        CHAIN_ENTRY,
        {
          ...CHAIN_ENTRY,
          data: { ...CHAIN_SUGGESTION, title: "Newest valid step" },
        },
      ]),
    ).toEqual({ ...CHAIN_SUGGESTION, title: "Newest valid step" });
    expect(
      latestNextChainSuggestion([
        CHAIN_ENTRY,
        { ...CHAIN_ENTRY, data: { version: 1, title: "broken" } },
      ]),
    ).toEqual(CHAIN_SUGGESTION);
    expect(
      latestNextChainSuggestion([CHAIN_ENTRY, { ...CHAIN_ENTRY, data: null }]),
    ).toBeUndefined();
  });

  it("builds a bounded chained kickoff that requires revalidation", () => {
    const kickoff = buildChainedKickoff(SKILL_MARKDOWN, CHAIN_SUGGESTION);
    expect(kickoff).toContain("# Next Project Step");
    expect(kickoff).toContain(
      "Previous session recommended: Add staging eval composition",
    );
    expect(kickoff).toContain(CHAIN_SUGGESTION.prompt);
    expect(kickoff).toContain(CHAIN_SUGGESTION.prerequisite);
    expect(kickoff).toContain("Revalidate it against current repository authority");
    expect(kickoff).not.toContain("name: next");
  });

  it("creates a fresh named and marked session with expanded instructions", async () => {
    const harness = createHarness();
    const context = createContext();

    await harness.commands
      .get("next")!
      .handler(" backend\n evals ", context.ctx);

    expect(context.newSessionCalls).toBe(1);
    expect(context.sessionNames).toEqual(["Next: backend evals"]);
    expect(context.customEntries).toEqual([
      { customType: "next-session", data: { version: 1 } },
    ]);
    expect(context.messages).toEqual([
      "# Next Project Step\n\nExecute the next slice.\n\n## Invocation focus\n\nbackend evals",
    ]);
    expect(context.messages[0]).not.toContain("/skill:next");
    expect(context.messages[0]).not.toContain("name: next");
  });

  it("loads the deployed skill through the default path", async () => {
    const harness = createHarness(null);
    const context = createContext();

    await harness.commands.get("next")!.handler("", context.ctx);

    expect(context.newSessionCalls).toBe(1);
    expect(context.messages[0]).toContain("# Next Project Step");
    expect(context.messages[0]).toContain("always ask for explicit approval");
    expect(context.messages[0]).toContain(
      "NEXT_SESSION_NAME: <short task title>",
    );
    expect(context.messages[0]).toContain("Required Pre-Publish Gate");
    expect(context.messages[0]).toContain("async:false");
    expect(context.messages[0]).toContain("unrelated subsystem graphs");
    expect(context.messages[0]).toContain("NEXT_CHAIN:");
    expect(context.messages[0]).not.toContain("corepack");
    expect(context.messages[0]).not.toContain("name: next");
  });

  it("records chain suggestions only from marked next sessions", async () => {
    const encoded = `NEXT_CHAIN: ${JSON.stringify(CHAIN_SUGGESTION)}`;
    const regular = createHarness();
    await finishAssistantMessage(regular, encoded, false);
    expect(regular.appendedEntries).toEqual([]);

    const next = createHarness();
    await finishAssistantMessage(next, encoded, true);
    expect(next.appendedEntries).toEqual([
      { customType: "next-chain-suggestion", data: CHAIN_SUGGESTION },
    ]);
    await finishAssistantMessage(next, "No safe successor.\nNEXT_CHAIN: null", true);
    expect(next.appendedEntries.at(-1)).toEqual({
      customType: "next-chain-suggestion",
      data: null,
    });
  });

  it("rewrites only exact next when a durable suggestion exists", () => {
    expect(rewriteChainedNextInput(" NEXT ", [CHAIN_ENTRY])).toBe(
      "/next --chain",
    );
    expect(rewriteChainedNextInput("next please", [CHAIN_ENTRY])).toBeUndefined();
    expect(rewriteChainedNextInput("next", [])).toBeUndefined();
  });

  it("creates a fresh linked session from the durable suggestion", async () => {
    const harness = createHarness();
    const context = createContext({
      entries: [CHAIN_ENTRY],
      sessionFile: "/sessions/current.jsonl",
    });

    await harness.commands.get("next")!.handler("--chain", context.ctx);

    expect(context.parentSessions).toEqual(["/sessions/current.jsonl"]);
    expect(context.sessionNames).toEqual([
      "Next: Add staging eval composition",
    ]);
    expect(context.customEntries).toEqual([
      { customType: "next-session", data: { version: 1 } },
      { customType: "next-chain-origin", data: CHAIN_SUGGESTION },
    ]);
    expect(context.messages[0]).toContain(CHAIN_SUGGESTION.prompt);
    expect(context.messages[0]).toContain(
      "Revalidate it against current repository authority",
    );
  });

  it("refuses chain requests without a suggestion or persisted parent", async () => {
    const harness = createHarness();
    const missing = createContext();
    await harness.commands.get("next")!.handler("--chain", missing.ctx);
    expect(missing.newSessionCalls).toBe(0);
    expect(missing.notifications).toEqual([
      ["No suggested next step is available", "warning"],
    ]);

    const unpersisted = createContext({ entries: [CHAIN_ENTRY] });
    await harness.commands.get("next")!.handler("--chain", unpersisted.ctx);
    expect(unpersisted.newSessionCalls).toBe(0);
    expect(unpersisted.notifications).toEqual([
      ["Cannot chain from an unpersisted session", "warning"],
    ]);
  });

  it("automatically renames only marked next sessions from the plan", async () => {
    const regular = createHarness();
    await finishAssistantMessage(
      regular,
      "NEXT_SESSION_NAME: ordinary task",
      false,
    );
    expect(regular.renamedSessions).toEqual([]);

    const next = createHarness();
    await finishAssistantMessage(
      next,
      "NEXT_SESSION_NAME: rotate managed sessions\n\n## Plan",
      true,
    );
    expect(next.renamedSessions).toEqual(["Next: rotate managed sessions"]);
  });

  it("refuses session replacement while the agent is busy", async () => {
    const harness = createHarness();
    const context = createContext({ idle: false });

    await harness.commands.get("next")!.handler("", context.ctx);

    expect(context.newSessionCalls).toBe(0);
    expect(context.notifications).toEqual([
      ["Wait for the current turn to finish before using /next", "warning"],
    ]);
  });

  it("keeps the current session when the skill cannot load", async () => {
    const harness = createHarness(async () => {
      throw new Error("missing skill");
    });
    const context = createContext();

    await harness.commands.get("next")!.handler("", context.ctx);

    expect(context.newSessionCalls).toBe(0);
    expect(context.notifications).toEqual([
      ["Unable to load the next skill: missing skill", "error"],
    ]);
  });

  it("reports a cancelled session replacement", async () => {
    const harness = createHarness();
    const context = createContext({ cancelled: true });

    await harness.commands.get("next")!.handler("", context.ctx);

    expect(context.newSessionCalls).toBe(1);
    expect(context.notifications).toEqual([["New session cancelled", "info"]]);
  });
});
