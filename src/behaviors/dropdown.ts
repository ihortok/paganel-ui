import { initDisclosure } from "./disclosure";

/**
 * Dropdown menus: `data-ds-toggle="dropdown"` on the trigger (with
 * `aria-controls="<panel id>"`), `data-ds-panel="dropdown"` + matching `id`
 * on the panel, and optionally `data-ds-dismiss="dropdown"` on items inside
 * the panel that should close it when clicked.
 */
export function initDropdown(): void {
  initDisclosure({ name: "dropdown" });
}
