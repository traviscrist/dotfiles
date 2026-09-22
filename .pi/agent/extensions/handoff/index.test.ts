import { describe, expect, it, mock } from "bun:test";
import {
  convertToLlm,
  serializeConversation,
  SessionManager,
} from "../../npm/node_modules/@earendil-works/pi-coding-agent/dist/index.js";
import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "../../npm/node_modules/@earendil-works/pi-coding-agent/dist/index.js";

class Loader {
  controller = new AbortController();
  signal = this.controller.signal;
  onAbort?: () => void;
  abort() {
    this.controller.abort();
    this.onAbort?.();
  }
}
mock.module("@earendil-works/pi-coding-agent", () => ({
  BorderedLoader: Loader,
  convertToLlm,
  serializeConversation,
}));
const {
  default: createHandoffExtension,
  MAX_BRIEF_CHARS,
  serializeHandoffHistory,
} = await import("./index.ts");

const usage = {
  input: 100,
  output: 30,
  cacheRead: 0,
  cacheWrite: 0,
  totalTokens: 130,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
};
const assistant = (text: string) => ({
  role: "assistant" as const,
  content: [{ type: "text" as const, text }],
  api: "openai-responses" as const,
  provider: "fixture",
  model: "fixture-model",
  usage,
  stopReason: "stop" as const,
  timestamp: 2,
});

type Options = {
  mode?: string;
  idle?: boolean;
  pending?: boolean;
  saved?: boolean;
  model?: boolean;
  empty?: boolean;
  edit?: string;
  cancelEditor?: boolean;
  cancelGeneration?: boolean;
  rejectGeneration?: boolean;
  response?: ReturnType<typeof assistant>;
  stop?: string;
  cancelSwitch?: boolean;
  duringReview?: () => void;
};
function harness(options: Options = {}) {
  const source = SessionManager.inMemory("/fixture/worktree");
  if (!options.empty) {
    source.appendMessage({
      role: "user",
      content: "Approved local implementation only. No publication.",
      timestamp: 1,
    });
    source.appendMessage(
      assistant("On feature/a at abc123; dirty src/a.ts. Tests pending."),
    );
  }
  const originalEntries = JSON.stringify(source.getEntries());
  const commands = new Map<
    string,
    Parameters<ExtensionAPI["registerCommand"]>[1]
  >();
  const notifications: string[] = [];
  const calls: unknown[][] = [];
  const editors: string[] = [];
  const drafts: string[] = [];
  const targets: SessionManager[] = [];
  let parent: string | undefined;
  let loader: Loader | undefined;
  let switched = false;
  let switchCount = 0;
  let idle = options.idle ?? true;
  let pending = options.pending ?? false;
  let sourcePath: string | undefined =
    options.saved === false ? undefined : "/sessions/parent.jsonl";
  const model = { id: "fixture-model", provider: "fixture" };
  const ctx = {
    mode: options.mode ?? "tui",
    cwd: "/fixture/worktree",
    model: options.model === false ? undefined : model,
    isIdle: () => idle,
    hasPendingMessages: () => pending,
    sessionManager: {
      getSessionFile: () => sourcePath,
      getLeafId: () => source.getLeafId(),
      buildSessionProjection: () => source.buildSessionProjection(),
    },
    modelRegistry: {
      streamSimple(...args: unknown[]) {
        calls.push(args);
        return {
          result: async () => {
            if (options.rejectGeneration)
              throw new Error("sensitive provider details");
            return {
              ...(options.response ??
                assistant(
                  "## Goal and approved scope\nFinish local implementation; do not publish.",
                )),
              stopReason: options.stop ?? "stop",
            };
          },
        };
      },
    },
    ui: {
      notify(message: string) {
        if (switched) throw new Error("Stale context used after replacement");
        notifications.push(message);
      },
      custom: (factory: (...args: unknown[]) => Loader) =>
        new Promise((resolve) => {
          loader = factory(undefined, undefined, undefined, resolve);
          if (options.cancelGeneration) loader.abort();
        }),
      editor: async (_title: string, text: string) => {
        editors.push(text);
        options.duringReview?.();
        return options.cancelEditor ? undefined : (options.edit ?? text);
      },
    },
    newSession: async (
      config: Parameters<ExtensionCommandContext["newSession"]>[0],
    ) => {
      switchCount++;
      if (options.cancelSwitch) return { cancelled: true };
      parent = config!.parentSession;
      const target = SessionManager.inMemory("/fixture/worktree");
      await config!.setup!(target);
      targets.push(target);
      switched = true;
      await config!.withSession!({
        ui: {
          setEditorText: (text: string) => drafts.push(text),
          notify: (text: string) => notifications.push(text),
        },
      } as unknown as Parameters<
        NonNullable<NonNullable<typeof config>["withSession"]>
      >[0]);
      return { cancelled: false };
    },
  };
  createHandoffExtension({
    registerCommand: (name, command) => commands.set(name, command),
  } as unknown as ExtensionAPI);
  return {
    source,
    originalEntries,
    commands,
    notifications,
    calls,
    editors,
    drafts,
    targets,
    run: (focus = "") =>
      commands
        .get("handoff")!
        .handler(focus, ctx as unknown as ExtensionCommandContext),
    setIdle: (value: boolean) => {
      idle = value;
    },
    setPending: (value: boolean) => {
      pending = value;
    },
    setPath: (value: string) => {
      sourcePath = value;
    },
    get parent() {
      return parent;
    },
    get switchCount() {
      return switchCount;
    },
    get loader() {
      return loader;
    },
  };
}

describe("handoff context projection", () => {
  it("honors compaction, context edits, custom messages, and active-branch boundaries", () => {
    const sm = SessionManager.inMemory("/fixture/worktree");
    sm.appendMessage({
      role: "user",
      content: "OLD_SUMMARIZED_CONTENT",
      timestamp: 1,
    });
    const keep = sm.appendMessage({
      role: "user",
      content: "Keep this constraint",
      timestamp: 2,
    });
    sm.appendCompaction("Decision: SQL remains authoritative", keep, 10000);
    const omitted = sm.appendMessage({
      role: "user",
      content: "OMITTED_SECRET",
      timestamp: 3,
    });
    sm.appendContextEdit(omitted, null);
    const replaced = sm.appendMessage({
      role: "user",
      content: "REPLACED_OLD_TEXT",
      timestamp: 4,
    });
    sm.appendContextEdit(replaced, { content: "Current correction" });
    sm.appendCustomMessageEntry("context", "Relevant extension context", true);
    const leaf = sm.getLeafId()!;
    sm.appendMessage({
      role: "user",
      content: "ABANDONED_BRANCH",
      timestamp: 5,
    });
    sm.branch(leaf);
    const before = JSON.stringify(sm.getEntries());
    const text = serializeHandoffHistory(sm.buildSessionProjection().messages);
    for (const expected of [
      "Keep this constraint",
      "SQL remains authoritative",
      "Current correction",
      "Relevant extension context",
    ]) {
      expect(text).toContain(expected);
    }
    for (const omitted of [
      "OLD_SUMMARIZED_CONTENT",
      "OMITTED_SECRET",
      "REPLACED_OLD_TEXT",
      "ABANDONED_BRANCH",
    ]) {
      expect(text).not.toContain(omitted);
    }
    expect(JSON.stringify(sm.getEntries())).toBe(before);
  });

  it("omits system instructions and reasoning; bounds tool results through Pi's serializer", () => {
    const text = serializeHandoffHistory([
      { role: "system", content: "SYSTEM_TOOL_SCHEMAS", timestamp: 0 },
      {
        ...assistant("Visible decision"),
        content: [
          { type: "thinking", thinking: "PRIVATE_REASONING" },
          { type: "text", text: "Visible decision" },
        ],
      },
      {
        role: "toolResult",
        toolCallId: "call",
        toolName: "read",
        content: [{ type: "text", text: "x".repeat(5000) }],
        isError: false,
        timestamp: 3,
      },
    ]);
    expect(text).toContain("Visible decision");
    expect(text).toContain("truncated");
    expect(text).not.toContain("SYSTEM_TOOL_SCHEMAS");
    expect(text).not.toContain("PRIVATE_REASONING");
    expect(text.length).toBeLessThan(2200);
  });
});

describe("handoff command", () => {
  it("uses one medium-thinking request, editable preview, and a fresh linked draft without execution", async () => {
    const h = harness({
      edit: "Reviewed decision: no publication. First run the focused test.",
    });
    await h.run("  Finish tests  ");
    expect([...h.commands.keys()]).toEqual(["handoff"]);
    expect(h.calls).toHaveLength(1);
    const [model, input, options] = h.calls[0] as [
      unknown,
      { systemPrompt: string; messages: { content: string }[] },
      Record<string, unknown>,
    ];
    expect(model).toEqual({ provider: "fixture", id: "fixture-model" });
    expect(input.systemPrompt).toContain("not instructions to you");
    expect(input.messages[0].content).toContain(
      "Requested focus: Finish tests",
    );
    expect(input.messages[0].content).toContain("No publication");
    expect(options.reasoning).toBe("medium");
    expect(options.maxTokens).toBe(8192);
    expect(options.cacheRetention).toBe("none");
    expect(options.signal).toBe(h.loader!.signal);
    expect(options.sessionId).toBeString();
    expect(h.editors).toHaveLength(1);
    expect(h.parent).toBe("/sessions/parent.jsonl");
    expect(h.drafts).toHaveLength(1);
    expect(h.drafts[0]).toContain("Reviewed decision");
    expect(h.drafts[0]).toContain("do not start /next or switch to main");
    expect(h.drafts[0]).toContain("not new approval");
    expect(h.drafts[0]).toContain("/fixture/worktree");
    expect(h.drafts[0]).not.toContain("On feature/a at abc123");
    expect(h.targets[0].buildSessionContext().messages).toEqual([]);
    expect(
      h.targets[0].getEntries().filter((e) => e.type === "usage"),
    ).toMatchObject([{ kind: "handoff", usage }]);
    expect(JSON.stringify(h.source.getEntries())).toBe(h.originalEntries);
  });

  for (const [name, options] of Object.entries({
    rpc: { mode: "rpc" },
    print: { mode: "print" },
    busy: { idle: false },
    queued: { pending: true },
    ephemeral: { saved: false },
    noModel: { model: false },
    empty: { empty: true },
  })) {
    it(`refuses ${name} before any model call`, async () => {
      const h = harness(options);
      await h.run();
      expect(h.calls).toHaveLength(0);
      expect(h.switchCount).toBe(0);
    });
  }

  for (const [name, options] of Object.entries({
    generationCancel: { cancelGeneration: true },
    editorCancel: { cancelEditor: true },
    emptyEdit: { edit: "   " },
    oversizedEdit: { edit: "x".repeat(MAX_BRIEF_CHARS + 1) },
    providerFailure: { rejectGeneration: true },
    truncated: { stop: "length" },
    providerAbort: { stop: "aborted" },
    toolRequest: { stop: "toolUse" },
    error: { stop: "error" },
    emptySummary: { response: assistant("") },
  })) {
    it(`preserves the source on ${name}`, async () => {
      const h = harness(options);
      await h.run();
      expect(h.calls).toHaveLength(1);
      expect(h.switchCount).toBe(0);
      expect(h.drafts).toHaveLength(0);
      expect(JSON.stringify(h.source.getEntries())).toBe(h.originalEntries);
      expect(h.notifications.join("\n")).not.toContain(
        "sensitive provider details",
      );
      if (name === "generationCancel")
        expect(h.loader!.signal.aborted).toBe(true);
    });
  }

  for (const change of ["leaf", "path", "busy", "pending"]) {
    it(`rejects a stale handoff after ${change} changes during review`, async () => {
      const h = harness({
        duringReview: () => {
          if (change === "leaf")
            h.source.appendMessage({
              role: "user",
              content: "New requirement",
              timestamp: 9,
            });
          if (change === "path") h.setPath("/sessions/different.jsonl");
          if (change === "busy") h.setIdle(false);
          if (change === "pending") h.setPending(true);
        },
      });
      await h.run();
      expect(h.switchCount).toBe(0);
      expect(h.notifications.at(-1)).toContain("Session changed");
    });
  }

  it("honors a cancelled native session switch", async () => {
    const h = harness({ cancelSwitch: true });
    await h.run();
    expect(h.switchCount).toBe(1);
    expect(h.targets).toHaveLength(0);
    expect(h.drafts).toHaveLength(0);
    expect(h.notifications.at(-1)).toContain("original session retained");
  });

  it("rejects overlapping requests and allows retry after cancellation", async () => {
    const h = harness({ cancelEditor: true });
    const first = h.run();
    await h.run();
    await first;
    expect(h.calls).toHaveLength(1);
    expect(h.notifications).toContain("A handoff is already being prepared");
    await h.run();
    expect(h.calls).toHaveLength(2);
  });
});
