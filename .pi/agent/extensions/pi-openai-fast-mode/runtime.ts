import { readFile } from "node:fs/promises";

export const STATUS_KEY = "pi-openai-fast-mode";
const SUPPORTED_PROVIDERS = new Set(["openai", "openai-codex"]);

export type FastTarget = {
	provider: string;
	model: string;
	serviceTier: string;
};

export type FastModeDefaults = {
	enabled: boolean;
	targets: FastTarget[];
};

export type ModelRef = {
	provider: string;
	id: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseFastModeDefaults(value: unknown): FastModeDefaults {
	if (!isRecord(value) || typeof value.enabled !== "boolean" || !Array.isArray(value.targets)) {
		throw new Error("Fast Mode defaults must contain enabled and targets");
	}

	const targets = value.targets.map((target, index): FastTarget => {
		if (
			!isRecord(target) ||
			typeof target.provider !== "string" ||
			!SUPPORTED_PROVIDERS.has(target.provider) ||
			typeof target.model !== "string" ||
			target.model.length === 0 ||
			typeof target.serviceTier !== "string" ||
			target.serviceTier.length === 0
		) {
			throw new Error(`Invalid Fast Mode target at index ${index}`);
		}

		return {
			provider: target.provider,
			model: target.model,
			serviceTier: target.serviceTier,
		};
	});

	return { enabled: value.enabled, targets };
}

export async function loadFastModeDefaults(path: string): Promise<FastModeDefaults> {
	return parseFastModeDefaults(JSON.parse(await readFile(path, "utf8")));
}

export function parseFastCommand(args: string, current: boolean): boolean {
	switch (args.trim().toLowerCase()) {
		case "":
		case "toggle":
			return !current;
		case "on":
			return true;
		case "off":
			return false;
		default:
			throw new Error("Usage: /fast [on|off|toggle]");
	}
}

export function toModelRef(model: unknown): ModelRef | undefined {
	if (!isRecord(model) || typeof model.provider !== "string" || typeof model.id !== "string") return undefined;
	return { provider: model.provider, id: model.id };
}

export function findFastTarget(model: ModelRef | undefined, targets: FastTarget[]): FastTarget | undefined {
	if (!model || !SUPPORTED_PROVIDERS.has(model.provider)) return undefined;
	return targets.find((target) => target.provider === model.provider && target.model === model.id);
}

export function getFastModePayload(
	enabled: boolean,
	targets: FastTarget[],
	model: ModelRef | undefined,
	payload: unknown,
): Record<string, unknown> | undefined {
	if (!enabled || !isRecord(payload)) return undefined;
	const target = findFastTarget(model, targets);
	if (!target) return undefined;
	return { ...payload, service_tier: target.serviceTier };
}

export function getFastStatus(
	enabled: boolean,
	targets: FastTarget[],
	model: ModelRef | undefined,
): "fast" | undefined {
	return enabled && findFastTarget(model, targets) ? "fast" : undefined;
}
