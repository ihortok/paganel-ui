export interface DisclosureOptions {
  /** Matches `data-ds-toggle="<name>"` triggers and `data-ds-panel="<name>"` panels. */
  name: string;
  /**
   * Reads whether `panel` is currently open. Defaults to `!panel.hidden`.
   * Override for components (e.g. an animated drawer) that can't use the
   * native `hidden` attribute — Tailwind's Preflight marks `[hidden]` as
   * `display: none !important` in `@layer base`, which no later-layer CSS
   * can override (per the Cascade Layers spec, `!important` inverts layer
   * priority), and `display` can't be transitioned anyway.
   */
  isOpen?: (panel: HTMLElement) => boolean;
  /** Applies the open/closed state to `panel`. Defaults to toggling `hidden`. */
  setOpen?: (panel: HTMLElement, open: boolean) => void;
}

interface ResolvedOptions {
  name: string;
  isOpen: (panel: HTMLElement) => boolean;
  setOpen: (panel: HTMLElement, open: boolean) => void;
}

interface Pair {
  trigger: HTMLElement;
  panel: HTMLElement;
}

function findPanel(trigger: HTMLElement): HTMLElement | null {
  const id = trigger.getAttribute("aria-controls");
  return id ? document.getElementById(id) : null;
}

function openPanel(panel: HTMLElement, trigger: HTMLElement, options: ResolvedOptions): void {
  options.setOpen(panel, true);
  trigger.setAttribute("aria-expanded", "true");
}

function closePanel(panel: HTMLElement, trigger: HTMLElement, options: ResolvedOptions): void {
  options.setOpen(panel, false);
  trigger.setAttribute("aria-expanded", "false");
}

/** Resolves the trigger/panel pair for `name` from any element inside either one. */
function resolvePair(el: HTMLElement, options: ResolvedOptions): Pair | null {
  const trigger = el.closest<HTMLElement>(`[data-ds-toggle="${options.name}"]`);
  if (trigger) {
    const panel = findPanel(trigger);
    return panel ? { trigger, panel } : null;
  }

  const panel = el.closest<HTMLElement>(`[data-ds-panel="${options.name}"]`);
  if (panel?.id) {
    const relatedTrigger = document.querySelector<HTMLElement>(`[aria-controls="${panel.id}"]`);
    return relatedTrigger ? { trigger: relatedTrigger, panel } : null;
  }

  return null;
}

function openTriggers(name: string): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(`[data-ds-toggle="${name}"][aria-expanded="true"]`));
}

function closeAllExcept(options: ResolvedOptions, except?: HTMLElement): void {
  for (const trigger of openTriggers(options.name)) {
    if (trigger === except) continue;
    const panel = findPanel(trigger);
    if (panel) closePanel(panel, trigger, options);
  }
}

function closeOutside(options: ResolvedOptions, clickTarget: HTMLElement): void {
  for (const trigger of openTriggers(options.name)) {
    const panel = findPanel(trigger);
    if (!panel) continue;
    if (trigger.contains(clickTarget) || panel.contains(clickTarget)) continue;
    closePanel(panel, trigger, options);
  }
}

function handleClick(event: MouseEvent, options: ResolvedOptions): void {
  const { name } = options;
  const target = event.target as HTMLElement | null;
  if (!target) return;

  const trigger = target.closest<HTMLElement>(`[data-ds-toggle="${name}"]`);
  if (trigger) {
    const panel = findPanel(trigger);
    if (!panel) return;
    event.preventDefault();
    const wasOpen = options.isOpen(panel);
    closeAllExcept(options, trigger);
    if (wasOpen) {
      closePanel(panel, trigger, options);
    } else {
      openPanel(panel, trigger, options);
    }
    return;
  }

  const dismiss = target.closest<HTMLElement>(`[data-ds-dismiss="${name}"]`);
  if (dismiss) {
    const pair = resolvePair(dismiss, options);
    if (pair) closePanel(pair.panel, pair.trigger, options);
    return;
  }

  closeOutside(options, target);
}

function handleKeydown(event: KeyboardEvent, options: ResolvedOptions): void {
  if (event.key !== "Escape") return;
  const trigger = openTriggers(options.name)[0];
  if (!trigger) return;
  const panel = findPanel(trigger);
  if (!panel) return;
  closePanel(panel, trigger, options);
  trigger.focus();
}

function handleFocusout(event: FocusEvent, options: ResolvedOptions): void {
  const leaving = event.target as HTMLElement | null;
  if (!leaving) return;
  const pair = resolvePair(leaving, options);
  if (!pair || !options.isOpen(pair.panel)) return;
  const next = event.relatedTarget as Node | null;
  if (next && (pair.trigger.contains(next) || pair.panel.contains(next))) return;
  closePanel(pair.panel, pair.trigger, options);
}

const defaultIsOpen = (panel: HTMLElement): boolean => !panel.hidden;
const defaultSetOpen = (panel: HTMLElement, open: boolean): void => {
  panel.hidden = !open;
};

/**
 * Wires up a generic open/close ("disclosure") behavior for elements tagged
 * with `data-ds-toggle="<name>"` / `data-ds-panel="<name>"`. All state lives
 * in DOM attributes (`aria-expanded`, plus whatever `isOpen`/`setOpen` read
 * and write — `hidden` by default), so newly-swapped-in markup (e.g. after a
 * Turbo Drive navigation) works with no re-init required.
 *
 * Installs exactly one `click`, `keydown`, and `focusout` listener on
 * `document`, regardless of how many matching elements exist on the page.
 */
export function initDisclosure({
  name,
  isOpen = defaultIsOpen,
  setOpen = defaultSetOpen,
}: DisclosureOptions): void {
  const options: ResolvedOptions = { name, isOpen, setOpen };
  document.addEventListener("click", (event) => handleClick(event as MouseEvent, options));
  document.addEventListener("keydown", (event) => handleKeydown(event as KeyboardEvent, options));
  document.addEventListener("focusout", (event) => handleFocusout(event as FocusEvent, options));
}
