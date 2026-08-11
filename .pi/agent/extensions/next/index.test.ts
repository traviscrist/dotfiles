import { describe, expect, it } from "bun:test";
import {
  buildNextKickoff,
  buildNextSessionName,
  buildTaskSessionName,
  createNextExtension,
  normalizeFocus,
  parseTaskSessionName,
} from "./index.ts";

const SKILL_MARKDOWN = `---
name: next
description: Test skill
---

# Next Project Step

Execute the next slice.
`;

function createHarness(
  loadSkill: (() => Promise<string>) | null = async () => SKILL_MARKDOWN,
) {
  const commands = new Map<
    string,
    { handler: (args: string, ctx: any) => Promise<void> }
  >();
  const handlers = new Map<string, Array<(event: any, ctx: any) => any>>();
  const renamedSessions: string[] = [];

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
  };
  createNextExtension(pi as any, loadSkill ? { loadSkill } : {});
  return { commands, handlers, renamedSessions };
}

function createContext(options: { idle?: boolean; cancelled?: boolean } = {}) {
  const notifications: Array<[string, string]> = [];
  const sessionNames: string[] = [];
  const customEntries: Array<{ customType: string; data: unknown }> = [];
  const messages: string[] = [];
  let newSessionCalls = 0;

  const ctx = {
    isIdle: () => options.idle ?? true,
    ui: {
      notify(message: string, level: string) {
        notifications.push([message, level]);
      },
    },
    async newSession(config: {
      setup: (sessionManager: {
        appendSessionInfo: (name: string) => void;
        appendCustomEntry: (customType: string, data: unknown) => void;
      }) => Promise<void>;
      withSession: (replacementCtx: {
        sendUserMessage: (message: string) => Promise<void>;
      }) => Promise<void>;
    }) {
      newSessionCalls += 1;
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
        getEntries: () =>
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
    expect(context.messages[0]).not.toContain("corepack");
    expect(context.messages[0]).not.toContain("name: next");
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
