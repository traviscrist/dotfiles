import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isFastModeActive, thinkingSegmentText, type FastModeConfig } from "./fast-mode.ts";

const activeConfig: FastModeConfig = {
	enabled: true,
	targets: [
		{ provider: "openai-codex", model: "gpt-5.6-sol", serviceTier: "priority" },
	],
};

describe("fast mode status", () => {
	it("shows fast mode only for an enabled exact provider/model target", () => {
		assert.equal(isFastModeActive(activeConfig, { provider: "openai-codex", id: "gpt-5.6-sol" }), true);
		assert.equal(isFastModeActive(activeConfig, { provider: "openai", id: "gpt-5.6-sol" }), false);
		assert.equal(isFastModeActive(activeConfig, { provider: "openai-codex", id: "gpt-5.6" }), false);
		assert.equal(isFastModeActive({ ...activeConfig, enabled: false }, { provider: "openai-codex", id: "gpt-5.6-sol" }), false);
	});

	it("places the lightning bolt immediately before the thinking level", () => {
		assert.equal(thinkingSegmentText("high", true), " ⚡ high ");
		assert.equal(thinkingSegmentText("high", false), " high ");
	});
});
