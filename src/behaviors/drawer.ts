import { initDisclosure } from "./disclosure";

/**
 * Off-canvas sidebar drawer: `data-ds-toggle="drawer"` on the trigger (with
 * `aria-controls="<panel id>"`), `data-ds-panel="drawer"` + matching `id` on
 * the wrapper panel, and optionally `data-ds-dismiss="drawer"` on the
 * backdrop or nav links inside the panel that should close it when clicked.
 *
 * Uses `data-state="open"|"closed"` on the panel instead of the default
 * `hidden`-attribute strategy so the drawer can animate — Tailwind's
 * Preflight forces `[hidden]` to `display: none !important`, which can't be
 * overridden by later-layer CSS and can't be transitioned in any case. CSS
 * reacts to `data-state` with `transform`/`visibility` instead.
 */
export function initDrawer(): void {
  initDisclosure({
    name: "drawer",
    isOpen: (panel) => panel.dataset.state === "open",
    setOpen: (panel, open) => {
      panel.dataset.state = open ? "open" : "closed";
    },
  });
}
