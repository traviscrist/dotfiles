import { CustomEditor, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { matchesKey } from "@earendil-works/pi-tui";

class BusyTabEditor extends CustomEditor {
	constructor(
		...args: ConstructorParameters<typeof CustomEditor>
	) {
		super(...args);
	}

	private queueFollowUp(ctx: ExtensionContext, pi: ExtensionAPI): boolean {
		const text = (this.getExpandedText?.() ?? this.getText()).trim();
		if (!text) return false;

		this.addToHistory(text);
		this.setText("");

		try {
			pi.sendUserMessage(text, { deliverAs: "followUp" });
			ctx.ui.notify("Follow-up queued", "info");
		} catch (error) {
			this.setText(text);
			ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
		}

		this.tui.requestRender();
		return true;
	}

	override handleInput(data: string): void {
		if (!matchesKey(data, "tab")) {
			super.handleInput(data);
			return;
		}

		const ctx = getContext();
		const pi = getPi();

		if (!ctx || !pi || ctx.isIdle() || this.isShowingAutocomplete()) {
			super.handleInput(data);
			return;
		}

		if (!this.queueFollowUp(ctx, pi)) {
			super.handleInput(data);
		}
	}
}

let currentContext: ExtensionContext | undefined;
let currentPi: ExtensionAPI | undefined;

function getContext(): ExtensionContext | undefined {
	return currentContext;
}

function getPi(): ExtensionAPI | undefined {
	return currentPi;
}

export default function (pi: ExtensionAPI) {
	currentPi = pi;

	pi.on("session_start", (_event, ctx) => {
		currentContext = ctx;
		ctx.ui.setEditorComponent((tui, theme, keybindings) => new BusyTabEditor(tui, theme, keybindings));
	});

	pi.on("session_shutdown", () => {
		currentContext = undefined;
	});
}
