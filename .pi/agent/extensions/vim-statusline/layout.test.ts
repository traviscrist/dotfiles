import { describe, expect, it, mock } from "bun:test";
import { truncateToWidth, visibleWidth } from "../../npm/node_modules/@earendil-works/pi-tui/dist/index.js";

mock.module("@earendil-works/pi-coding-agent", () => ({ getAgentDir: () => "/tmp/pi-agent" }));
mock.module("@earendil-works/pi-tui", () => ({ truncateToWidth, visibleWidth }));

const { makeFooterLine } = await import("./index.ts");

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
});
