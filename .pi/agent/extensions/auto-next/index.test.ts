import { describe, expect, it } from "bun:test";
import {
  buildAutoNextKickoff,
  buildAutoNextSessionName,
  createAutoNextExtension,
  normalizeFocus,
} from "./index.ts";

const SKILL_MARKDOWN = `---
name: auto-next
description: Test skill
---

# Auto Next

Plan, approve, and implement one item.
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
  createAutoNextExtension(pi as any, loadSkill ? { loadSkill } : {});
  return { commands };
}

function createContext(options: { idle?: boolean; cancelled?: boolean } = {}) {
  const messages: string[] = [];
  const notifications: Array<[string, string]> = [];
  const sessionNames: string[] = [];
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

describe("auto-next command", () => {
  it("builds a marked kickoff with a normalized optional focus", () => {
    expect(normalizeFocus("  backend\n evals  ")).toBe("backend evals");
    expect(buildAutoNextKickoff(SKILL_MARKDOWN, "")).toBe(
      "# Auto Next\n\nPlan, approve, and implement one item.\n\nAUTO_NEXT_FRESH_SESSION: true",
    );
    expect(buildAutoNextKickoff(SKILL_MARKDOWN, "backend evals")).toContain(
      "AUTO_NEXT_FRESH_SESSION: true\n\n## Invocation focus\n\nbackend evals",
    );
    expect(buildAutoNextKickoff(SKILL_MARKDOWN, "backend evals")).not.toContain(
      "name: auto-next",
    );
    expect(buildAutoNextSessionName("")).toBe("Auto next");
    expect(buildAutoNextSessionName("backend evals")).toBe(
      "Auto next: backend evals",
    );
  });

  it("opens a fresh named session and sends the expanded skill", async () => {
    const harness = createHarness();
    const context = createContext();

    await harness.commands
      .get("auto-next")!
      .handler(" backend\n evals ", context.ctx);

    expect(context.newSessionCalls).toBe(1);
    expect(context.sessionNames).toEqual(["Auto next: backend evals"]);
    expect(context.messages).toHaveLength(1);
    expect(context.messages[0]).toContain("# Auto Next");
    expect(context.messages[0]).toContain("AUTO_NEXT_FRESH_SESSION: true");
    expect(context.messages[0]).toContain("backend evals");
  });

  it("loads the deployed skill through the default path", async () => {
    const harness = createHarness(null);
    const context = createContext();

    await harness.commands.get("auto-next")!.handler("", context.ctx);

    expect(context.messages[0]).toContain("Always run Autoplan");
    expect(context.messages[0]).toContain("Approve and implement");
    expect(context.messages[0]).toContain('exact approved `.plan` field');
    expect(context.messages[0]).toContain('`merge`: `false`');
    expect(context.messages[0]).toContain('`approval`: `{ "mode": "required" }`');
    expect(context.messages[0]).toContain("including an effect automatically triggered by a merge");
    expect(context.messages[0]).toContain("Ask for a separate explicit approval to merge only that pull request");
    expect(context.messages[0]).toContain("Treat merge approval as single-use");
    expect(context.messages[0]).toContain("Never bundle approval for multiple pull");
    expect(context.messages[0]).toContain("All environments are eligible only when");
    expect(context.messages[0]).toContain("apply only the exact reviewed saved plan");
    expect(context.messages[0]).not.toContain("name: auto-next");
  });

  it("refuses session replacement while the agent is busy", async () => {
    const harness = createHarness();
    const context = createContext({ idle: false });

    await harness.commands.get("auto-next")!.handler("", context.ctx);

    expect(context.newSessionCalls).toBe(0);
    expect(context.notifications).toEqual([
      ["Wait for the current turn to finish before using /auto-next", "warning"],
    ]);
  });

  it("keeps the current session when the skill cannot load", async () => {
    const harness = createHarness(async () => {
      throw new Error("missing skill");
    });
    const context = createContext();

    await harness.commands.get("auto-next")!.handler("", context.ctx);

    expect(context.newSessionCalls).toBe(0);
    expect(context.notifications).toEqual([
      ["Unable to load the Auto Next skill: missing skill", "error"],
    ]);
  });

  it("reports a cancelled session replacement", async () => {
    const harness = createHarness();
    const context = createContext({ cancelled: true });

    await harness.commands.get("auto-next")!.handler("", context.ctx);

    expect(context.newSessionCalls).toBe(1);
    expect(context.notifications).toEqual([["New session cancelled", "info"]]);
  });
});
