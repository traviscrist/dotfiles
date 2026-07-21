import { fileURLToPath } from "node:url";
import type {
	ExtensionAPI,
	ExtensionCommandContext,
	ExtensionContext,
	ExtensionFactory,
} from "@earendil-works/pi-coding-agent";
import {
	getFastModePayload,
	getFastStatus,
	loadFastModeDefaults,
	parseFastCommand,
	STATUS_KEY,
	toModelRef,
	type FastModeDefaults,
	type ModelRef,
} from "./runtime.ts";

export type FastModeExtensionOptions = {
	defaultsPath?: string;
};

const DEFAULTS_PATH = fileURLToPath(new URL("./defaults.json", import.meta.url));
const EMPTY_DEFAULTS: FastModeDefaults = { enabled: false, targets: [] };

function notifyError(ctx: Pick<ExtensionContext, "hasUI" | "ui">, error: unknown): void {
	if (!ctx.hasUI) return;
	ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
}

export function createPiFastModeExtension(options: FastModeExtensionOptions = {}): ExtensionFactory {
	const defaultsPath = options.defaultsPath ?? DEFAULTS_PATH;

	return function piFastModeExtension(pi: ExtensionAPI): void {
		let defaults = EMPTY_DEFAULTS;
		let sessionEnabled = false;
		let loaded = false;
		let currentModel: ModelRef | undefined;

		function updateStatus(ctx: ExtensionContext): void {
			ctx.ui.setWidget(STATUS_KEY, undefined);
			ctx.ui.setStatus(STATUS_KEY, getFastStatus(sessionEnabled, defaults.targets, currentModel));
		}

		async function loadForSession(ctx: ExtensionContext): Promise<void> {
			defaults = await loadFastModeDefaults(defaultsPath);
			sessionEnabled = defaults.enabled || pi.getFlag("fast") === true;
			currentModel = toModelRef(ctx.model);
			loaded = true;
			updateStatus(ctx);
		}

		async function ensureLoaded(ctx: ExtensionContext): Promise<void> {
			if (!loaded) await loadForSession(ctx);
		}

		pi.registerFlag("fast", {
			description: "Start this session with Fast Mode enabled",
			type: "boolean",
			default: false,
		});

		pi.registerCommand("fast", {
			description: "Toggle Fast Mode for this session. Usage: /fast [on|off|toggle]",
			getArgumentCompletions: (prefix: string) => {
				const values = ["on", "off", "toggle"];
				const matches = values.filter((value) => value.startsWith(prefix.trim().toLowerCase()));
				return matches.length > 0 ? matches.map((value) => ({ value, label: value })) : null;
			},
			handler: async (args: string, ctx: ExtensionCommandContext): Promise<void> => {
				try {
					await ensureLoaded(ctx);
					currentModel = toModelRef(ctx.model) ?? currentModel;
					sessionEnabled = parseFastCommand(args, sessionEnabled);
					updateStatus(ctx);
				} catch (error) {
					notifyError(ctx, error);
				}
			},
		});

		pi.on("session_start", async (_event, ctx) => {
			try {
				await loadForSession(ctx);
			} catch (error) {
				notifyError(ctx, error);
			}
		});

		pi.on("model_select", (event, ctx) => {
			currentModel = toModelRef(event.model) ?? toModelRef(ctx.model);
			updateStatus(ctx);
		});

		pi.on("before_provider_request", (event, ctx) => {
			const model = toModelRef(ctx.model) ?? currentModel;
			return getFastModePayload(sessionEnabled, defaults.targets, model, event.payload);
		});

		pi.on("session_shutdown", (_event, ctx) => {
			ctx.ui.setStatus(STATUS_KEY, undefined);
			ctx.ui.setWidget(STATUS_KEY, undefined);
		});
	};
}

export default createPiFastModeExtension();
