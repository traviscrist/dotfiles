import { afterEach, describe, expect, it } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createPiFastModeExtension } from "./index.ts";
import {
	getFastModePayload,
	getFastStatus,
	parseFastCommand,
	parseFastModeDefaults,
	STATUS_KEY,
} from "./runtime.ts";

const CONFIG = {
	enabled: false,
	targets: [
		{ provider: "openai-codex", model: "gpt-5.6-sol", serviceTier: "priority" },
	],
};
const tempDirs: string[] = [];

afterEach(async () => {
	await Promise.all(tempDirs.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

async function createDefaultsFile(): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), "pi-fast-mode-"));
	tempDirs.push(directory);
	const path = join(directory, "defaults.json");
	await writeFile(path, `${JSON.stringify(CONFIG, null, 2)}\n`);
	return path;
}

function createHarness(fastFlag = false) {
	const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
	const handlers = new Map<string, Array<(event: any, ctx: any) => any>>();
	const pi = {
		registerFlag() {},
		registerCommand(name: string, command: { handler: (args: string, ctx: any) => Promise<void> }) {
			commands.set(name, command);
		},
		getFlag(name: string) {
			return name === "fast" ? fastFlag : undefined;
		},
		on(name: string, handler: (event: any, ctx: any) => any) {
			handlers.set(name, [...(handlers.get(name) ?? []), handler]);
		},
	};
	return { pi, commands, handlers };
}

function createContext() {
	const statuses: Array<[string, string | undefined]> = [];
	return {
		cwd: "/repo",
		model: { provider: "openai-codex", id: "gpt-5.6-sol" },
		hasUI: true,
		mode: "tui",
		ui: {
			notify() {},
			setStatus(key: string, value: string | undefined) {
				statuses.push([key, value]);
			},
			setWidget() {},
		},
		statuses,
	};
}

async function runHandler(
	handlers: Map<string, Array<(event: any, ctx: any) => any>>,
	name: string,
	event: unknown,
	ctx: unknown,
): Promise<unknown> {
	const handler = handlers.get(name)?.[0];
	expect(handler).toBeFunction();
	return handler!(event, ctx);
}

describe("Fast Mode runtime", () => {
	it("parses a disabled default and only matches exact targets", () => {
		const defaults = parseFastModeDefaults(CONFIG);
		expect(defaults.enabled).toBeFalse();
		expect(getFastStatus(true, defaults.targets, { provider: "openai-codex", id: "gpt-5.6-sol" })).toBe("fast");
		expect(getFastStatus(true, defaults.targets, { provider: "openai", id: "gpt-5.6-sol" })).toBeUndefined();
		expect(getFastModePayload(true, defaults.targets, { provider: "openai-codex", id: "gpt-5.6-sol" }, { model: "gpt-5.6-sol" })).toEqual({
			model: "gpt-5.6-sol",
			service_tier: "priority",
		});
		expect(getFastModePayload(false, defaults.targets, { provider: "openai-codex", id: "gpt-5.6-sol" }, {})).toBeUndefined();
		expect(getFastModePayload(true, defaults.targets, { provider: "openai", id: "gpt-5.6-sol" }, {})).toBeUndefined();
	});

	it("parses command states without touching configuration", () => {
		expect(parseFastCommand("", false)).toBeTrue();
		expect(parseFastCommand("toggle", true)).toBeFalse();
		expect(parseFastCommand("on", false)).toBeTrue();
		expect(parseFastCommand("off", true)).toBeFalse();
		expect(() => parseFastCommand("persist", false)).toThrow("Usage: /fast [on|off|toggle]");
	});

	it("keeps /fast session-local and leaves defaults unchanged", async () => {
		const defaultsPath = await createDefaultsFile();
		const before = await readFile(defaultsPath, "utf8");
		const { pi, commands, handlers } = createHarness();
		createPiFastModeExtension({ defaultsPath })(pi as any);
		const ctx = createContext();

		await runHandler(handlers, "session_start", {}, ctx);
		expect(ctx.statuses.at(-1)).toEqual([STATUS_KEY, undefined]);

		await commands.get("fast")!.handler("on", ctx);
		expect(ctx.statuses.at(-1)).toEqual([STATUS_KEY, "fast"]);
		const payload = await runHandler(handlers, "before_provider_request", { payload: { model: "gpt-5.6-sol" } }, ctx);
		expect(payload).toEqual({ model: "gpt-5.6-sol", service_tier: "priority" });

		await runHandler(handlers, "model_select", { model: { provider: "openai-codex", id: "gpt-4" } }, ctx);
		expect(ctx.statuses.at(-1)).toEqual([STATUS_KEY, undefined]);
		await runHandler(handlers, "session_start", {}, ctx);
		expect(ctx.statuses.at(-1)).toEqual([STATUS_KEY, undefined]);

		await runHandler(handlers, "session_shutdown", {}, ctx);
		expect(await readFile(defaultsPath, "utf8")).toBe(before);

		const next = createHarness();
		createPiFastModeExtension({ defaultsPath })(next.pi as any);
		const nextCtx = createContext();
		await runHandler(next.handlers, "session_start", {}, nextCtx);
		expect(nextCtx.statuses.at(-1)).toEqual([STATUS_KEY, undefined]);
	});

	it("ignores stale mutable config from the removed package", async () => {
		const defaultsPath = await createDefaultsFile();
		const legacyPath = join(defaultsPath, "..", "config.json");
		const legacy = `${JSON.stringify({ ...CONFIG, enabled: true }, null, 2)}\n`;
		await writeFile(legacyPath, legacy);
		const { pi, handlers } = createHarness();
		createPiFastModeExtension({ defaultsPath })(pi as any);
		const ctx = createContext();

		await runHandler(handlers, "session_start", {}, ctx);
		expect(ctx.statuses.at(-1)).toEqual([STATUS_KEY, undefined]);
		expect(await readFile(legacyPath, "utf8")).toBe(legacy);
	});

	it("treats --fast as a session-only override", async () => {
		const defaultsPath = await createDefaultsFile();
		const before = await readFile(defaultsPath, "utf8");
		const { pi, handlers } = createHarness(true);
		createPiFastModeExtension({ defaultsPath })(pi as any);
		const ctx = createContext();

		await runHandler(handlers, "session_start", {}, ctx);
		expect(ctx.statuses.at(-1)).toEqual([STATUS_KEY, "fast"]);
		await runHandler(handlers, "session_shutdown", {}, ctx);
		expect(await readFile(defaultsPath, "utf8")).toBe(before);
	});
});
