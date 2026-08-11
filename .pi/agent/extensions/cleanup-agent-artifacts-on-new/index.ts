import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const SCRIPT_PATH = join(process.env.HOME ?? "", ".ai/bin/pi-maintenance");
const DAILY_INTERVAL_SECONDS = 24 * 60 * 60;

export default function (pi: ExtensionAPI) {
	pi.on("session_start", () => {
		if (!existsSync(SCRIPT_PATH)) return;

		// Maintenance owns its cross-process lock and session-cleanup throttle.
		// Do not await: orphan reaping and cleanup must never extend startup or a turn.
		void pi.exec(
			SCRIPT_PATH,
			["--apply", "--session-days", "7", "--if-due", String(DAILY_INTERVAL_SECONDS)],
			{ timeout: 120_000 },
		).catch(() => {
			// Best effort. A later session retries because failed runs are not stamped.
		});
	});
}
