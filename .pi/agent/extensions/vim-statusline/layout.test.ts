import { describe, expect, it, mock } from "bun:test";
import { truncateToWidth, visibleWidth } from "../../npm/node_modules/@earendil-works/pi-tui/dist/index.js";

mock.module("@earendil-works/pi-coding-agent", () => ({ getAgentDir: () => "/tmp/pi-agent" }));
mock.module("@earendil-works/pi-tui", () => ({ truncateToWidth, visibleWidth }));

const { lensSegments, lensSummary, makeFooterLine } = await import("./index.ts");

const green = "\x1b[38;2;167;192;128m";
const dimBackground = "\x1b[48;2;35;42;46m";
const reset = "\x1b[0m";

describe("statusline layout", () => {
	it("fits the fast-mode lightning bolt within the reported terminal width", () => {
		const left = `${green}${dimBackground} IDLE   feat/golf-scramble-parity  aurabear  󰒡 Inactive ${reset}`;
		const right = `${green}${dimBackground} ⚡ high  gpt 5.6 sol  0% ${reset}`;
		const line = makeFooterLine(107, left, right);

		expect(visibleWidth("⚡")).toBe(2);
		expect(visibleWidth(line)).toBe(107);
	});

	it("never exceeds narrow or wide render widths", () => {
		const left = `${green} IDLE  分支 e\u0301 ${"x".repeat(160)}${reset}`;
		const right = `${dimBackground} ⚡ high  模型 ${"y".repeat(80)}${reset}`;

		for (let width = 1; width <= 160; width++) {
			expect(visibleWidth(makeFooterLine(width, left, right)), `overflow at width ${width}`).toBeLessThanOrEqual(width);
		}
	});

	it("scopes a clean result to the number of files checked", () => {
		const state = {
			languages: new Set(["jsts"]),
			files: new Map([
				["/repo/a.ts", { name: "a.ts", errors: 0, warnings: 0, blocking: 0, touchedAt: 1 }],
				["/repo/b.ts", { name: "b.ts", errors: 0, warnings: 0, blocking: 0, touchedAt: 2 }],
			]),
			lastDurationMs: 42,
		};

		expect(lensSummary(state, undefined).text).toContain("2 files checked");
		const rendered = lensSegments(state, undefined).map((segment) => segment.text).join("");
		expect(rendered).not.toContain("a.ts");
		expect(rendered).not.toContain("b.ts");
		expect(rendered).not.toContain("42ms");
	});

	it("shows only finding-bearing filenames when diagnostics exist", () => {
		const state = {
			languages: new Set(["jsts"]),
			files: new Map([
				["/repo/clean.ts", { name: "clean.ts", errors: 0, warnings: 0, blocking: 0, touchedAt: 3 }],
				["/repo/warn.ts", { name: "warn.ts", errors: 0, warnings: 2, blocking: 0, touchedAt: 2 }],
				["/repo/block.ts", { name: "block.ts", errors: 1, warnings: 0, blocking: 1, touchedAt: 1 }],
			]),
			lastDurationMs: 42,
		};

		const rendered = lensSegments(state, undefined).map((segment) => segment.text).join("");
		expect(rendered).toContain("1E");
		expect(rendered).toContain("2W");
		expect(rendered).toContain("warn.ts");
		expect(rendered).toContain("block.ts");
		expect(rendered).not.toContain("clean.ts");
		expect(rendered).toContain("42ms");
	});
});
