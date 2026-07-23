import { type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { basename } from "node:path";
import { FAST_MODE_STATUS_KEY, isFastModeStatusActive, thinkingSegmentText } from "./fast-mode.ts";

const COLORS = {
	bgDim: "#232A2E",
	bg0: "#2D353B",
	bg1: "#343F44",
	bg2: "#3D484D",
	fg: "#D3C6AA",
	muted: "#859289",
	green: "#A7C080",
	blue: "#7FBBB3",
	yellow: "#DBBC7F",
	orange: "#E69875",
	purple: "#D699B6",
	red: "#E67E80",
};

const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;

type Segment = {
	text: string;
	fg: string;
	bg: string;
};

export type LensFile = {
	name: string;
	errors: number;
	warnings: number;
	blocking: number;
	touchedAt: number;
};

export type LensState = {
	languages: Set<string>;
	files: Map<string, LensFile>;
	lastDurationMs?: number;
};

export type ActivityState = "IDLE" | "THINK" | "TOOLS" | "BASH" | "COMPACT";

const ACTIVITY_TITLE_ICONS: Record<ActivityState, string> = {
	IDLE: "○",
	THINK: "◐",
	TOOLS: "◆",
	BASH: "❯",
	COMPACT: "↻",
};

const MAX_TITLE_BRANCH_LENGTH = 24;

export function compactBranchName(branch: string): string {
	const characters = Array.from(branch.trim() || "no git");
	if (characters.length <= MAX_TITLE_BRANCH_LENGTH) return characters.join("");
	return `${characters.slice(0, MAX_TITLE_BRANCH_LENGTH - 1).join("")}…`;
}

export function activityTitle(state: ActivityState, branch: string): string {
	return `${ACTIVITY_TITLE_ICONS[state]} - ${compactBranchName(branch)}`;
}

const PLANET_RING_FRAMES = ["⊙", "⊚", "◎", "◌", "◎", "⊚"];
const PLANET_RING_INTERVAL_MS = 260;
const STARTUP_TITLE_DELAY_MS = 250;

function hexToRgb(hex: string): [number, number, number] {
	const normalized = hex.replace("#", "");
	return [
		Number.parseInt(normalized.slice(0, 2), 16),
		Number.parseInt(normalized.slice(2, 4), 16),
		Number.parseInt(normalized.slice(4, 6), 16),
	];
}

function fg(hex: string): string {
	const [r, g, b] = hexToRgb(hex);
	return `\x1b[38;2;${r};${g};${b}m`;
}

function bg(hex: string): string {
	const [r, g, b] = hexToRgb(hex);
	return `\x1b[48;2;${r};${g};${b}m`;
}

function paint(segment: Segment): string {
	return `${fg(segment.fg)}${bg(segment.bg)}${segment.text}\x1b[0m`;
}

function leftPowerline(segments: Segment[]): string {
	return segments
		.map((segment, index) => {
			const next = segments[index + 1];
			const nextBg = next?.bg ?? COLORS.bgDim;
			const separator = `${fg(segment.bg)}${bg(nextBg)}\x1b[0m`;
			return paint(segment) + separator;
		})
		.join("");
}

function rightPowerline(segments: Segment[]): string {
	return segments
		.map((segment, index) => {
			const previousBg = index === 0 ? COLORS.bgDim : segments[index - 1]!.bg;
			return `${fg(segment.bg)}${bg(previousBg)}\x1b[0m${paint(segment)}`;
		})
		.join("");
}

function compactModel(modelId: string | undefined): string {
	if (!modelId) return "no-model";
	return modelId
		.replace(/^gpt-/, "gpt ")
		.replace(/^claude-/, "claude ")
		.replace(/-20\d{6}$/, "")
		.replace(/-/g, " ");
}

function stripAnsi(text: string): string {
	return text.replace(ANSI_PATTERN, "");
}

export function makeFooterLine(width: number, left: string, right: string): string {
	const rightWidth = visibleWidth(right);
	const availableLeftWidth = Math.max(0, width - rightWidth - 1);
	const leftWasTruncated = visibleWidth(left) > availableLeftWidth;
	const fittedLeft = leftWasTruncated && availableLeftWidth > 1
		? truncateToWidth(left, availableLeftWidth - 1, "") + `${fg(COLORS.bg0)}${bg(COLORS.bgDim)}\x1b[0m`
		: truncateToWidth(left, availableLeftWidth, "");
	const pad = " ".repeat(Math.max(0, width - visibleWidth(fittedLeft) - rightWidth));
	return truncateToWidth(fittedLeft + bg(COLORS.bgDim) + pad + "\x1b[0m" + right, width, "");
}

function languageToken(filePath: string): string | undefined {
	const ext = filePath.split(".").pop()?.toLowerCase();
	if (!ext) return undefined;
	if (["js", "jsx", "ts", "tsx", "svelte", "vue"].includes(ext)) return "jsts";
	if (["json", "jsonc"].includes(ext)) return "json";
	if (["css", "scss", "sass", "less"].includes(ext)) return "css";
	if (["md", "mdx"].includes(ext)) return "md";
	if (["py"].includes(ext)) return "py";
	if (["rs"].includes(ext)) return "rs";
	if (["go"].includes(ext)) return "go";
	return ext;
}

function diagnosticCounts(diagnostics: Array<{ severity?: string; semantic?: string }>): Pick<LensFile, "errors" | "warnings" | "blocking"> {
	let errors = 0;
	let warnings = 0;
	let blocking = 0;
	for (const diagnostic of diagnostics) {
		if (diagnostic.semantic === "blocking") blocking++;
		if (diagnostic.severity === "error") errors++;
		if (diagnostic.severity === "warning") warnings++;
	}
	return { errors, warnings, blocking };
}

function updateLensState(state: LensState, payload: { filePath?: string; diagnostics?: Array<{ severity?: string; semantic?: string }>; durationMs?: number }): void {
	if (!payload.filePath) return;
	const token = languageToken(payload.filePath);
	if (token) state.languages.add(token);
	state.files.set(payload.filePath, {
		name: basename(payload.filePath),
		...diagnosticCounts(payload.diagnostics ?? []),
		touchedAt: Date.now(),
	});
	state.lastDurationMs = payload.durationMs;
}

export function lensSummary(state: LensState, lspStatus: string | undefined): { text: string; fg: string } {
	let errors = 0;
	let warnings = 0;
	let blocking = 0;
	for (const file of state.files.values()) {
		errors += file.errors;
		warnings += file.warnings;
		blocking += file.blocking;
	}

	if (errors > 0) return { text: ` 󰅚 ${errors}E${warnings > 0 ? `   ${warnings}W` : ""} `, fg: blocking > 0 ? COLORS.red : COLORS.yellow };
	if (warnings > 0) return { text: `  ${warnings}W `, fg: COLORS.yellow };
	if (state.files.size > 0) {
		const noun = state.files.size === 1 ? "file" : "files";
		return { text: `  ${state.files.size} ${noun} checked `, fg: COLORS.green };
	}
	return { text: ` 󰒡 ${lspStatus ? stripAnsi(lspStatus).replace(/^LSP /, "") : "ready"} `, fg: COLORS.muted };
}

export function lensSegments(state: LensState, lspStatus: string | undefined): Segment[] {
	const languages = [...state.languages].slice(0, 3).join(" ");
	const summary = lensSummary(state, lspStatus);
	const findingFiles = [...state.files.values()]
		.filter((file) => file.errors > 0 || file.warnings > 0 || file.blocking > 0)
		.sort((a, b) => b.touchedAt - a.touchedAt)
		.slice(0, 2)
		.map((file) => file.name)
		.join(" · ");
	const duration = findingFiles && state.lastDurationMs !== undefined
		? `${Math.round(state.lastDurationMs)}ms · `
		: "";
	const detail = `${duration}${findingFiles}`;

	return [
		...(languages ? [{ text: ` ${languages} `, fg: COLORS.green, bg: COLORS.bg0 }] : []),
		{ text: summary.text, fg: summary.fg, bg: COLORS.bg0 },
		...(detail ? [{ text: ` ${detail} `, fg: COLORS.muted, bg: COLORS.bg0 }] : []),
	];
}

function activitySegment(state: ActivityState, ringFrame: string): Segment {
	const color = state === "IDLE" ? COLORS.orange : state === "THINK" ? COLORS.purple : state === "BASH" ? COLORS.blue : state === "TOOLS" ? COLORS.yellow : COLORS.red;
	const label = state === "IDLE" ? state : `${ringFrame} ${state}`;
	return { text: ` ${label} `, fg: COLORS.bgDim, bg: color };
}

function contextUsageSegment(percent: number | undefined): Segment {
	if (percent == null || Number.isNaN(percent)) {
		return { text: " --% ", fg: COLORS.muted, bg: COLORS.bg1 };
	}

	const rounded = Math.round(percent);
	const color = rounded >= 95 ? COLORS.red : rounded >= 80 ? COLORS.yellow : COLORS.blue;
	return { text: ` ${rounded}% `, fg: COLORS.bgDim, bg: color };
}

function goalElapsedSegment(status: string | undefined): Segment | undefined {
	if (!status) return undefined;

	const clean = stripAnsi(status);
	const duration = clean.match(/\((\d+d(?: \d+h)?(?: \d+m)?|\d+h(?: \d+m)?|\d+m|\d+s)\)/)?.[1];
	if (duration) return { text: ` ${duration} `, fg: COLORS.bgDim, bg: COLORS.green };
	if (clean === "Pursuing goal") return { text: " 0s ", fg: COLORS.bgDim, bg: COLORS.green };
	return undefined;
}

export default function (pi: ExtensionAPI) {
	let enabled = true;
	let activityState: ActivityState = "IDLE";
	const activeTools = new Map<string, string>();
	let ringIndex = 0;
	let currentBranch = "no git";
	let currentContext: ExtensionContext | undefined;
	const lensState: LensState = { languages: new Set(), files: new Map() };
	const renderers = new Set<() => void>();
	const renderAll = () => {
		for (const requestRender of renderers) requestRender();
	};
	const syncTitle = () => currentContext?.ui.setTitle(activityTitle(activityState, currentBranch));
	const setActivity = (next: ActivityState) => {
		const changed = activityState !== next;
		activityState = next;
		syncTitle();
		if (changed) renderAll();
	};

	pi.events.on("pi-lens/analysis-complete", (payload: unknown) => {
		updateLensState(lensState, payload as Parameters<typeof updateLensState>[1]);
		renderAll();
	});

	const syncToolActivity = () => {
		if (activeTools.size === 0) {
			setActivity("THINK");
			return;
		}
		setActivity(Array.from(activeTools.values()).includes("bash") ? "BASH" : "TOOLS");
	};

	pi.on("agent_start", () => setActivity("THINK"));
	pi.on("turn_start", () => setActivity("THINK"));
	pi.on("tool_execution_start", (event) => {
		activeTools.set(event.toolCallId, event.toolName);
		syncToolActivity();
	});
	pi.on("tool_execution_end", (event) => {
		activeTools.delete(event.toolCallId);
		syncToolActivity();
	});
	pi.on("agent_end", () => {
		activeTools.clear();
	});
	pi.on("agent_settled", (_event, ctx) => setActivity(ctx.isIdle() ? "IDLE" : "THINK"));
	pi.on("session_before_compact", () => setActivity("COMPACT"));
	pi.on("session_compact", (_event, ctx) => setActivity(ctx.isIdle() ? "IDLE" : "THINK"));

	function apply(ctx: ExtensionContext): void {
		const repoLabel = basename(ctx.cwd) || "pi";
		ctx.ui.setWorkingVisible(false);
		ctx.ui.setWidget(FAST_MODE_STATUS_KEY, undefined);

		ctx.ui.setFooter((tui, _theme, footerData) => {
			const requestRender = () => tui.requestRender();
			const syncBranch = () => {
				const nextBranch = footerData.getGitBranch() || "no git";
				if (currentBranch === nextBranch) return;
				currentBranch = nextBranch;
				syncTitle();
			};
			renderers.add(requestRender);
			syncBranch();
			const branchDisposer = footerData.onBranchChange(() => {
				syncBranch();
				requestRender();
			});
			const interval = setInterval(() => {
				if (activityState !== "IDLE") {
					ringIndex = (ringIndex + 1) % PLANET_RING_FRAMES.length;
				}
				requestRender();
			}, PLANET_RING_INTERVAL_MS);

			return {
				dispose() {
					renderers.delete(requestRender);
					branchDisposer();
					clearInterval(interval);
					ctx.ui.setWorkingVisible(true);
				},
				invalidate() {},
				render(width: number): string[] {
					const branch = footerData.getGitBranch() || "no git";
					const statuses = footerData.getExtensionStatuses();
					const lspStatus = statuses.get("pi-lens-lsp");
					const goalStatus = statuses.get("codex-goal");
					const usage = ctx.getContextUsage();
					const contextUsage = contextUsageSegment(usage?.percent ?? undefined);
					const thinking = pi.getThinkingLevel();
					const fastModeActive = isFastModeStatusActive(statuses.get(FAST_MODE_STATUS_KEY));
					const goalElapsed = goalElapsedSegment(goalStatus);

					const left = leftPowerline([
						activitySegment(activityState, PLANET_RING_FRAMES[ringIndex] ?? "⊙"),
						{ text: `  ${branch} `, fg: COLORS.fg, bg: COLORS.bg2 },
						{ text: ` ${repoLabel} `, fg: COLORS.muted, bg: COLORS.bg1 },
						...lensSegments(lensState, lspStatus),
					]);

					const right = rightPowerline([
						{ text: thinkingSegmentText(thinking, fastModeActive), fg: COLORS.yellow, bg: COLORS.bg2 },
						{ text: ` ${compactModel(ctx.model?.id)} `, fg: COLORS.fg, bg: COLORS.bg1 },
						contextUsage,
						...(goalElapsed ? [goalElapsed] : []),
					]);

					return [makeFooterLine(width, left, right)];
				},
			};
		});
	}

	pi.on("session_start", (_event, ctx) => {
		currentContext = ctx;
		currentBranch = "no git";
		activeTools.clear();
		setActivity("IDLE");
		setTimeout(syncTitle, STARTUP_TITLE_DELAY_MS);
		if (enabled) apply(ctx);
	});
	pi.on("session_info_changed", () => syncTitle());
	pi.on("session_shutdown", () => {
		currentContext = undefined;
	});
	pi.on("model_select", (_event, ctx) => {
		setTimeout(() => {
			ctx.ui.setWidget(FAST_MODE_STATUS_KEY, undefined);
			renderAll();
		}, 0);
	});

	pi.registerCommand("vimline", {
		description: "Toggle the Everforest Vim-style statusline footer",
		handler: async (_args, ctx) => {
			enabled = !enabled;
			if (enabled) {
				apply(ctx);
				ctx.ui.notify("Vim statusline enabled", "info");
			} else {
				ctx.ui.setFooter(undefined);
				ctx.ui.notify("Default footer restored", "info");
			}
		},
	});
}
