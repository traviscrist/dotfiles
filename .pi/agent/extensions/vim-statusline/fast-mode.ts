import { readFileSync, watch, type FSWatcher } from "node:fs";

export type FastModeConfig = {
	enabled?: unknown;
	targets?: unknown;
};

export type FastModeConfigTracker = {
	get(): FastModeConfig | undefined;
	dispose(): void;
};

export const FAST_MODE_STATUS_KEY = "pi-openai-fast-mode";
const FAST_MODE_REFRESH_DELAY_MS = 25;

function loadFastModeConfig(configPath: string): FastModeConfig | undefined {
	try {
		const value: unknown = JSON.parse(readFileSync(configPath, "utf8"));
		return typeof value === "object" && value !== null ? value as FastModeConfig : undefined;
	} catch {
		return undefined;
	}
}

export function isFastModeActive(config: FastModeConfig | undefined, model: { provider?: string; id?: string } | undefined): boolean {
	if (config?.enabled !== true || !Array.isArray(config.targets) || !model?.provider || !model.id) return false;
	return config.targets.some((target) =>
		typeof target === "object" && target !== null &&
		"provider" in target && target.provider === model.provider &&
		"model" in target && target.model === model.id
	);
}

export function thinkingSegmentText(thinking: string, fastModeActive: boolean): string {
	return ` ${fastModeActive ? "⚡ " : ""}${thinking} `;
}

export function createFastModeConfigTracker(configPath: string, onChange: () => void): FastModeConfigTracker {
	let config = loadFastModeConfig(configPath);
	let refreshTimer: ReturnType<typeof setTimeout> | undefined;
	let watcher: FSWatcher | undefined;
	const refresh = () => {
		if (refreshTimer) clearTimeout(refreshTimer);
		refreshTimer = setTimeout(() => {
			config = loadFastModeConfig(configPath);
			onChange();
		}, FAST_MODE_REFRESH_DELAY_MS);
	};

	try {
		watcher = watch(configPath, refresh);
		watcher.on("error", refresh);
	} catch {
		config = undefined;
	}

	return {
		get: () => config,
		dispose() {
			if (refreshTimer) clearTimeout(refreshTimer);
			watcher?.close();
		},
	};
}
