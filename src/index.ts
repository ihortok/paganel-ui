import { initPaganelUI } from "./core/init";

export { onDelegate } from "./core/delegate";
export type { DelegatedHandler } from "./core/delegate";
export { initPaganelUI };
export type { DisclosureOptions } from "./behaviors/disclosure";

// Auto-initialize on import. Guarded so importing this package in a
// non-browser context (SSR, a plain Node script, a test without jsdom)
// never throws.
if (typeof document !== "undefined") {
  initPaganelUI();
}
