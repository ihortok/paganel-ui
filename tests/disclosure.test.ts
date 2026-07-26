import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { initDisclosure } from "../src/behaviors/disclosure";

function renderDropdown(): void {
  document.body.innerHTML = `
    <div class="dropdown">
      <button data-ds-toggle="dropdown" aria-controls="menu1" aria-expanded="false">Menu</button>
      <div id="menu1" data-ds-panel="dropdown" hidden>
        <button data-ds-dismiss="dropdown">Item</button>
      </div>
    </div>
  `;
}

describe("disclosure (dropdown)", () => {
  // Registered once for the whole file — initDisclosure installs document
  // listeners with no dispose/idempotency guard of its own (that lives in
  // core/init.ts), so calling it per-test would stack duplicate listeners.
  beforeAll(() => {
    initDisclosure({ name: "dropdown" });
  });

  beforeEach(() => {
    renderDropdown();
  });

  it("opens the panel and sets aria-expanded on trigger click", () => {
    const trigger = document.querySelector<HTMLElement>("[data-ds-toggle='dropdown']")!;
    const panel = document.getElementById("menu1")!;

    trigger.click();

    expect(panel.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("closes the panel when the trigger is clicked again", () => {
    const trigger = document.querySelector<HTMLElement>("[data-ds-toggle='dropdown']")!;
    const panel = document.getElementById("menu1")!;

    trigger.click();
    trigger.click();

    expect(panel.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes when clicking outside the dropdown", () => {
    const trigger = document.querySelector<HTMLElement>("[data-ds-toggle='dropdown']")!;
    const panel = document.getElementById("menu1")!;

    trigger.click();
    expect(panel.hidden).toBe(false);

    document.body.click();

    expect(panel.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes on Escape and returns focus to the trigger", () => {
    const trigger = document.querySelector<HTMLElement>("[data-ds-toggle='dropdown']")!;
    const panel = document.getElementById("menu1")!;

    trigger.click();
    expect(panel.hidden).toBe(false);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(panel.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it("closes when a data-ds-dismiss item inside the panel is clicked", () => {
    const trigger = document.querySelector<HTMLElement>("[data-ds-toggle='dropdown']")!;
    const panel = document.getElementById("menu1")!;

    trigger.click();
    expect(panel.hidden).toBe(false);

    document.querySelector<HTMLElement>("[data-ds-dismiss='dropdown']")!.click();

    expect(panel.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes when focus moves outside both the trigger and the panel", () => {
    document.body.insertAdjacentHTML("beforeend", `<input id="outside" />`);
    const trigger = document.querySelector<HTMLElement>("[data-ds-toggle='dropdown']")!;
    const panel = document.getElementById("menu1")!;

    trigger.click();
    expect(panel.hidden).toBe(false);

    const outside = document.getElementById("outside")!;
    trigger.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: outside }));

    expect(panel.hidden).toBe(true);
  });

  it("does not close when focus moves from the trigger into the panel", () => {
    const trigger = document.querySelector<HTMLElement>("[data-ds-toggle='dropdown']")!;
    const panel = document.getElementById("menu1")!;
    const item = document.querySelector<HTMLElement>("[data-ds-dismiss='dropdown']")!;

    trigger.click();
    expect(panel.hidden).toBe(false);

    trigger.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: item }));

    expect(panel.hidden).toBe(false);
  });
});
