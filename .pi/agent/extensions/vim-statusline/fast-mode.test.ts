import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isFastModeStatusActive, thinkingSegmentText } from "./fast-mode.ts";

describe("fast mode status", () => {
	it("reads session state from Pi extension status", () => {
		assert.equal(isFastModeStatusActive("fast"), true);
		assert.equal(isFastModeStatusActive(undefined), false);
		assert.equal(isFastModeStatusActive("disabled"), false);
	});

	it("places the lightning bolt immediately before the thinking level", () => {
		assert.equal(thinkingSegmentText("high", true), " ⚡ high ");
		assert.equal(thinkingSegmentText("high", false), " high ");
	});
});
