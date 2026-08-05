import type { ExtensionUIContext, Theme } from "../../npm/node_modules/@earendil-works/pi-coding-agent/dist/index.js";
import { truncateToWidth, wrapTextWithAnsi, type TUI } from "../../npm/node_modules/@earendil-works/pi-tui/dist/index.js";
import type { RuntimeState, StatusPhase } from "./state.js";

const WIDGET_KEY = "agent-status";
type StatusColor = "accent" | "warning" | "error" | "success";

export interface StatusWidget {
	bind(id: string, ui: ExtensionUIContext, getState: () => RuntimeState): void;
	requestRender(id: string): void;
	dispose(id: string): void;
}

function phasePresentation(phase: StatusPhase): { icon: string; color: StatusColor } {
	switch (phase) {
		case "planning":
			return { icon: "○", color: "accent" };
		case "implementing":
			return { icon: "◆", color: "accent" };
		case "validating":
			return { icon: "◐", color: "warning" };
		case "blocked":
			return { icon: "!", color: "error" };
		case "done":
			return { icon: "✓", color: "success" };
		default:
			throw new Error(`Unknown status phase: ${String(phase)}`);
	}
}

export function renderStatus(state: RuntimeState, theme: Theme, width: number): string[] {
	if (!state.status || width <= 0) return [];
	const presentation = phasePresentation(state.status.phase);
	const heading = theme.fg(
		presentation.color,
		truncateToWidth(`${presentation.icon} Status · ${state.status.phase}`, width),
	);
	const summaryLines = state.status.summary
		.split("\n")
		.flatMap((line) => wrapTextWithAnsi(`  ${line}`, width))
		.map((line) => theme.fg("text", line));
	return [heading, ...summaryLines, ""];
}

export function createStatusWidget(): StatusWidget {
	let activeSessionId: string | undefined;
	let uiContext: ExtensionUIContext | undefined;
	let tui: TUI | undefined;
	let widgetRegistered = false;

	return {
		bind(id, ui, getState) {
			if (activeSessionId === undefined) activeSessionId = id;
			if (id !== activeSessionId) return;
			if (ui !== uiContext) {
				uiContext = ui;
				tui = undefined;
				widgetRegistered = false;
			}
			if (widgetRegistered) return;

			ui.setWidget(
				WIDGET_KEY,
				(widgetTui, factoryTheme) => {
					tui = widgetTui;
					return {
						render: (width: number) => renderStatus(getState(), uiContext?.theme ?? factoryTheme, width),
						invalidate: () => undefined,
					};
				},
				{ placement: "aboveEditor" },
			);
			widgetRegistered = true;
		},

		requestRender(id) {
			if (id === activeSessionId) tui?.requestRender(true);
		},

		dispose(id) {
			if (id && id !== activeSessionId) return;
			try {
				uiContext?.setWidget(WIDGET_KEY, undefined);
			} finally {
				activeSessionId = undefined;
				uiContext = undefined;
				tui = undefined;
				widgetRegistered = false;
			}
		},
	};
}
