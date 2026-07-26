export interface DisclosureOptions {
  /** Matches `data-ds-toggle="<name>"` triggers and `data-ds-panel="<name>"` panels. */
  name: string;
}

interface Pair {
  trigger: HTMLElement;
  panel: HTMLElement;
}

function findPanel(trigger: HTMLElement): HTMLElement | null {
  const id = trigger.getAttribute("aria-controls");
  return id ? document.getElementById(id) : null;
}

function isOpen(panel: HTMLElement): boolean {
  return !panel.hidden;
}

function openPanel(panel: HTMLElement, trigger: HTMLElement): void {
  panel.hidden = false;
  trigger.setAttribute("aria-expanded", "true");
}

function closePanel(panel: HTMLElement, trigger: HTMLElement): void {
  panel.hidden = true;
  trigger.setAttribute("aria-expanded", "false");
}

/** Resolves the trigger/panel pair for `name` from any element inside either one. */
function resolvePair(el: HTMLElement, name: string): Pair | null {
  const trigger = el.closest<HTMLElement>(`[data-ds-toggle="${name}"]`);
  if (trigger) {
    const panel = findPanel(trigger);
    return panel ? { trigger, panel } : null;
  }

  const panel = el.closest<HTMLElement>(`[data-ds-panel="${name}"]`);
  if (panel?.id) {
    const relatedTrigger = document.querySelector<HTMLElement>(`[aria-controls="${panel.id}"]`);
    return relatedTrigger ? { trigger: relatedTrigger, panel } : null;
  }

  return null;
}

function openTriggers(name: string): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(`[data-ds-toggle="${name}"][aria-expanded="true"]`));
}

function closeAllExcept(name: string, except?: HTMLElement): void {
  for (const trigger of openTriggers(name)) {
    if (trigger === except) continue;
    const panel = findPanel(trigger);
    if (panel) closePanel(panel, trigger);
  }
}

function closeOutside(name: string, clickTarget: HTMLElement): void {
  for (const trigger of openTriggers(name)) {
    const panel = findPanel(trigger);
    if (!panel) continue;
    if (trigger.contains(clickTarget) || panel.contains(clickTarget)) continue;
    closePanel(panel, trigger);
  }
}

function handleClick(event: MouseEvent, name: string): void {
  const target = event.target as HTMLElement | null;
  if (!target) return;

  const trigger = target.closest<HTMLElement>(`[data-ds-toggle="${name}"]`);
  if (trigger) {
    const panel = findPanel(trigger);
    if (!panel) return;
    event.preventDefault();
    const wasOpen = isOpen(panel);
    closeAllExcept(name, trigger);
    if (wasOpen) {
      closePanel(panel, trigger);
    } else {
      openPanel(panel, trigger);
    }
    return;
  }

  const dismiss = target.closest<HTMLElement>(`[data-ds-dismiss="${name}"]`);
  if (dismiss) {
    const pair = resolvePair(dismiss, name);
    if (pair) closePanel(pair.panel, pair.trigger);
    return;
  }

  closeOutside(name, target);
}

function handleKeydown(event: KeyboardEvent, name: string): void {
  if (event.key !== "Escape") return;
  const trigger = openTriggers(name)[0];
  if (!trigger) return;
  const panel = findPanel(trigger);
  if (!panel) return;
  closePanel(panel, trigger);
  trigger.focus();
}

function handleFocusout(event: FocusEvent, name: string): void {
  const leaving = event.target as HTMLElement | null;
  if (!leaving) return;
  const pair = resolvePair(leaving, name);
  if (!pair || !isOpen(pair.panel)) return;
  const next = event.relatedTarget as Node | null;
  if (next && (pair.trigger.contains(next) || pair.panel.contains(next))) return;
  closePanel(pair.panel, pair.trigger);
}

/**
 * Wires up a generic open/close ("disclosure") behavior for elements tagged
 * with `data-ds-toggle="<name>"` / `data-ds-panel="<name>"`. All state lives
 * in DOM attributes (`aria-expanded`, `hidden`), so newly-swapped-in markup
 * (e.g. after a Turbo Drive navigation) works with no re-init required.
 *
 * Installs exactly one `click`, `keydown`, and `focusout` listener on
 * `document`, regardless of how many matching elements exist on the page.
 */
export function initDisclosure({ name }: DisclosureOptions): void {
  document.addEventListener("click", (event) => handleClick(event as MouseEvent, name));
  document.addEventListener("keydown", (event) => handleKeydown(event as KeyboardEvent, name));
  document.addEventListener("focusout", (event) => handleFocusout(event as FocusEvent, name));
}
