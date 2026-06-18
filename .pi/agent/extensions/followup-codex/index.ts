import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	pi.registerCommand("followup", {
		description: "Queue a follow-up message after the current full turn",
		handler: async (args, ctx) => {
			const text = args.trim();
			if (!text) {
				ctx.ui.notify("Usage: /followup <message>", "warning");
				return;
			}

			if (ctx.isIdle()) {
				pi.sendUserMessage(text);
				return;
			}

			pi.sendUserMessage(text, { deliverAs: "followUp" });
			ctx.ui.notify("Follow-up queued", "info");
		},
	});
}
