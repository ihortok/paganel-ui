import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { initDrawer } from "../src/behaviors/drawer";

function renderDrawer(): void {
  document.body.innerHTML = `
    <header>
      <button data-ds-toggle="drawer" aria-controls="sidebar-drawer" aria-expanded="false">Menu</button>
      <span id="header-brand">Paganel UI</span>
    </header>
    <div id="sidebar-drawer" data-ds-panel="drawer">
      <div id="backdrop" data-ds-dismiss="drawer"></div>
      <aside>
        <a id="nav-link" href="#" data-ds-dismiss="drawer">Dashboard</a>
      </aside>
    </div>
  `;
}

function isOpen(panel: HTMLElement): boolean {
  return panel.dataset.state === "open";
}

describe("disclosure (drawer)", () => {
  // Registered once for the whole file, matching tests/disclosure.test.ts —
  // initDisclosure has no dispose/idempotency guard of its own (that lives
  // in core/init.ts), so calling it per-test would stack duplicate listeners.
  beforeAll(() => {
    initDrawer();
  });

  beforeEach(() => {
    renderDrawer();
  });

  it("opens the panel and sets aria-expanded on toggle click", () => {
    const trigger = document.querySelector<HTMLElement>("[data-ds-toggle='drawer']")!;
    const panel = document.getElementById("sidebar-drawer")!;

    trigger.click();

    expect(isOpen(panel)).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("closes the panel when the toggle is clicked again", () => {
    const trigger = document.querySelector<HTMLElement>("[data-ds-toggle='drawer']")!;
    const panel = document.getElementById("sidebar-drawer")!;

    trigger.click();
    trigger.click();

    expect(isOpen(panel)).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes when the backdrop is clicked", () => {
    const trigger = document.querySelector<HTMLElement>("[data-ds-toggle='drawer']")!;
    const panel = document.getElementById("sidebar-drawer")!;

    trigger.click();
    expect(isOpen(panel)).toBe(true);

    document.getElementById("backdrop")!.click();

    expect(isOpen(panel)).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes when a nav link inside the panel is clicked", () => {
    const trigger = document.querySelector<HTMLElement>("[data-ds-toggle='drawer']")!;
    const panel = document.getElementById("sidebar-drawer")!;

    trigger.click();
    expect(isOpen(panel)).toBe(true);

    document.getElementById("nav-link")!.click();

    expect(isOpen(panel)).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes on Escape and returns focus to the toggle", () => {
    const trigger = document.querySelector<HTMLElement>("[data-ds-toggle='drawer']")!;
    const panel = document.getElementById("sidebar-drawer")!;

    trigger.click();
    expect(isOpen(panel)).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(isOpen(panel)).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("closes when clicking outside the toggle and the panel", () => {
    const trigger = document.querySelector<HTMLElement>("[data-ds-toggle='drawer']")!;
    const panel = document.getElementById("sidebar-drawer")!;

    trigger.click();
    expect(isOpen(panel)).toBe(true);

    document.getElementById("header-brand")!.click();

    expect(isOpen(panel)).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("does not close when clicking inside the panel on a non-dismiss element", () => {
    const trigger = document.querySelector<HTMLElement>("[data-ds-toggle='drawer']")!;
    const panel = document.getElementById("sidebar-drawer")!;

    trigger.click();
    expect(isOpen(panel)).toBe(true);

    panel.querySelector("aside")!.click();

    expect(isOpen(panel)).toBe(true);
  });
});
