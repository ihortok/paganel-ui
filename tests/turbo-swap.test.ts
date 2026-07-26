import { describe, expect, it, vi } from "vitest";
import { initPaganelUI } from "../src/core/init";

function dropdownMarkup(idSuffix: string): string {
  return `
    <div class="dropdown">
      <button data-ds-toggle="dropdown" aria-controls="menu-${idSuffix}" aria-expanded="false">Menu</button>
      <div id="menu-${idSuffix}" data-ds-panel="dropdown" hidden></div>
    </div>
  `;
}

function listenerCount(spy: ReturnType<typeof vi.spyOn>, type: string): number {
  return spy.mock.calls.filter((call) => call[0] === type).length;
}

describe("Turbo Drive / SPA re-render resilience", () => {
  it("survives a full document.body.innerHTML swap with no re-init call", () => {
    const addSpy = vi.spyOn(document, "addEventListener");

    initPaganelUI();
    expect(listenerCount(addSpy, "click")).toBe(1);
    expect(listenerCount(addSpy, "keydown")).toBe(1);
    expect(listenerCount(addSpy, "focusout")).toBe(1);

    // Calling init again (e.g. a duplicate <script> or a second bundle chunk
    // importing the package) must be a no-op.
    initPaganelUI();
    expect(listenerCount(addSpy, "click")).toBe(1);

    document.body.innerHTML = dropdownMarkup("a");
    const triggerA = document.querySelector<HTMLElement>("[data-ds-toggle='dropdown']")!;
    const panelA = document.getElementById("menu-a")!;

    triggerA.click();
    expect(panelA.hidden).toBe(false);

    // Simulate a Turbo Drive page swap: brand-new node identities replacing
    // the whole subtree, with no re-init hook of any kind.
    document.body.innerHTML = dropdownMarkup("b");
    const triggerB = document.querySelector<HTMLElement>("[data-ds-toggle='dropdown']")!;
    const panelB = document.getElementById("menu-b")!;

    expect(triggerB).not.toBe(triggerA);

    triggerB.click();
    expect(panelB.hidden).toBe(false);

    // Still exactly one listener of each type after the swap.
    expect(listenerCount(addSpy, "click")).toBe(1);
    expect(listenerCount(addSpy, "keydown")).toBe(1);
    expect(listenerCount(addSpy, "focusout")).toBe(1);

    addSpy.mockRestore();
  });
});
