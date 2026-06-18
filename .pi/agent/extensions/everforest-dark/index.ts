import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const THEME_NAME = "everforest-dark";
const STATUS_KEY = "everforest-theme";

function applyEverforestDark(ctx: ExtensionContext): void {
	const result = ctx.ui.setTheme(THEME_NAME);

	if (!result.success) {
		ctx.ui.notify(`everforest-dark: failed to apply theme: ${result.error}`, "warning");
		return;
	}

	ctx.ui.setStatus(STATUS_KEY, ctx.ui.theme.fg("accent", "theme:everforest-dark"));
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", (_event, ctx) => {
		applyEverforestDark(ctx);
	});
}
