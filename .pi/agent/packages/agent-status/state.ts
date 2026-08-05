export const TOOL_NAME = "status_update";
export const STATE_ENTRY_TYPE = "agent-status-state.v1";
export const CONTEXT_MESSAGE_TYPE = "agent-status-reminder.v1";
export const TOOLS_BEFORE_REMINDER = 6;

export const STATUS_PHASES = ["planning", "implementing", "validating", "blocked", "done"] as const;
export type StatusPhase = (typeof STATUS_PHASES)[number];

export interface StatusUpdate {
	phase: StatusPhase;
	summary: string;
	updatedAt: number;
}

export interface StatusDetails {
	version: 1;
	status: StatusUpdate | null;
}

export interface RuntimeState {
	status: StatusUpdate | null;
	meaningfulToolsSinceUpdate: number;
	statusDue: boolean;
}

const COUNTED_TOOLS = new Set([
	"ast_grep_replace",
	"bash",
	"edit",
	"fetch_content",
	"lens_diagnostics",
	"lsp_diagnostics",
	"subagent",
	"web_search",
	"write",
]);

export function createRuntimeState(status: StatusUpdate | null = null): RuntimeState {
	return { status, meaningfulToolsSinceUpdate: 0, statusDue: false };
}

function stripTerminalControls(value: string): string {
	let result = "";
	for (let index = 0; index < value.length; index += 1) {
		const code = value.charCodeAt(index);
		if (code === 0x1b && value[index + 1] === "[") {
			index += 2;
			while (index < value.length && value.charCodeAt(index) < 0x40) index += 1;
			continue;
		}
		if ((code >= 0 && code < 0x20 && ![0x09, 0x0a, 0x0d].includes(code)) || (code >= 0x7f && code <= 0x9f)) {
			continue;
		}
		result += value[index];
	}
	return result;
}

export function normalizeSummary(value: string): string {
	return stripTerminalControls(value).trim().replace(/\s+/g, " ");
}

export function containsSensitiveMaterial(value: string): boolean {
	const credentialPrefix = /\b(?:AKIA[0-9A-Z]{16}|(?:gh[pousr]|sk)-[A-Za-z0-9_-]{16,})\b/;
	const secretAssignment = /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|token|password|secret)\s*[:=]\s*\S{8,}/i;
	const bearerToken = /\bBearer\s+\S{12,}/i;
	return credentialPrefix.test(value) || secretAssignment.test(value) || bearerToken.test(value);
}

function isSafePersistedSummary(value: unknown): value is string {
	return (
		typeof value === "string" &&
		value.length > 0 &&
		value.length <= 180 &&
		normalizeSummary(value) === value &&
		!containsSensitiveMaterial(value)
	);
}

export function isStatusUpdate(value: unknown): value is StatusUpdate {
	if (!value || typeof value !== "object") return false;
	const candidate = value as Record<string, unknown>;
	return (
		STATUS_PHASES.includes(candidate.phase as StatusPhase) &&
		isSafePersistedSummary(candidate.summary) &&
		typeof candidate.updatedAt === "number" &&
		Number.isFinite(candidate.updatedAt)
	);
}

export function isStatusDetails(value: unknown): value is StatusDetails {
	if (!value || typeof value !== "object") return false;
	const candidate = value as Record<string, unknown>;
	return candidate.version === 1 && (candidate.status === null || isStatusUpdate(candidate.status));
}

export function replayStatus(entries: Iterable<unknown>): StatusUpdate | null {
	let status: StatusUpdate | null = null;
	for (const entry of entries) {
		const candidate = entry as {
			type?: string;
			customType?: string;
			data?: unknown;
			message?: { role?: string; toolName?: string; details?: unknown };
		};

		if (candidate.type === "message") {
			const message = candidate.message;
			if (message?.role === "toolResult" && message.toolName === TOOL_NAME && isStatusDetails(message.details)) {
				status = message.details.status ? { ...message.details.status } : null;
			}
			continue;
		}

		if (
			candidate.type === "custom" &&
			candidate.customType === STATE_ENTRY_TYPE &&
			isStatusDetails(candidate.data)
		) {
			status = candidate.data.status ? { ...candidate.data.status } : null;
		}
	}
	return status;
}

export function isMeaningfulTodoTransition(result: unknown): boolean {
	const details = (result as { details?: unknown } | undefined)?.details as
		| { action?: unknown; params?: { status?: unknown }; error?: unknown }
		| undefined;
	return (
		details?.action === "update" &&
		(details.params?.status === "in_progress" || details.params?.status === "completed") &&
		typeof details.error !== "string"
	);
}

export function recordToolProgress(state: RuntimeState, toolName: string, result: unknown, isError: boolean): boolean {
	if (toolName === TOOL_NAME || isError) return false;
	const forceReminder = toolName === "todo" && isMeaningfulTodoTransition(result);
	if (!forceReminder && !COUNTED_TOOLS.has(toolName)) return false;

	state.meaningfulToolsSinceUpdate += 1;
	if (forceReminder || state.meaningfulToolsSinceUpdate >= TOOLS_BEFORE_REMINDER) state.statusDue = true;
	return true;
}

export function publishStatus(state: RuntimeState, status: StatusUpdate): void {
	state.status = status;
	state.meaningfulToolsSinceUpdate = 0;
	state.statusDue = false;
}

export function clearStatus(state: RuntimeState): void {
	state.status = null;
	state.meaningfulToolsSinceUpdate = 0;
	state.statusDue = false;
}
