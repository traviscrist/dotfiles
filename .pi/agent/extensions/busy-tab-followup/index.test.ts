import { describe, expect, it, mock } from "bun:test";
import { CustomEditor } from "../../npm/node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/components/custom-editor.js";
import { matchesKey } from "../../npm/node_modules/@earendil-works/pi-tui/dist/index.js";

mock.module("@earendil-works/pi-coding-agent", () => ({ CustomEditor }));
mock.module("@earendil-works/pi-tui", () => ({ matchesKey }));

const { createBusyTabFollowupExtension } = await import("./index.ts");

const CHAIN_ENTRY = {
	type: "custom",
	customType: "next-chain-suggestion",
	data: {
		version: 1,
		title: "Add staging eval composition",
		prompt: "Plan the smallest staging eval composition slice.",
	},
};

function createEditor(entries: unknown[]) {
	const handlers = new Map<string, (event: unknown, ctx: any) => void>();
	let factory: ((tui: any, theme: any, keybindings: any) => any) | undefined;
	createBusyTabFollowupExtension({
		on(name: string, handler: (event: unknown, ctx: any) => void) {
			handlers.set(name, handler);
		},
	} as any);
	handlers.get("session_start")!({}, {
		isIdle: () => true,
		sessionManager: { getBranch: () => entries },
		ui: {
			setEditorComponent(value: typeof factory) {
				factory = value;
			},
		},
	});
	const editor = factory!(
		{ requestRender() {} },
		{ borderColor: "" },
		{ matches: () => false },
	);
	return editor;
}

describe("busy tab editor next chaining", () => {
	it("rewrites exact next before submitting it", () => {
		const editor = createEditor([CHAIN_ENTRY]);
		let submitted: string | undefined;
		editor.onSubmit = (text: string) => {
			submitted = text;
		};
		editor.setText("next");
		editor.handleInput("\r");
		expect(submitted).toBe("/next --chain");
	});

	it("preserves ordinary input when no suggestion exists", () => {
		const editor = createEditor([]);
		let submitted: string | undefined;
		editor.onSubmit = (text: string) => {
			submitted = text;
		};
		editor.setText("next");
		editor.handleInput("\r");
		expect(submitted).toBe("next");
	});
});
