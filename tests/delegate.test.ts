import { afterEach, describe, expect, it, vi } from "vitest";
import { onDelegate } from "../src/core/delegate";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("onDelegate", () => {
  it("invokes the handler when the event target is inside a matching element", () => {
    document.body.innerHTML = `<button class="target"><span>inner</span></button>`;
    const handler = vi.fn();
    const dispose = onDelegate(document, "click", ".target", handler);

    document.querySelector("span")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][1]).toBe(document.querySelector(".target"));

    dispose();
  });

  it("does not invoke the handler for events outside the selector", () => {
    document.body.innerHTML = `<button class="target"></button><div class="other"></div>`;
    const handler = vi.fn();
    const dispose = onDelegate(document, "click", ".target", handler);

    document.querySelector(".other")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(handler).not.toHaveBeenCalled();
    dispose();
  });

  it("stops invoking the handler once disposed", () => {
    document.body.innerHTML = `<button class="target"></button>`;
    const handler = vi.fn();
    const dispose = onDelegate(document, "click", ".target", handler);
    dispose();

    document.querySelector(".target")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(handler).not.toHaveBeenCalled();
  });

  it("matches elements rendered after the listener was registered", () => {
    document.body.innerHTML = "";
    const handler = vi.fn();
    const dispose = onDelegate(document, "click", ".target", handler);

    document.body.innerHTML = `<button class="target"></button>`;
    document.querySelector(".target")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(handler).toHaveBeenCalledTimes(1);
    dispose();
  });
});
