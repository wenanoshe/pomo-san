import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCountdown } from "./useCountdown";

const makeController = () => ({ postMessage: vi.fn() });

const makeSW = ({ controller } = {}) => {
  const listeners = new Map();
  const sw = {
    controller,
    ready: Promise.resolve({}),
    addEventListener: vi.fn((ev, cb) => listeners.set(ev, cb)),
    removeEventListener: vi.fn(),
  };
  sw._emit = (ev, payload) => listeners.get(ev)?.(payload);
  return sw;
};

const installSW = (sw) =>
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: sw,
  });

afterEach(() => {
  delete navigator.serviceWorker;
  vi.restoreAllMocks();
});

describe("useCountdown", () => {
  it("posts 'start' on startCountdown(value)", () => {
    const controller = makeController();
    installSW(makeSW({ controller }));
    const { result } = renderHook(() => useCountdown(60));
    act(() => result.current[2](60));
    expect(controller.postMessage).toHaveBeenCalledWith({
      command: "start",
      value: 60,
      notification: undefined,
    });
  });

  it("posts 'start' with notification when passed", () => {
    const controller = makeController();
    installSW(makeSW({ controller }));
    const { result } = renderHook(() => useCountdown(60));
    const msg = { title: "Done", body: "Take a break" };
    act(() => result.current[2](60, msg));
    expect(controller.postMessage).toHaveBeenCalledWith({
      command: "start",
      value: 60,
      notification: msg,
    });
  });

  it("posts 'stop' on stopCountdown", () => {
    const controller = makeController();
    installSW(makeSW({ controller }));
    const { result } = renderHook(() => useCountdown(60));
    act(() => result.current[3]());
    expect(controller.postMessage).toHaveBeenCalledWith({ command: "stop" });
  });

  it("posts 'stop' and resets from initialCount on resetCountdown", () => {
    const controller = makeController();
    installSW(makeSW({ controller }));
    const { result } = renderHook(() => useCountdown(30));
    act(() => result.current[4]());
    expect(controller.postMessage).toHaveBeenCalledWith({ command: "stop" });
    expect(result.current[0].count).toBe(30);
  });

  it("posts 'extend' with value on extendCountdown", () => {
    const controller = makeController();
    installSW(makeSW({ controller }));
    const { result } = renderHook(() => useCountdown(60));
    act(() => result.current[6](30));
    expect(controller.postMessage).toHaveBeenCalledWith({
      command: "extend",
      value: 30,
    });
  });

  const getMessageHandler = (sw) =>
    sw.addEventListener.mock.calls.find((c) => c[0] === "message")?.[1];

  it("a 'tick' message updates count", () => {
    const controller = makeController();
    const sw = makeSW({ controller });
    installSW(sw);
    const { result } = renderHook(() => useCountdown(60));
    act(() => getMessageHandler(sw)({ data: { type: "tick", remaining: 42 } }));
    expect(result.current[0].count).toBe(42);
  });

  it("a 'finish' message flips isCountdownFinished and zeroes count", () => {
    const controller = makeController();
    const sw = makeSW({ controller });
    installSW(sw);
    const { result } = renderHook(() => useCountdown(60));
    act(() => getMessageHandler(sw)({ data: { type: "finish" } }));
    expect(result.current[5]).toBe(true);
    expect(result.current[0].count).toBe(0);
  });

  it("on mount, posts 'query' to resync", () => {
    const controller = makeController();
    installSW(makeSW({ controller }));
    renderHook(() => useCountdown(60));
    expect(controller.postMessage).toHaveBeenCalledWith({ command: "query" });
  });

  it("a query reply with positive remaining updates count from SW", () => {
    const controller = makeController();
    const sw = makeSW({ controller });
    installSW(sw);
    const { result } = renderHook(() => useCountdown(60));
    act(() =>
      getMessageHandler(sw)({ data: { type: "remaining", remaining: 17 } })
    );
    expect(result.current[0].count).toBe(17);
  });

  it("a query reply with remaining: null keeps initial count", () => {
    const controller = makeController();
    const sw = makeSW({ controller });
    installSW(sw);
    const { result } = renderHook(() => useCountdown(60));
    act(() =>
      getMessageHandler(sw)({ data: { type: "remaining", remaining: null } })
    );
    expect(result.current[0].count).toBe(60);
  });

  it("when controller is null initially, sends query after controllerchange", () => {
    const sw = makeSW({ controller: null });
    installSW(sw);
    const controller = makeController();
    renderHook(() => useCountdown(60));
    act(() => {
      Object.defineProperty(navigator.serviceWorker, "controller", {
        configurable: true,
        value: controller,
      });
      sw._emit("controllerchange", {});
    });
    expect(controller.postMessage).toHaveBeenCalledWith({ command: "query" });
  });

  it("when serviceWorker API is missing, does not throw and keeps initial count", () => {
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: undefined,
    });
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderHook(() => useCountdown(45));
    expect(result.current[0].count).toBe(45);
    expect(spy).toHaveBeenCalled();
  });
});
