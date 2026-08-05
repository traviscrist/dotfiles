import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { visibleWidth } from "../../npm/node_modules/@earendil-works/pi-tui/dist/index.js";
import agentStatus, { renderStatus } from "./extension.ts";

function spy(implementation = () => undefined) {
	const calls = [];
	const fn = (...args) => {
		calls.push({ arguments: args });
		return implementation(...args);
	};
	fn.calls = calls;
	return fn;
}

function createHarness(options = {}) {
	let currentId = options.id ?? "session-1";
	let currentBranch = options.branch ?? [];
	const handlers = new Map();
	const tools = new Map();
	const commands = new Map();
	const appendEntry = spy();
	const requestRender = spy();
	const notify = spy();
	const setWidgetCalls = [];
	let component;
	const theme = { fg: (color, text) => `${color}:${text}` };
	const ui = {
		theme,
		notify,
		setWidget: spy((key, factory, placement) => {
			setWidgetCalls.push([key, factory, placement]);
			if (typeof factory === "function") component = factory({ requestRender }, theme);
		}),
	};
	const ctx = {
		hasUI: options.hasUI ?? true,
		ui,
		sessionManager: {
			getSessionId: () => currentId,
			getBranch: () => currentBranch,
		},
	};
	const pi = {
		appendEntry,
		on: (event, handler) => handlers.set(event, [...(handlers.get(event) ?? []), handler]),
		registerCommand: (name, command) => commands.set(name, command),
		registerTool: (tool) => tools.set(tool.name, tool),
	};
	const emit = async (event, payload = {}, targetCtx = ctx) => {
		let result;
		for (const handler of handlers.get(event) ?? []) result = await handler(payload, targetCtx);
		return result;
	};

	agentStatus(pi);
	return {
		appendEntry,
		commands,
		component: () => component,
		ctx,
		emit,
		notify,
		requestRender,
		setBranch: (branch) => {
			currentBranch = branch;
		},
		setId: (id) => {
			currentId = id;
		},
		setWidgetCalls,
		tools,
	};
}

describe("agent status extension", () => {
	it("reserves the above-editor slot at session start, even while empty", async () => {
		const harness = createHarness();
		await harness.emit("session_start");
		assert.equal(harness.setWidgetCalls.length, 1);
		assert.equal(harness.setWidgetCalls[0][0], "agent-status");
		assert.deepEqual(harness.setWidgetCalls[0][2], { placement: "aboveEditor" });
		assert.deepEqual(harness.component().render(80), []);

		await harness.emit("session_compact");
		await harness.emit("session_tree");
		assert.equal(harness.setWidgetCalls.length, 1);
	});

	it("publishes, renders, and replays the latest tool snapshot", async () => {
		const harness = createHarness();
		await harness.emit("session_start");
		const result = await harness.tools.get("status_update").execute(
			"call-1",
			{ phase: "implementing", summary: "  Built   the status package.  " },
			new AbortController().signal,
			undefined,
			harness.ctx,
		);
		assert.equal(result.details.status.summary, "Built the status package.");
		assert.deepEqual(harness.component().render(80), [
			"accent:◆ Status · implementing",
			"text:  Built the status package.",
			"",
		]);
		assert.equal(harness.requestRender.calls.length, 2);

		const replayHarness = createHarness({
			branch: [{ type: "message", message: { role: "toolResult", toolName: "status_update", details: result.details } }],
		});
		await replayHarness.emit("session_start");
		assert.match(replayHarness.component().render(80)[1], /Built the status package/);
	});

	it("preserves multiline bullet summaries and advertises the preferred format", async () => {
		const harness = createHarness();
		await harness.emit("session_start");
		const tool = harness.tools.get("status_update");
		assert.match(tool.description, /2–4 line bullet summary/);
		assert.match(tool.parameters.properties.summary.description, /2–4 bullet lines/);
		assert.equal(tool.parameters.properties.summary.maxLength, 480);

		const policy = await harness.emit("before_agent_start", { systemPrompt: "base" });
		assert.match(policy.systemPrompt, /Prefer 2–4 concise bullet lines/);
		const result = await tool.execute(
			"multiline",
			{ phase: "validating", summary: "  - Added multiline support.  \n\n - Running focused tests. " },
			null,
			undefined,
			harness.ctx,
		);
		assert.equal(result.details.status.summary, "- Added multiline support.\n- Running focused tests.");
		assert.deepEqual(harness.component().render(80), [
			"warning:◐ Status · validating",
			"text:  - Added multiline support.",
			"text:  - Running focused tests.",
			"",
		]);
	});

	it("rejects blank, oversized, too-tall, or sensitive summaries and strips terminal controls", async () => {
		const harness = createHarness();
		await harness.emit("session_start");
		const tool = harness.tools.get("status_update");
		assert.throws(
			() => tool.execute("blank", { phase: "implementing", summary: "  \n " }, null, undefined, harness.ctx),
			/non-whitespace/,
		);
		assert.throws(
			() => tool.execute("oversized", { phase: "implementing", summary: "x".repeat(481) }, null, undefined, harness.ctx),
			/480 characters/,
		);
		assert.throws(
			() => tool.execute("too-tall", { phase: "implementing", summary: "a\nb\nc\nd\ne" }, null, undefined, harness.ctx),
			/4 lines/,
		);
		assert.throws(
			() => tool.execute("secret", { phase: "implementing", summary: "token=abcdefghijklmnop" }, null, undefined, harness.ctx),
			/credentials/,
		);
		const result = await tool.execute(
			"ansi",
			{ phase: "implementing", summary: "Safe \u001b[31mstatus\u001b[0m" },
			null,
			undefined,
			harness.ctx,
		);
		assert.equal(result.details.status.summary, "Safe status");
	});

	it("injects exactly one transient reminder until status is published", async () => {
		const harness = createHarness();
		await harness.emit("session_start");
		await harness.emit("tool_execution_end", {
			toolName: "todo",
			result: { details: { action: "update", params: { status: "completed" }, tasks: [], nextId: 2 } },
			isError: false,
		});
		const due = await harness.emit("context", { messages: [] });
		assert.equal(due.messages.length, 1);
		assert.equal(due.messages[0].customType, "agent-status-reminder.v1");
		assert.equal(due.messages[0].display, false);
		const repeated = await harness.emit("context", { messages: due.messages });
		assert.equal(repeated.messages.length, 1);
		assert.equal(repeated.messages[0].customType, "agent-status-reminder.v1");

		await harness.tools.get("status_update").execute(
			"call-2",
			{ phase: "validating", summary: "Implementation complete; running tests." },
			new AbortController().signal,
			undefined,
			harness.ctx,
		);
		assert.equal(await harness.emit("context", { messages: [] }), undefined);
	});

	it("replays divergent branch statuses on tree navigation", async () => {
		const first = { phase: "implementing", summary: "Branch one.", updatedAt: 1 };
		const second = { phase: "validating", summary: "Branch two.", updatedAt: 2 };
		const entry = (status) => ({
			type: "message",
			message: { role: "toolResult", toolName: "status_update", details: { version: 1, status } },
		});
		const harness = createHarness({ branch: [entry(first)] });
		await harness.emit("session_start");
		assert.match(harness.component().render(80)[1], /Branch one/);
		harness.setBranch([entry(second)]);
		await harness.emit("session_tree");
		assert.match(harness.component().render(80)[1], /Branch two/);
		harness.setBranch([entry(first), { type: "custom", customType: "agent-status-state.v1", data: { version: 1, status: null } }]);
		await harness.emit("session_tree");
		assert.deepEqual(harness.component().render(80), []);
	});

	it("keeps session state isolated and disposes only the foreground widget", async () => {
		const harness = createHarness();
		await harness.emit("session_start");
		await harness.tools.get("status_update").execute(
			"parent",
			{ phase: "implementing", summary: "Parent status." },
			null,
			undefined,
			harness.ctx,
		);
		const childCtx = {
			...harness.ctx,
			hasUI: false,
			sessionManager: { getSessionId: () => "child", getBranch: () => [] },
		};
		await harness.tools.get("status_update").execute(
			"child",
			{ phase: "validating", summary: "Child status." },
			null,
			undefined,
			childCtx,
		);
		assert.match(harness.component().render(80)[1], /Parent status/);
		await harness.emit("session_shutdown", {}, childCtx);
		assert.notEqual(harness.setWidgetCalls.at(-1)[1], undefined);
		await harness.emit("session_shutdown");
		assert.equal(harness.setWidgetCalls.at(-1)[1], undefined);
	});

	it("clears through the command and persists a branch tombstone", async () => {
		const harness = createHarness();
		await harness.emit("session_start");
		await harness.tools.get("status_update").execute(
			"call-3",
			{ phase: "done", summary: "Everything passed." },
			new AbortController().signal,
			undefined,
			harness.ctx,
		);
		await harness.commands.get("agent-status").handler("clear", harness.ctx);
		assert.deepEqual(harness.appendEntry.calls[0].arguments, [
			"agent-status-state.v1",
			{ version: 1, status: null },
		]);
		assert.deepEqual(harness.component().render(80), []);
		assert.deepEqual(harness.notify.calls[0].arguments, ["Agent status cleared", "info"]);
	});

	it("does not bind widgets or inject policy in a headless child", async () => {
		const harness = createHarness({ hasUI: false, id: "child" });
		await harness.emit("session_start");
		assert.equal(harness.setWidgetCalls.length, 0);
		assert.equal(await harness.emit("before_agent_start", { systemPrompt: "base" }), undefined);
	});

	it("places the local package immediately before rpiv-todo in settings", async () => {
		const settings = JSON.parse(await readFile(new URL("../../settings.json", import.meta.url), "utf8"));
		const statusIndex = settings.packages.indexOf("./packages/agent-status");
		assert.ok(statusIndex >= 0);
		assert.equal(settings.packages[statusIndex + 1], "npm:@juicesharp/rpiv-todo");
	});
});

describe("status rendering", () => {
	it("wraps every summary line to terminal width", () => {
		const theme = { fg: (_color, text) => text };
		const lines = renderStatus(
			{
				status: { phase: "blocked", summary: "A deliberately long blocker summary", updatedAt: 1 },
				meaningfulToolsSinceUpdate: 0,
				statusDue: false,
			},
			theme,
			12,
		);
		assert.ok(lines.length > 3);
		assert.ok(lines.slice(0, -1).every((line) => visibleWidth(line) <= 12));
	});
});
