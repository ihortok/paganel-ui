import { describe, expect, it, vi, type MockInstance } from "vitest";
import { initPaganelUI } from "../src/core/init";

function dropdownMarkup(idSuffix: string): string {
  return `
    <div class="dropdown">
      <button data-ds-toggle="dropdown" aria-controls="menu-${idSuffix}" aria-expanded="false">Menu</button>
      <div id="menu-${idSuffix}" data-ds-panel="dropdown" hidden></div>
    </div>
  `;
}

function drawerMarkup(idSuffix: string): string {
  return `
    <div class="drawer">
      <button data-ds-toggle="drawer" aria-controls="sidebar-${idSuffix}" aria-expanded="false">Toggle sidebar</button>
      <div id="sidebar-${idSuffix}" data-ds-panel="drawer"></div>
    </div>
  `;
}

function markup(idSuffix: string): string {
  return dropdownMarkup(idSuffix) + drawerMarkup(idSuffix);
}

function listenerCount(spy: MockInstance<typeof document.addEventListener>, type: string): number {
  return spy.mock.calls.filter((call) => call[0] === type).length;
}

function isDrawerOpen(panel: HTMLElement): boolean {
  return panel.dataset.state === "open";
}

describe("Turbo Drive / SPA re-render resilience", () => {
  it("survives a full document.body.innerHTML swap with no re-init call", () => {
    const addSpy = vi.spyOn(document, "addEventListener");

    // Two registered behaviors (dropdown, drawer) each install their own
    // click/keydown/focusout listener set, so two of each is expected here —
    // not one; the "exactly one per behavior name" invariant lives in
    // src/behaviors/disclosure.ts, not as a single-listener-total guarantee.
    initPaganelUI();
    expect(listenerCount(addSpy, "click")).toBe(2);
    expect(listenerCount(addSpy, "keydown")).toBe(2);
    expect(listenerCount(addSpy, "focusout")).toBe(2);

    // Calling init again (e.g. a duplicate <script> or a second bundle chunk
    // importing the package) must be a no-op.
    initPaganelUI();
    expect(listenerCount(addSpy, "click")).toBe(2);

    document.body.innerHTML = markup("a");
    const dropdownTriggerA = document.querySelector<HTMLElement>("[data-ds-toggle='dropdown']")!;
    const dropdownPanelA = document.getElementById("menu-a")!;
    const drawerTriggerA = document.querySelector<HTMLElement>("[data-ds-toggle='drawer']")!;
    const drawerPanelA = document.getElementById("sidebar-a")!;

    dropdownTriggerA.click();
    expect(dropdownPanelA.hidden).toBe(false);
    drawerTriggerA.click();
    expect(isDrawerOpen(drawerPanelA)).toBe(true);

    // Simulate a Turbo Drive page swap: brand-new node identities replacing
    // the whole subtree, with no re-init hook of any kind.
    document.body.innerHTML = markup("b");
    const dropdownTriggerB = document.querySelector<HTMLElement>("[data-ds-toggle='dropdown']")!;
    const dropdownPanelB = document.getElementById("menu-b")!;
    const drawerTriggerB = document.querySelector<HTMLElement>("[data-ds-toggle='drawer']")!;
    const drawerPanelB = document.getElementById("sidebar-b")!;

    expect(dropdownTriggerB).not.toBe(dropdownTriggerA);
    expect(drawerTriggerB).not.toBe(drawerTriggerA);

    dropdownTriggerB.click();
    expect(dropdownPanelB.hidden).toBe(false);
    drawerTriggerB.click();
    expect(isDrawerOpen(drawerPanelB)).toBe(true);

    // Still exactly two listeners (one per registered behavior) of each type
    // after the swap.
    expect(listenerCount(addSpy, "click")).toBe(2);
    expect(listenerCount(addSpy, "keydown")).toBe(2);
    expect(listenerCount(addSpy, "focusout")).toBe(2);

    addSpy.mockRestore();
  });
});
