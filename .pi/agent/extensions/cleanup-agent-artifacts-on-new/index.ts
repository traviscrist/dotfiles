import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const SCRIPT_PATH = join(
	process.env.HOME ?? "",
	".ai/skills/cleanup-agent-artifacts/scripts/cleanup-agent-artifacts.sh",
);

export default function (pi: ExtensionAPI) {
	pi.on("session_shutdown", async (event, ctx) => {
		if (event.reason !== "new") return;

		if (!existsSync(SCRIPT_PATH)) {
			if (ctx.hasUI) {
				ctx.ui.notify("Cleanup skill script not found; skipped artifact cleanup", "warning");
			}
			return;
		}

		const result = await pi.exec("bash", [SCRIPT_PATH, "--apply"], { timeout: 30_000 });
		const output = [result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n");

		if (result.code === 0) {
			if (ctx.hasUI) {
				ctx.ui.notify(output || "Cleaned agent artifacts", "info");
			}
			return;
		}

		if (ctx.hasUI) {
			ctx.ui.notify(output || "Agent artifact cleanup failed", "warning");
		}
	});
}
