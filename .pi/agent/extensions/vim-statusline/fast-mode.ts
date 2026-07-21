export const FAST_MODE_STATUS_KEY = "pi-openai-fast-mode";

export function isFastModeStatusActive(status: string | undefined): boolean {
	return status === "fast";
}

export function thinkingSegmentText(thinking: string, fastModeActive: boolean): string {
	return ` ${fastModeActive ? "⚡ " : ""}${thinking} `;
}
