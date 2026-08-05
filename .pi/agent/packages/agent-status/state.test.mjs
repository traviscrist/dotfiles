import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	clearStatus,
	containsSensitiveMaterial,
	createRuntimeState,
	isMeaningfulTodoTransition,
	MAX_SUMMARY_LENGTH,
	MAX_SUMMARY_LINES,
	normalizeSummary,
	publishStatus,
	recordToolProgress,
	replayStatus,
	STATE_ENTRY_TYPE,
	TOOLS_BEFORE_REMINDER,
} from "./state.ts";

const firstStatus = { phase: "implementing", summary: "Building the extension.", updatedAt: 10 };
const secondStatus = { phase: "validating", summary: "Running focused tests.", updatedAt: 20 };

function toolResult(status) {
	return {
		type: "message",
		message: { role: "toolResult", toolName: "status_update", details: { version: 1, status } },
	};
}

describe("status replay", () => {
	it("uses the latest valid branch event and honors clear tombstones", () => {
		const entries = [
			toolResult(firstStatus),
			{ type: "message", message: { role: "toolResult", toolName: "other", details: { version: 1, status: secondStatus } } },
			{ type: "custom", customType: STATE_ENTRY_TYPE, data: { version: 1, status: null } },
		];
		assert.equal(replayStatus(entries), null);
		assert.deepEqual(replayStatus([...entries, toolResult(secondStatus)]), secondStatus);
	});

	it("ignores malformed, unknown-version, oversized, and too-tall snapshots", () => {
		const malformed = [
			{ type: "custom", customType: STATE_ENTRY_TYPE, data: { version: 2, status: secondStatus } },
			toolResult({ ...secondStatus, summary: "x".repeat(MAX_SUMMARY_LENGTH + 1) }),
			toolResult({ ...secondStatus, summary: Array.from({ length: MAX_SUMMARY_LINES + 1 }, () => "line").join("\n") }),
			toolResult({ ...secondStatus, phase: "unknown" }),
			toolResult({ ...secondStatus, summary: "token=abcdefghijklmnop" }),
			toolResult({ ...secondStatus, summary: "Unsafe\u001b[31m status" }),
		];
		assert.equal(replayStatus(malformed), null);
	});
});

describe("progress reminders", () => {
	it("marks meaningful todo transitions due immediately", () => {
		const result = { details: { action: "update", params: { status: "in_progress" }, tasks: [], nextId: 2 } };
		const state = createRuntimeState();
		assert.equal(isMeaningfulTodoTransition(result), true);
		assert.equal(recordToolProgress(state, "todo", result, false), true);
		assert.equal(state.statusDue, true);
	});

	it("coalesces ordinary meaningful tools until the threshold", () => {
		const state = createRuntimeState();
		for (let count = 1; count < TOOLS_BEFORE_REMINDER; count++) {
			recordToolProgress(state, "edit", {}, false);
			assert.equal(state.statusDue, false);
		}
		recordToolProgress(state, "bash", {}, false);
		assert.equal(state.statusDue, true);
	});

	it("ignores reads, errors, and the status tool itself", () => {
		const state = createRuntimeState();
		assert.equal(recordToolProgress(state, "read", {}, false), false);
		assert.equal(recordToolProgress(state, "edit", {}, true), false);
		assert.equal(recordToolProgress(state, "status_update", {}, false), false);
		assert.deepEqual(state, createRuntimeState());
	});

	it("publishing and clearing reset reminder state", () => {
		const state = createRuntimeState();
		recordToolProgress(state, "todo", { details: { action: "update", params: { status: "completed" } } }, false);
		publishStatus(state, secondStatus);
		assert.deepEqual(state, { status: secondStatus, meaningfulToolsSinceUpdate: 0, statusDue: false });
		clearStatus(state);
		assert.deepEqual(state, createRuntimeState());
	});
});

describe("summary safety", () => {
	it("normalizes each line while preserving meaningful line breaks", () => {
		assert.equal(
			normalizeSummary(" \r\n - Built   the \u001b[31mextension.\u001b[0m \n\n - Running\t tests. "),
			"- Built the extension.\n- Running tests.",
		);
		assert.equal(normalizeSummary("Safe\u0000 status"), "Safe status");
	});

	it("detects high-confidence credential values without rejecting ordinary prose", () => {
		assert.equal(containsSensitiveMaterial("token=abcdefghijklmnop"), true);
		assert.equal(containsSensitiveMaterial("Bearer abcdefghijklmnop"), true);
		assert.equal(containsSensitiveMaterial("Added API key validation."), false);
	});
});
