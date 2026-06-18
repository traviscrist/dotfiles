import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { basename } from "node:path";

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
	red: "#E67E80",
};

const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;

type Segment = {
	text: string;
	fg: string;
	bg: string;
};

type LensFile = {
	name: string;
	errors: number;
	warnings: number;
	blocking: number;
	touchedAt: number;
};

type LensState = {
	languages: Set<string>;
	files: Map<string, LensFile>;
	lastDurationMs?: number;
};

type ActivityState = "IDLE" | "THINK" | "TOOLS" | "BASH";

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
			const separator = next ? `${fg(segment.bg)}${bg(next.bg)}\x1b[0m` : `${fg(segment.bg)}\x1b[0m`;
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

function formatElapsed(startedAt: number): string {
	const totalSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function stripAnsi(text: string): string {
	return text.replace(ANSI_PATTERN, "");
}

function visibleWidth(text: string): number {
	return Array.from(stripAnsi(text)).length;
}

function truncateToWidth(text: string, maxWidth: number): string {
	if (maxWidth <= 0) return "";

	let width = 0;
	let output = "";
	for (let index = 0; index < text.length;) {
		const ansi = text.slice(index).match(/^\x1b\[[0-9;]*m/);
		if (ansi) {
			output += ansi[0];
			index += ansi[0].length;
			continue;
		}

		const char = Array.from(text.slice(index))[0]!;
		if (width + 1 > maxWidth) break;
		output += char;
		width += 1;
		index += char.length;
	}

	return output + "\x1b[0m";
}

function makeFooterLine(width: number, left: string, right: string): string {
	const rightWidth = visibleWidth(right);
	const availableLeftWidth = Math.max(0, width - rightWidth - 1);
	const fittedLeft = truncateToWidth(left, availableLeftWidth);
	const pad = " ".repeat(Math.max(0, width - visibleWidth(fittedLeft) - rightWidth));
	return truncateToWidth(fittedLeft + bg(COLORS.bgDim) + pad + "\x1b[0m" + right, width);
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

function lensSummary(state: LensState, lspStatus: string | undefined): { text: string; fg: string } {
	let errors = 0;
	let warnings = 0;
	let blocking = 0;
	for (const file of state.files.values()) {
		errors += file.errors;
		warnings += file.warnings;
		blocking += file.blocking;
	}

	if (errors > 0) return { text: ` ${blocking > 0 ? "●" : "!"}${errors}E${warnings > 0 ? ` ${warnings}W` : ""} `, fg: blocking > 0 ? COLORS.red : COLORS.yellow };
	if (warnings > 0) return { text: ` !${warnings}W `, fg: COLORS.yellow };
	if (state.files.size > 0) return { text: " ✓ clean ", fg: COLORS.green };
	return { text: ` ${lspStatus ? stripAnsi(lspStatus).replace(/^LSP /, "") : "ready"} `, fg: COLORS.muted };
}

function lensSegments(state: LensState, lspStatus: string | undefined): Segment[] {
	const languages = [...state.languages].slice(0, 3).join(" ");
	const summary = lensSummary(state, lspStatus);
	const duration = state.lastDurationMs === undefined ? "" : ` ${Math.round(state.lastDurationMs)}ms`;
	const recentFiles = [...state.files.values()]
		.sort((a, b) => b.touchedAt - a.touchedAt)
		.slice(0, 2)
		.map((file) => file.name)
		.join(" · ");
	const detail = `${duration}${recentFiles ? ` · ${recentFiles}` : ""}`;

	return [
		{ text: ` pi-lens${languages ? ` ${languages}` : ""} `, fg: COLORS.green, bg: COLORS.bg0 },
		{ text: summary.text, fg: summary.fg, bg: COLORS.bg0 },
		...(detail ? [{ text: ` ${detail} `, fg: COLORS.muted, bg: COLORS.bg0 }] : []),
	];
}

function activitySegment(state: ActivityState): Segment {
	const color = state === "IDLE" ? COLORS.green : state === "BASH" ? COLORS.blue : state === "TOOLS" ? COLORS.yellow : COLORS.fg;
	return { text: ` ${state} `, fg: COLORS.bgDim, bg: color };
}

function goalSegments(status: string | undefined): Segment[] {
	if (!status) return [];

	const clean = stripAnsi(status);
	let text = clean
		.replace(/^Pursuing goal/i, "goal")
		.replace(/^Goal achieved/i, "goal done")
		.replace(/^Goal paused/i, "goal paused")
		.replace(/^Goal unmet/i, "goal unmet")
		.replace(/\/goal resume/g, "resume");
	if (text.length > 34) text = `${text.slice(0, 33)}…`;

	const color = clean.includes("paused") || clean.includes("unmet") ? COLORS.yellow : clean.includes("achieved") ? COLORS.green : COLORS.blue;
	return [
		{ text: " goal ", fg: COLORS.bgDim, bg: color },
		{ text: ` ${text} `, fg: COLORS.fg, bg: COLORS.bg0 },
	];
}

export default function (pi: ExtensionAPI) {
	let enabled = true;
	let activityState: ActivityState = "IDLE";
	let activeToolCount = 0;
	const startedAt = Date.now();
	const lensState: LensState = { languages: new Set(), files: new Map() };
	const renderers = new Set<() => void>();
	const renderAll = () => {
		for (const requestRender of renderers) requestRender();
	};
	const setActivity = (next: ActivityState) => {
		if (activityState === next) return;
		activityState = next;
		renderAll();
	};

	pi.events.on("pi-lens/analysis-complete", (payload: unknown) => {
		updateLensState(lensState, payload as Parameters<typeof updateLensState>[1]);
		renderAll();
	});

	pi.on("agent_start", () => setActivity("THINK"));
	pi.on("turn_start", () => setActivity("THINK"));
	pi.on("tool_execution_start", (event) => {
		activeToolCount++;
		setActivity(event.toolName === "bash" ? "BASH" : "TOOLS");
	});
	pi.on("tool_execution_end", () => {
		activeToolCount = Math.max(0, activeToolCount - 1);
		if (activeToolCount === 0) setActivity("THINK");
	});
	pi.on("agent_end", () => {
		activeToolCount = 0;
		setActivity("IDLE");
	});

	function apply(ctx: ExtensionContext): void {
		const repoLabel = basename(ctx.cwd) || "pi";

		ctx.ui.setFooter((tui, _theme, footerData) => {
			const requestRender = () => tui.requestRender();
			renderers.add(requestRender);
			const branchDisposer = footerData.onBranchChange(requestRender);
			const interval = setInterval(requestRender, 1000);

			return {
				dispose() {
					renderers.delete(requestRender);
					branchDisposer();
					clearInterval(interval);
				},
				invalidate() {},
				render(width: number): string[] {
					const branch = footerData.getGitBranch() || "no git";
					const statuses = footerData.getExtensionStatuses();
					const lspStatus = statuses.get("pi-lens-lsp");
					const goalStatus = statuses.get("codex-goal");
					const usage = ctx.getContextUsage();
					const percent = usage?.percent == null ? "--%" : `${Math.round(usage.percent)}%`;
					const thinking = pi.getThinkingLevel();

					const left = leftPowerline([
						activitySegment(activityState),
						{ text: `  ${branch} `, fg: COLORS.fg, bg: COLORS.bg2 },
						{ text: ` ${repoLabel} `, fg: COLORS.muted, bg: COLORS.bg1 },
						...goalSegments(goalStatus),
						...lensSegments(lensState, lspStatus),
					]);

					const right = rightPowerline([
						{ text: " utf-8 ", fg: COLORS.muted, bg: COLORS.bg1 },
						{ text: ` ${thinking} `, fg: COLORS.yellow, bg: COLORS.bg2 },
						{ text: ` ${compactModel(ctx.model?.id)} `, fg: COLORS.fg, bg: COLORS.bg1 },
						{ text: ` ${percent} `, fg: COLORS.bgDim, bg: COLORS.blue },
						{ text: ` ${formatElapsed(startedAt)} `, fg: COLORS.bgDim, bg: COLORS.green },
					]);

					return [makeFooterLine(width, left, right)];
				},
			};
		});
	}

	pi.on("session_start", (_event, ctx) => {
		if (enabled) apply(ctx);
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
