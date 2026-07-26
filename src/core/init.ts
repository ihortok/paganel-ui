import { initDropdown } from "../behaviors/dropdown";

const INIT_FLAG = "__paganelUiInitialized";

/**
 * Wires up all data-attribute-driven behaviors. Idempotent — safe to call
 * more than once (e.g. from multiple bundled chunks on the same page); the
 * flag is stored on `document` itself so it survives across module copies.
 */
export function initPaganelUI(): void {
  const flagged = document as Document & Record<string, boolean>;
  if (flagged[INIT_FLAG]) return;
  flagged[INIT_FLAG] = true;

  initDropdown();
}
