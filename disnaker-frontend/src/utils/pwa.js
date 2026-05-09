export const isStandaloneMode = () =>
	window.matchMedia?.("(display-mode: standalone)")?.matches ||
	window.navigator.standalone === true;

export const supportsPwaInstallPrompt = () => "BeforeInstallPromptEvent" in window;
