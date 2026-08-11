import { describe, expect, it } from "bun:test";
import {
  buildNextKickoff,
  buildNextSessionName,
  createNextExtension,
  normalizeFocus,
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
  const pi = {
    registerCommand(
      name: string,
      command: { handler: (args: string, ctx: any) => Promise<void> },
    ) {
      commands.set(name, command);
    },
  };
  createNextExtension(pi as any, loadSkill ? { loadSkill } : {});
  return commands;
}

function createContext(options: { idle?: boolean; cancelled?: boolean } = {}) {
  const notifications: Array<[string, string]> = [];
  const sessionNames: string[] = [];
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
      }) => Promise<void>;
      withSession: (replacementCtx: {
        sendUserMessage: (message: string) => Promise<void>;
      }) => Promise<void>;
    }) {
      newSessionCalls += 1;
      if (options.cancelled) return { cancelled: true };
      await config.setup({
        appendSessionInfo: (name) => sessionNames.push(name),
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
    messages,
    notifications,
    sessionNames,
    get newSessionCalls() {
      return newSessionCalls;
    },
  };
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
  });

  it("creates a fresh named session with expanded skill instructions", async () => {
    const commands = createHarness();
    const harness = createContext();

    await commands.get("next")!.handler(" backend\n evals ", harness.ctx);

    expect(harness.newSessionCalls).toBe(1);
    expect(harness.sessionNames).toEqual(["Next: backend evals"]);
    expect(harness.messages).toEqual([
      "# Next Project Step\n\nExecute the next slice.\n\n## Invocation focus\n\nbackend evals",
    ]);
    expect(harness.messages[0]).not.toContain("/skill:next");
    expect(harness.messages[0]).not.toContain("name: next");
  });

  it("loads the deployed skill through the default path", async () => {
    const commands = createHarness(null);
    const harness = createContext();

    await commands.get("next")!.handler("", harness.ctx);

    expect(harness.newSessionCalls).toBe(1);
    expect(harness.messages[0]).toContain("# Next Project Step");
    expect(harness.messages[0]).toContain(
      "open a ready-for-review pull request",
    );
    expect(harness.messages[0]).not.toContain("name: next");
  });

  it("refuses session replacement while the agent is busy", async () => {
    const commands = createHarness();
    const harness = createContext({ idle: false });

    await commands.get("next")!.handler("", harness.ctx);

    expect(harness.newSessionCalls).toBe(0);
    expect(harness.notifications).toEqual([
      ["Wait for the current turn to finish before using /next", "warning"],
    ]);
  });

  it("keeps the current session when the skill cannot load", async () => {
    const commands = createHarness(async () => {
      throw new Error("missing skill");
    });
    const harness = createContext();

    await commands.get("next")!.handler("", harness.ctx);

    expect(harness.newSessionCalls).toBe(0);
    expect(harness.notifications).toEqual([
      ["Unable to load the next skill: missing skill", "error"],
    ]);
  });

  it("reports a cancelled session replacement", async () => {
    const commands = createHarness();
    const harness = createContext({ cancelled: true });

    await commands.get("next")!.handler("", harness.ctx);

    expect(harness.newSessionCalls).toBe(1);
    expect(harness.notifications).toEqual([["New session cancelled", "info"]]);
  });
});
