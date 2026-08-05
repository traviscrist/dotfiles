import { StringEnum, Type } from "../../npm/node_modules/@earendil-works/pi-ai/dist/index.js";
import type {
	BeforeAgentStartEvent,
	ContextEvent,
	ExtensionAPI,
	ExtensionContext,
	SessionShutdownEvent,
	ToolExecutionEndEvent,
} from "../../npm/node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/types.js";
import {
	clearStatus,
	CONTEXT_MESSAGE_TYPE,
	containsSensitiveMaterial,
	createRuntimeState,
	normalizeSummary,
	publishStatus,
	recordToolProgress,
	replayStatus,
	STATE_ENTRY_TYPE,
	STATUS_PHASES,
	TOOL_NAME,
	type RuntimeState,
	type StatusDetails,
	type StatusPhase,
} from "./state.js";
import { createStatusWidget, type StatusWidget } from "./status-widget.js";

export { renderStatus } from "./status-widget.js";

const COMMAND_NAME = "agent-status";
const STATUS_POLICY = `

[AGENT STATUS POLICY]
For multi-step work in the interactive parent session:
- Call status_update after the initial plan starts, after meaningful milestones or blockers, and before the final response when progress changed.
- Write one concise, human-readable sentence about the outcome and current focus. Do not narrate routine tool calls or duplicate the todo list.
- Use phase planning, implementing, validating, blocked, or done. Use blocked only for a real unresolved blocker and done only when the requested work is complete.
- Never include secrets, credentials, tokens, private user data, or raw sensitive payloads.`;
const DUE_CONTEXT = `[AGENT STATUS UPDATE DUE]
Meaningful progress changed since the latest status. Before more substantive work or the final response, call status_update with one concise outcome-and-current-focus sentence. Do not duplicate todos or narrate routine tool calls.`;

const StatusParamsSchema = Type.Object({
	phase: StringEnum(STATUS_PHASES, { description: "Current work phase" }),
	summary: Type.String({
		minLength: 1,
		maxLength: 180,
		description: "One concise human-readable sentence describing the outcome and current focus",
	}),
});

type StatusParams = { phase: StatusPhase; summary: string };

interface StatusRuntime {
	pi: ExtensionAPI;
	states: Map<string, RuntimeState>;
	widget: StatusWidget;
}

function sessionId(ctx: Pick<ExtensionContext, "sessionManager">): string {
	return ctx.sessionManager.getSessionId() ?? "__default__";
}

function isStaleContextError(error: unknown): boolean {
	return /stale after session replacement/.test(String(error));
}

function getState(runtime: StatusRuntime, id: string): RuntimeState {
	let state = runtime.states.get(id);
	if (!state) {
		state = createRuntimeState();
		runtime.states.set(id, state);
	}
	return state;
}

function executeStatus(runtime: StatusRuntime, params: StatusParams, ctx: ExtensionContext) {
	const summary = normalizeSummary(params.summary);
	if (!summary) throw new Error("Status summary must contain safe non-whitespace text");
	if (summary.length > 180) throw new Error("Status summary must be 180 characters or fewer");
	if (containsSensitiveMaterial(summary)) throw new Error("Status summary must not contain credentials or secret values");
	const id = sessionId(ctx);
	const status = { phase: params.phase, summary, updatedAt: Date.now() };
	publishStatus(getState(runtime, id), status);
	runtime.widget.requestRender(id);
	const details: StatusDetails = { version: 1, status };
	return Promise.resolve({
		content: [{ type: "text" as const, text: `Status updated · ${params.phase}: ${summary}` }],
		details,
	});
}

function handleCommand(runtime: StatusRuntime, args: string, ctx: ExtensionContext): Promise<void> {
	const id = sessionId(ctx);
	const state = getState(runtime, id);
	const action = args.trim().toLowerCase();
	if (action === "clear") {
		clearStatus(state);
		runtime.pi.appendEntry(STATE_ENTRY_TYPE, { version: 1, status: null } satisfies StatusDetails);
		runtime.widget.requestRender(id);
		ctx.ui.notify("Agent status cleared", "info");
		return Promise.resolve();
	}
	if (action) {
		ctx.ui.notify("Usage: /agent-status [clear]", "warning");
		return Promise.resolve();
	}
	ctx.ui.notify(state.status ? `${state.status.phase}: ${state.status.summary}` : "No agent status published yet", "info");
	return Promise.resolve();
}

function replayAndRender(runtime: StatusRuntime, ctx: ExtensionContext): void {
	try {
		const id = sessionId(ctx);
		runtime.states.set(id, createRuntimeState(replayStatus(ctx.sessionManager.getBranch())));
		if (ctx.hasUI) runtime.widget.bind(id, ctx.ui, () => getState(runtime, id));
		runtime.widget.requestRender(id);
	} catch (error) {
		if (!isStaleContextError(error)) throw error;
	}
}

function beforeAgentStart(event: BeforeAgentStartEvent, ctx: ExtensionContext) {
	if (!ctx.hasUI) return undefined;
	return { systemPrompt: event.systemPrompt + STATUS_POLICY };
}

function updateContext(runtime: StatusRuntime, event: ContextEvent, ctx: ExtensionContext) {
	const messages = event.messages.filter(
		(message) => message.role !== "custom" || message.customType !== CONTEXT_MESSAGE_TYPE,
	);
	let state: RuntimeState | undefined;
	try {
		state = runtime.states.get(sessionId(ctx));
	} catch (error) {
		if (!isStaleContextError(error)) throw error;
	}
	if (!ctx.hasUI || !state?.statusDue) {
		return messages.length === event.messages.length ? undefined : { messages };
	}
	return {
		messages: [
			...messages,
			{
				role: "custom" as const,
				customType: CONTEXT_MESSAGE_TYPE,
				content: DUE_CONTEXT,
				display: false,
				timestamp: Date.now(),
			},
		],
	};
}

function trackProgress(runtime: StatusRuntime, event: ToolExecutionEndEvent, ctx: ExtensionContext): void {
	try {
		recordToolProgress(getState(runtime, sessionId(ctx)), event.toolName, event.result, event.isError);
	} catch (error) {
		if (!isStaleContextError(error)) throw error;
	}
}

function shutdown(runtime: StatusRuntime, _event: SessionShutdownEvent, ctx: ExtensionContext): void {
	let id = "";
	try {
		id = sessionId(ctx);
	} catch (error) {
		if (!isStaleContextError(error)) throw error;
	}
	runtime.states.delete(id);
	runtime.widget.dispose(id);
}

function registerTool(runtime: StatusRuntime): void {
	runtime.pi.registerTool({
		name: TOOL_NAME,
		label: "Status Update",
		description: "Publish the latest concise progress status for the interactive user. Use for meaningful milestones, blockers, validation, and completion; do not duplicate the todo list.",
		parameters: StatusParamsSchema,
		execute: (...args) => executeStatus(runtime, args[1], args[4]),
	});
}

function registerCommand(runtime: StatusRuntime): void {
	runtime.pi.registerCommand(COMMAND_NAME, {
		description: "Show or clear the persisted agent status",
		handler: (args, ctx) => handleCommand(runtime, args, ctx),
	});
}

function registerEvents(runtime: StatusRuntime): void {
	runtime.pi.on("before_agent_start", beforeAgentStart);
	runtime.pi.on("context", (event, ctx) => updateContext(runtime, event, ctx));
	runtime.pi.on("session_start", (_event, ctx) => replayAndRender(runtime, ctx));
	runtime.pi.on("session_compact", (_event, ctx) => replayAndRender(runtime, ctx));
	runtime.pi.on("session_tree", (_event, ctx) => replayAndRender(runtime, ctx));
	runtime.pi.on("tool_execution_end", (event, ctx) => trackProgress(runtime, event, ctx));
	runtime.pi.on("session_shutdown", (event, ctx) => shutdown(runtime, event, ctx));
}

export default function agentStatus(pi: ExtensionAPI): void {
	const runtime: StatusRuntime = { pi, states: new Map(), widget: createStatusWidget() };
	registerTool(runtime);
	registerCommand(runtime);
	registerEvents(runtime);
}
