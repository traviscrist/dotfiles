import { describe, expect, it, mock } from "bun:test";
import { CustomEditor } from "../../npm/node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/components/custom-editor.js";
import { matchesKey } from "../../npm/node_modules/@earendil-works/pi-tui/dist/index.js";

mock.module("@earendil-works/pi-coding-agent", () => ({ CustomEditor }));
mock.module("@earendil-works/pi-tui", () => ({ matchesKey }));
const { createBusyTabFollowupExtension } = await import("./index.ts");

function harness(options: { idle?: boolean; autocomplete?: boolean; fail?: boolean } = {}) {
	const handlers = new Map<string, (event: unknown, ctx: any) => void>();
	const messages: unknown[][] = [];
	const notices: unknown[][] = [];
	let factory: any;
	createBusyTabFollowupExtension({
		on: (name: string, handler: any) => handlers.set(name, handler),
		sendUserMessage: (...args: unknown[]) => {
			if (options.fail) throw new Error("queue unavailable");
			messages.push(args);
		},
	} as any);
	handlers.get("session_start")!({}, {
		isIdle: () => options.idle ?? false,
		sessionManager: { getBranch: () => [] },
		ui: {
			setEditorComponent: (value: any) => { factory = value; },
			notify: (...args: unknown[]) => notices.push(args),
		},
	});
	const editor = factory({ requestRender() {} }, { borderColor: "" }, {
		matches: (data: string, action: string) => action === "app.message.followUp" && data === "\x1b\r",
	});
	if (options.autocomplete) editor.isShowingAutocomplete = () => true;
	return { editor, handlers, messages, notices };
}

describe("busy-tab-followup preserved keyboard behavior", () => {
	it("Tab while busy queues followUp and clears the editor", () => {
		const h = harness();
		h.editor.setText("  continue here  ");
		h.editor.handleInput("\t");
		expect(h.messages).toEqual([["continue here", { deliverAs: "followUp" }]]);
		expect(h.editor.getText()).toBe("");
		expect(h.notices).toEqual([["Follow-up queued", "info"]]);
	});

	it("idle Tab and active autocomplete do not queue a follow-up", () => {
		for (const options of [{ idle: true }, { autocomplete: true }]) {
			const h = harness(options);
			h.editor.setText("text");
			h.editor.handleInput("\t");
			expect(h.messages).toEqual([]);
		}
	});

	it("empty busy input does not queue; send failure restores typed input", () => {
		const empty = harness();
		empty.editor.handleInput("\t");
		expect(empty.messages).toEqual([]);
		const failed = harness({ fail: true });
		failed.editor.setText("keep this");
		failed.editor.handleInput("\t");
		expect(failed.editor.getText()).toBe("keep this");
		expect(failed.notices).toEqual([["queue unavailable", "error"]]);
	});

	it("native Alt+Enter still reaches the app follow-up action", () => {
		const h = harness();
		let followedUp = 0;
		h.editor.onAction("app.message.followUp", () => { followedUp += 1; });
		h.editor.setText("native queue");
		h.editor.handleInput("\x1b\r");
		expect(followedUp).toBe(1);
		expect(h.messages).toEqual([]);
	});

	it("session shutdown disables busy Tab interception", () => {
		const h = harness();
		h.handlers.get("session_shutdown")!({}, {});
		h.editor.setText("no stale queue");
		h.editor.handleInput("\t");
		expect(h.messages).toEqual([]);
	});
});
