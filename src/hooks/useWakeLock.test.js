import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWakeLock } from "./useWakeLock";

const makeSentinel = () => ({ release: vi.fn(() => Promise.resolve()) });

beforeEach(() => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  delete navigator.wakeLock;
});

const setWakeLock = (impl) =>
  Object.defineProperty(navigator, "wakeLock", {
    configurable: true,
    value: impl,
  });

describe("useWakeLock", () => {
  it("requests a screen wake lock when enabled and visible", async () => {
    const sentinel = makeSentinel();
    const request = vi.fn(() => Promise.resolve(sentinel));
    setWakeLock({ request });
    renderHook(() => useWakeLock(true));
    await Promise.resolve();
    expect(request).toHaveBeenCalledWith("screen");
  });

  it("releases the sentinel when enabled flips to false", async () => {
    const sentinel = makeSentinel();
    const request = vi.fn(() => Promise.resolve(sentinel));
    setWakeLock({ request });
    const { rerender } = renderHook(({ e }) => useWakeLock(e), {
      initialProps: { e: true },
    });
    await Promise.resolve();
    rerender({ e: false });
    await Promise.resolve();
    expect(sentinel.release).toHaveBeenCalled();
  });

  it("re-arms on visibilitychange → visible", async () => {
    const sentinel = makeSentinel();
    const request = vi.fn(() => Promise.resolve(sentinel));
    setWakeLock({ request });
    renderHook(() => useWakeLock(true));
    await Promise.resolve();
    request.mockClear();

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    await Promise.resolve();
    expect(request).not.toHaveBeenCalled();

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    await Promise.resolve();
    expect(request).toHaveBeenCalledWith("screen");
  });

  it("no-ops when navigator.wakeLock is undefined", () => {
    renderHook(() => useWakeLock(true));
    expect(true).toBe(true);
  });

  it("swallows AbortError from request", async () => {
    const err = new DOMException("aborted", "AbortError");
    setWakeLock({ request: vi.fn(() => Promise.reject(err)) });
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderHook(() => useWakeLock(true));
    await Promise.resolve();
    await Promise.resolve();
    expect(spy).toHaveBeenCalled();
  });
});
